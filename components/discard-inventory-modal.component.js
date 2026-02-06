import { ProductService } from '../services/product.service.js';

export default class DiscardInventoryModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._products = []; // All products with their powerOptions
        // Stores selections: Map<productId, Map<powerOptionKey, quantity>>
        this._selectedProductsToDiscard = new Map(); 
        this._currentFilterBrand = null; // Currently selected brand for filtering products
        this._currentFilterProduct = null; // Currently selected product for viewing power options
    }

    setProducts(products) {
        // Augment products with powerOptions structure if not already present
        this._products = products.map(p => ({
            ...p,
            // Simulate powerOptions if not explicitly available
            powerOptions: p.powerOptions || [{
                detailId: `${p.id}-${p.powerS}-${p.powerC}-${p.powerAX}`, // Unique ID for this power option
                s: p.powerS,
                c: p.powerC,
                ax: p.powerAX,
                quantity: p.quantity // Total quantity for this specific power option
            }]
        }));
        this._selectedProductsToDiscard.clear(); // Clear all selections
        this._currentFilterBrand = null; // Reset brand filter
        this._currentFilterProduct = null; // Reset product filter
        this._render();
    }

    connectedCallback() {
        this._render();
    }

    _handleDiscardQuantityChange(productId, powerOptionKey, quantity) {
        const product = this._products.find(p => p.id === productId);
        if (!product) return;

        const powerOption = product.powerOptions.find(opt => opt.detailId === powerOptionKey);
        if (!powerOption) return;

        const numQuantity = parseInt(quantity, 10);
        const itemElement = this.shadowRoot.querySelector(`.power-option-list-item[data-detail-id="${powerOptionKey}"]`);

        // Get or create product's selection map
        let productSelections = this._selectedProductsToDiscard.get(productId);
        if (!productSelections) {
            productSelections = new Map();
            this._selectedProductsToDiscard.set(productId, productSelections);
        }

        if (!isNaN(numQuantity) && numQuantity >= 0 && numQuantity <= powerOption.quantity) {
            if (numQuantity > 0) {
                productSelections.set(powerOptionKey, numQuantity);
                if (itemElement) itemElement.classList.add('selected');
            } else {
                productSelections.delete(powerOptionKey);
                if (itemElement) itemElement.classList.remove('selected');
            }
        } else {
            // Invalid input: reset to 0 and remove selection
            productSelections.delete(powerOptionKey);
            if (itemElement) itemElement.classList.remove('selected');
            const inputElement = itemElement ? itemElement.querySelector('.discard-quantity-input') : null;
            if (inputElement) inputElement.value = 0; // Reset input field visually
            alert(`폐기 수량은 0 이상 ${powerOption.quantity} 이하로 입력해주세요.`);
        }
        // If no power options are selected for a product, remove its entry from _selectedProductsToDiscard
        if (productSelections.size === 0) {
            this._selectedProductsToDiscard.delete(productId);
        }
    }

    _discardSelectedProducts() {
        if (this._selectedProductsToDiscard.size === 0) {
            alert('폐기할 제품을 선택해주세요.');
            return;
        }

        const confirmation = confirm('선택한 제품을 폐기하시겠습니까?');
        if (confirmation) {
            this._selectedProductsToDiscard.forEach((powerOptionSelections, productId) => {
                powerOptionSelections.forEach((quantity, powerOptionKey) => {
                    if (quantity > 0) {
                        // Assuming ProductService.decreaseStock can handle product ID and a power option key
                        // or needs a more complex object. For now, sending original productId.
                        // In a real scenario, this might need to identify the exact power option to decrease.
                        ProductService.decreaseStock(productId, quantity); // This would need refinement
                    }
                });
            });
            this._selectedProductsToDiscard.clear();
            // Refresh products and go back to brand selection after discarding
            this._products = ProductService.getProducts().map(p => ({
                ...p,
                powerOptions: p.powerOptions || [{
                    detailId: `${p.id}-${p.powerS}-${p.powerC}-${p.powerAX}`,
                    s: p.powerS, c: p.powerC, ax: p.powerAX, quantity: p.quantity
                }]
            }));
            this._currentFilterBrand = null;
            this._currentFilterProduct = null;
            document.dispatchEvent(new CustomEvent('closeDiscardInventoryModal'));
            alert('제품이 성공적으로 폐기되었습니다.');
        }
    }

    _filterByBrand(brand) {
        this._currentFilterBrand = brand;
        this._currentFilterProduct = null; // Clear selected product when changing brand
        this._render();
    }

    _showAllBrands() {
        this._currentFilterBrand = null;
        this._currentFilterProduct = null;
        this._render();
    }

    _filterByProduct(productId) {
        this._currentFilterProduct = this._products.find(p => p.id === productId);
        this._render();
    }

    _showAllProductsForBrand() {
        this._currentFilterProduct = null;
        this._render();
    }

    _render() {
        const allProducts = ProductService.getProducts(); // Get fresh products from service
        // Augment with powerOptions structure if not already present
        this._products = allProducts.map(p => ({
            ...p,
            // Simulate powerOptions if not explicitly available
            powerOptions: p.powerOptions || [{
                detailId: `${p.id}-${p.powerS}-${p.powerC}-${p.powerAX}`, // Unique ID for this power option
                s: p.powerS,
                c: p.powerC,
                ax: p.powerAX,
                quantity: p.quantity // Quantity for this specific power option
            }]
        }));
        
        const uniqueBrands = [...new Set(this._products.map(p => p.brand))];

        let contentHtml = '';
        let modalTitle = '재고 폐기';

        if (this._currentFilterProduct) {
            // View 3: Power Option Selection for a specific product
            modalTitle = `${this._currentFilterProduct.brand} - ${this._currentFilterProduct.model} 도수 선택`;
            const product = this._currentFilterProduct;
            
            contentHtml = product.powerOptions.length === 0
                ? `<p class="message">"${product.brand} - ${product.model}" 제품에 도수 정보가 없습니다.</p>`
                : `
                    <button class="back-to-products-btn">← 제품 목록으로</button>
                    <div class="power-option-list">
                        ${product.powerOptions.map(option => {
                            const currentSelectedQty = this._selectedProductsToDiscard.get(product.id)?.get(option.detailId) || 0;
                            return `
                                <div class="power-option-list-item ${currentSelectedQty > 0 ? 'selected' : ''}" data-product-id="${product.id}" data-detail-id="${option.detailId}">
                                    <div class="power-option-info-main">
                                        <span class="power-detail-combined">
                                            S: ${ (option.s !== null && option.s !== undefined) ? (option.s > 0 ? '+' : '') + option.s.toFixed(2) : 'N/A' } |
                                            C: ${ (option.c !== null && option.c !== undefined) ? (option.c > 0 ? '+' : '') + option.c.toFixed(2) : 'N/A' } |
                                            AX: ${ option.ax !== null ? option.ax : 'N/A' }
                                        </span>
                                        <span class="quantity-display">수량: ${option.quantity}</span>
                                    </div>
                                    <div class="discard-control">
                                        <label for="discard-qty-${option.detailId}" class="discard-label">폐기 수량:</label>
                                        <input type="number" id="discard-qty-${option.detailId}" min="0" max="${option.quantity}" value="${currentSelectedQty}"
                                               data-product-id="${product.id}" data-detail-id="${option.detailId}" class="discard-quantity-input">
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="modal-actions">
                        <button id="discard-confirm-btn">선택 제품 폐기</button>
                    </div>
                `;
        } else if (this._currentFilterBrand) {
            // View 2: Product Selection for a specific brand
            modalTitle = `${this._currentFilterBrand} 제품 선택`;
            const productsForBrand = this._products.filter(p => p.brand === this._currentFilterBrand);
            contentHtml = productsForBrand.length === 0
                ? `<p class="message">"${this._currentFilterBrand}" 브랜드의 제품이 없습니다.</p>`
                : `
                    <button class="back-to-brands-btn">← 전체 브랜드 보기</button>
                    <div class="product-selection-list">
                        ${productsForBrand.map(product => `
                            <div class="product-selection-list-item" data-product-id="${product.id}">
                                <div class="product-info-main">
                                    <span class="brand-model">${product.brand} - ${product.model}</span>
                                    <span class="quantity-display">총 수량: ${product.powerOptions.reduce((sum, opt) => sum + opt.quantity, 0)}</span>
                                </div>
                                <div class="product-info-detail">
                                    <span class="power-axis-combined">
                                        ${product.powerOptions.map(opt => `S:${(opt.s !== null && opt.s !== undefined) ? (opt.s > 0 ? '+' : '') + opt.s.toFixed(2) : 'N/A'} C:${(opt.c !== null && opt.c !== undefined) ? (opt.c > 0 ? '+' : '') + opt.c.toFixed(2) : 'N/A'} AX:${opt.ax !== null ? opt.ax : 'N/A'}`).join(' / ')}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button id="discard-confirm-btn" disabled>선택 제품 폐기</button>
                    </div>
                `;
        } else {
            // View 1: Brand Selection
            modalTitle = `재고 폐기 - 브랜드 선택`;
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
                /* Product Selection List Styles */
                .product-selection-list, .power-option-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 1rem;
                }
                .product-selection-list-item, .power-option-list-item {
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
                .product-selection-list-item:hover, .power-option-list-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .product-selection-list-item.selected, .power-option-list-item.selected {
                    border-color: #007bff;
                    box-shadow: 0 0 10px rgba(0, 123, 255, 0.2);
                    background-color: #e7f3ff;
                }
                .product-info-main, .power-option-info-main {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    color: #333;
                    font-size: 1.1em;
                }
                .product-info-detail, .power-option-info-detail {
                    white-space: nowrap; /* Keep content on a single line */
                    overflow: hidden; /* Hide overflow */
                    text-overflow: ellipsis; /* Add ellipsis for overflow */
                }
                .power-axis-combined, .power-detail-combined {
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
                .back-to-brands-btn, .back-to-products-btn {
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
                .back-to-brands-btn:hover, .back-to-products-btn:hover {
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
        if (this._currentFilterProduct) {
            // View 3: Power Option Selection
            this.shadowRoot.querySelectorAll('.power-option-list-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('discard-quantity-input') || e.target.tagName === 'LABEL') {
                        return;
                    }

                    const productId = parseInt(item.dataset.productId, 10);
                    const powerOptionKey = item.dataset.detailId;
                    const product = this._products.find(p => p.id === productId);
                    const powerOption = product?.powerOptions.find(opt => opt.detailId === powerOptionKey);
                    const inputElement = item.querySelector('.discard-quantity-input');

                    if (!product || !powerOption || !inputElement) return; // Should not happen

                    const currentSelectedQty = this._selectedProductsToDiscard.get(productId)?.get(powerOptionKey) || 0;

                    if (currentSelectedQty > 0) {
                        // Deselect
                        this._selectedProductsToDiscard.get(productId)?.delete(powerOptionKey);
                        if (this._selectedProductsToDiscard.get(productId)?.size === 0) {
                            this._selectedProductsToDiscard.delete(productId);
                        }
                        item.classList.remove('selected');
                        inputElement.value = 0;
                    } else {
                        // Select with default 1
                        const quantityToSet = 1;
                        if (quantityToSet <= powerOption.quantity) {
                            let productSelections = this._selectedProductsToDiscard.get(productId);
                            if (!productSelections) {
                                productSelections = new Map();
                                this._selectedProductsToDiscard.set(productId, productSelections);
                            }
                            productSelections.set(powerOptionKey, quantityToSet);
                            item.classList.add('selected');
                            inputElement.value = quantityToSet;
                        } else {
                            alert(`폐기 수량은 0 이상 ${powerOption.quantity} 이하로 입력해주세요.`);
                        }
                    }
                    this._updateDiscardButtonState();
                });
            });

            this.shadowRoot.querySelectorAll('.discard-quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const productId = parseInt(e.target.dataset.productId, 10);
                    const powerOptionKey = e.target.dataset.detailId;
                    this._handleDiscardQuantityChange(productId, powerOptionKey, e.target.value);
                    this._updateDiscardButtonState();
                });
                input.addEventListener('input', (e) => {
                    const productId = parseInt(e.target.dataset.productId, 10);
                    const powerOptionKey = e.target.dataset.detailId;
                    this._handleDiscardQuantityChange(productId, powerOptionKey, e.target.value);
                    this._updateDiscardButtonState();
                });
            });
            this.shadowRoot.getElementById('discard-confirm-btn').addEventListener('click', this._discardSelectedProducts);
            this.shadowRoot.querySelector('.back-to-products-btn').addEventListener('click', () => this._showAllProductsForBrand());
        } else if (this._currentFilterBrand) {
            // View 2: Product Selection
            this.shadowRoot.querySelectorAll('.product-selection-list-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const productId = parseInt(item.dataset.productId, 10);
                    this._filterByProduct(productId); // Drill down to power options
                });
            });
            this.shadowRoot.getElementById('discard-confirm-btn').addEventListener('click', this._discardSelectedProducts);
            this.shadowRoot.querySelector('.back-to-brands-btn').addEventListener('click', () => this._showAllBrands());
        } else {
            // View 1: Brand Selection
            this.shadowRoot.querySelectorAll('.brand-filter-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const brand = e.target.dataset.brand;
                    this._filterByBrand(brand);
                });
            });
        }
        this._updateDiscardButtonState(); // Initial state for the discard button
    }

    _updateDiscardButtonState() {
        const discardButton = this.shadowRoot.getElementById('discard-confirm-btn');
        if (discardButton) {
            let totalDiscardQuantity = 0;
            this._selectedProductsToDiscard.forEach(productSelections => {
                productSelections.forEach(qty => totalDiscardQuantity += qty);
            });
            discardButton.disabled = totalDiscardQuantity === 0;
        }
    }
}

customElements.define('discard-inventory-modal', DiscardInventoryModal);
