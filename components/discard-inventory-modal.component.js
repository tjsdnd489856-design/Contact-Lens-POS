import { ProductService } from '../services/product.service.js';

export default class DiscardInventoryModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._products = []; // All products
        this._selectedProductsToDiscard = new Map(); // Map to store {productId: quantity}
    }

    setProducts(products) {
        this._products = products.map(p => ({ ...p, discardQuantity: 0 })); // Add discardQuantity
        this._render();
    }

    connectedCallback() {
        this._render();
    }

    _handleDiscardQuantityChange(productId, quantity) {
        const product = this._products.find(p => p.id === productId);
        if (product) {
            const numQuantity = parseInt(quantity, 10);
            if (!isNaN(numQuantity) && numQuantity >= 0 && numQuantity <= product.quantity) {
                this._selectedProductsToDiscard.set(productId, numQuantity);
                product.discardQuantity = numQuantity; // Update local state for rendering
            } else {
                this._selectedProductsToDiscard.delete(productId);
                product.discardQuantity = 0;
            }
        }
        this._render(); // Re-render to update input values
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
            this._products = ProductService.getProducts().map(p => ({ ...p, discardQuantity: 0 })); // Refresh products
            document.dispatchEvent(new CustomEvent('closeDiscardInventoryModal'));
            alert('제품이 성공적으로 폐기되었습니다.');
        }
    }

    _render() {
        const productListHtml = this._products.length === 0
            ? '<p class="message">등록된 제품이 없습니다.</p>'
            : `
                <table class="discard-table">
                    <thead>
                        <tr>
                            <th>브랜드</th>
                            <th>모델명</th>
                            <th>S</th>
                            <th>C</th>
                            <th>AX</th>
                            <th>현재 수량</th>
                            <th>폐기 수량</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this._products.map(product => `
                            <tr>
                                <td>${product.brand}</td>
                                <td>${product.model}</td>
                                <td>${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}</td>
                                <td>${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}</td>
                                <td>${product.powerAX !== null ? product.powerAX : 'N/A'}</td>
                                <td>${product.quantity}</td>
                                <td>
                                    <input type="number" min="0" max="${product.quantity}" value="${product.discardQuantity || 0}" 
                                           data-product-id="${product.id}" class="discard-quantity-input">
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="modal-actions">
                    <button id="discard-confirm-btn">선택 제품 폐기</button>
                </div>
            `;

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
                .discard-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                .discard-table th, .discard-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: center;
                }
                .discard-table th {
                    background-color: #f2f2f2;
                }
                .discard-table tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .discard-quantity-input {
                    width: 60px;
                    padding: 5px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    text-align: center;
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
            </style>
            <div class="discard-container">
                <h3>재고 폐기</h3>
                ${productListHtml}
            </div>
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        if (this._products.length > 0) {
            this.shadowRoot.querySelectorAll('.discard-quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const productId = parseInt(e.target.dataset.productId, 10);
                    this._handleDiscardQuantityChange(productId, e.target.value);
                });
            });
            this.shadowRoot.getElementById('discard-confirm-btn').addEventListener('click', this._discardSelectedProducts);
        }
    }
}

customElements.define('discard-inventory-modal', DiscardInventoryModal);