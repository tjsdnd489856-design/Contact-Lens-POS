import { ProductService } from '../services/product.service.js';

export default class DiscardInventoryModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._products = []; // All products
        this._selectedProductsToDiscard = new Map(); // Map to store {productId: quantity}
        this._currentFilterBrand = null; // New state variable for filtering by brand
    }

    setProducts(products) {
        this._products = ProductService.getProducts().map(p => ({ ...p, discardQuantity: 0 })); // Refresh products and add discardQuantity
        this._selectedProductsToDiscard.clear(); // Clear selections when new products are set
        this._currentFilterBrand = null; // Reset brand filter when new products are set
        this._render();
    }

    connectedCallback() {
        this._render();
    }

    _handleDiscardQuantityChange(productId, quantity) {
        const product = this._products.find(p => p.id === productId);
        if (product) {
            const numQuantity = parseInt(quantity, 10);
            const item = this.shadowRoot.querySelector(`.product-list-item[data-product-id="${productId}"]`);

            if (!isNaN(numQuantity) && numQuantity >= 0 && numQuantity <= product.quantity) {
                this._selectedProductsToDiscard.set(productId, numQuantity);
                product.discardQuantity = numQuantity;
                if (numQuantity > 0) {
                    item.classList.add('selected');
                } else {
                    this._selectedProductsToDiscard.delete(productId); // If quantity becomes 0, remove from selected
                    item.classList.remove('selected');
                }
            } else {
                // If invalid input, reset to 0 and deselect
                this._selectedProductsToDiscard.delete(productId);
                product.discardQuantity = 0;
                item.classList.remove('selected');
                const inputElement = item.querySelector('.discard-quantity-input');
                if (inputElement) inputElement.value = 0; // Reset input field visually
                alert(`폐기 수량은 0 이상 ${product.quantity} 이하로 입력해주세요.`);
            }
        }
    }

    _discardSelectedProducts() {
        if (this._selectedProductsToDiscard.size === 0) {
            alert('폐기할 제품을 선택해주세요.');
            return;
        }

        const confirmation = confirm('선택한 제품을 폐기하시겠습니까?');
        if (confirmation) {
            this._selectedProductsToDiscard.forEach((quantity, productId) => {
                if (quantity > 0) {
                    ProductService.decreaseStock(productId, quantity);
                }
            });
            this._selectedProductsToDiscard.clear();
            // Refresh products and re-render after discarding
            this._products = ProductService.getProducts().map(p => ({ ...p, discardQuantity: 0 }));
            this._currentFilterBrand = null; // Go back to brand selection after discarding
            document.dispatchEvent(new CustomEvent('closeDiscardInventoryModal'));
            alert('제품이 성공적으로 폐기되었습니다.');
        }
    }

    _filterByBrand(brand) {
        this._currentFilterBrand = brand;
        this._render();
    }

    _showAllBrands() {
        this._currentFilterBrand = null;
        this._render();
    }

    _render() {
        const uniqueBrands = [...new Set(ProductService.getProducts().map(p => p.brand))];

        let contentHtml = '';
        let modalTitle = '재고 폐기';

        if (this._currentFilterBrand) {
            modalTitle = `${this._currentFilterBrand} 제품 폐기`;
            const filteredProducts = this._products.filter(p => p.brand === this._currentFilterBrand);
            contentHtml = filteredProducts.length === 0
                ? `<p class="message">"${this._currentFilterBrand}" 브랜드의 제품이 없습니다.</p>`
                : `
                    <button class="back-to-brands-btn">← 전체 브랜드 보기</button>
                    <div class="product-list">
                        ${filteredProducts.map(product => `
                            <div class="product-list-item ${this._selectedProductsToDiscard.has(product.id) && this._selectedProductsToDiscard.get(product.id) > 0 ? 'selected' : ''}" data-product-id="${product.id}">
                                <div class="product-info-main">
                                    <span class="brand-model">${product.brand} - ${product.model}</span>
                                    <span class="quantity-display">수량: ${product.quantity}</span>
                                </div>
                                <div class="product-info-detail">
                                    <span class="power-axis-combined">
                                        S: ${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'} |
                                        C: ${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'} |
                                        AX: ${product.powerAX !== null ? product.powerAX : 'N/A'}
                                    </span>
                                </div>
                                <div class="discard-control">
                                    <label for="discard-qty-${product.id}" class="discard-label">폐기 수량:</label>
                                    <input type="number" id="discard-qty-${product.id}" min="0" max="${product.quantity}" value="${this._selectedProductsToDiscard.get(product.id) || 0}"
                                           data-product-id="${product.id}" class="discard-quantity-input">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button id="discard-confirm-btn">선택 제품 폐기</button>
                    </div>
                `;
        } else {
            contentHtml = uniqueBrands.length === 0
                ? '<p class="message">등록된 브랜드가 없습니다.</p>'
                : `
                    <div class="brand-buttons-grid">
                        ${uniqueBrands.map(brand => `
                            <button class="brand-filter-button" data-brand="${brand}">${brand}</button>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button id="discard-confirm-btn" disabled>선택 제품 폐기</button>
                    </div>
                `;
        }

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .discard-container {
                    padding: 20px;
                }
                h3 {
                    margin-top: 0;
                    color: #333;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .message {
                    text-align: center;
                    padding: 20px;
                    color: #555;
                }
                .brand-buttons-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 15px;
                    margin-top: 1rem;
                }
                .brand-filter-button {
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    padding: 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1em;
                    font-weight: bold;
                    text-align: center;
                    transition: background-color 0.2s, border-color 0.2s;
                }
                .brand-filter-button:hover {
                    background-color: #e0e0e0;
                    border-color: #a0a0a0;
                }
                /* Product List Styles */
                .product-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 1rem;
                }
                .product-list-item {
                    background-color: #f9f9f9;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                    transition: all 0.2s ease-in-out;
                    cursor: pointer; /* Indicate clickability */
                }
                .product-list-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .product-list-item.selected {
                    border-color: #007bff;
                    box-shadow: 0 0 10px rgba(0, 123, 255, 0.2);
                    background-color: #e7f3ff;
                }
                .product-info-main {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    color: #333;
                    font-size: 1.1em;
                }
                .product-info-detail {
                    white-space: nowrap; /* Keep content on a single line */
                    overflow: hidden; /* Hide overflow */
                    text-overflow: ellipsis; /* Add ellipsis for overflow */
                }
                .power-axis-combined {
                    font-size: 0.9em;
                    color: #666;
                }
                .discard-control {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 10px;
                }
                .discard-label {
                    font-size: 0.9em;
                    color: #555;
                }
                .discard-quantity-input {
                    width: 70px;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    text-align: center;
                    -moz-appearance: textfield; /* Firefox */
                }
                .discard-quantity-input::-webkit-outer-spin-button,
                .discard-quantity-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 20px;
                }
                #discard-confirm-btn {
                    background-color: #dc3545; /* Red for discard */
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: background-color 0.2s;
                }
                #discard-confirm-btn:hover {
                    background-color: #c82333;
                }
                #discard-confirm-btn:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
                .back-to-brands-btn {
                    background-color: #6c757d;
                    color: white;
                    padding: 8px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-bottom: 15px;
                    font-size: 0.9em;
                    transition: background-color 0.2s;
                }
                .back-to-brands-btn:hover {
                    background-color: #5a6268;
                }
            </style>
            <div class="discard-container">
                <h3>${modalTitle}</h3>
                ${contentHtml}
            </div>
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Add event listeners based on the current view
        if (this._currentFilterBrand) {
            // Product view (list items)
            this.shadowRoot.querySelectorAll('.product-list-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    // Prevent interaction with input from toggling selection
                    if (e.target.classList.contains('discard-quantity-input') || e.target.tagName === 'LABEL') {
                        return;
                    }

                    const productId = parseInt(item.dataset.productId, 10);
                    const product = this._products.find(p => p.id === productId);
                    const inputElement = item.querySelector('.discard-quantity-input');

                    if (this._selectedProductsToDiscard.has(productId) && this._selectedProductsToDiscard.get(productId) > 0) {
                        // If already selected with a quantity, deselect it
                        this._selectedProductsToDiscard.delete(productId);
                        product.discardQuantity = 0;
                        item.classList.remove('selected');
                        if (inputElement) inputElement.value = 0;
                    } else {
                        // If not selected, select it with a default quantity of 1 (or its current quantity if it was 0)
                        const quantityToSet = product.discardQuantity > 0 ? product.discardQuantity : 1;
                        if (quantityToSet <= product.quantity) {
                            this._selectedProductsToDiscard.set(productId, quantityToSet);
                            product.discardQuantity = quantityToSet;
                            item.classList.add('selected');
                            if (inputElement) inputElement.value = quantityToSet;
                        } else {
                            alert(`폐기 수량은 0 이상 ${product.quantity} 이하로 입력해주세요.`);
                        }
                    }
                    this._updateDiscardButtonState();
                });
            });
            this.shadowRoot.querySelectorAll('.discard-quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const productId = parseInt(e.target.dataset.productId, 10);
                    this._handleDiscardQuantityChange(productId, e.target.value);
                    this._updateDiscardButtonState();
                });
                input.addEventListener('input', (e) => {
                    const productId = parseInt(e.target.dataset.productId, 10);
                    const product = this._products.find(p => p.id === productId);
                    const numQuantity = parseInt(e.target.value, 10);

                    const item = e.target.closest('.product-list-item');
                    if (!isNaN(numQuantity) && numQuantity >= 0 && numQuantity <= product.quantity) {
                        this._selectedProductsToDiscard.set(productId, numQuantity);
                        product.discardQuantity = numQuantity;
                        if (numQuantity > 0) {
                            item.classList.add('selected');
                        } else {
                            this._selectedProductsToDiscard.delete(productId);
                            item.classList.remove('selected');
                        }
                    } else if (numQuantity === 0) {
                        this._selectedProductsToDiscard.delete(productId);
                        product.discardQuantity = 0;
                        item.classList.remove('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                    this._updateDiscardButtonState();
                });
            });
            this.shadowRoot.getElementById('discard-confirm-btn').addEventListener('click', this._discardSelectedProducts);
            this.shadowRoot.querySelector('.back-to-brands-btn').addEventListener('click', () => this._showAllBrands());
        } else {
            // Brand selection view
            this.shadowRoot.querySelectorAll('.brand-filter-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const brand = e.target.dataset.brand;
                    this._filterByBrand(brand);
                });
            });
             // The discard button should be disabled in brand selection view
            const discardButton = this.shadowRoot.getElementById('discard-confirm-btn');
            if (discardButton) {
                discardButton.disabled = true;
            }
        }
        this._updateDiscardButtonState(); // Initial state for the discard button
    }

    _updateDiscardButtonState() {
        const discardButton = this.shadowRoot.getElementById('discard-confirm-btn');
        if (discardButton) {
            let totalDiscardQuantity = 0;
            this._selectedProductsToDiscard.forEach(qty => totalDiscardQuantity += qty);
            discardButton.disabled = totalDiscardQuantity === 0;
        }
    }
}

customElements.define('discard-inventory-modal', DiscardInventoryModal);