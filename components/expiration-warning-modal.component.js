import { ProductService } from '../services/product.service.js';

export default class ExpirationWarningModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._expiringProducts = [];
    }

    setProducts(products) {
        this._expiringProducts = products;
        this._render();
    }

    connectedCallback() {
        this._render();
    }

    _render() {
        const productListHtml = this._expiringProducts.length === 0
            ? '<p class="message">유통기한이 임박한 제품이 없습니다.</p>'
            : `
                <table class="expiration-table">
                    <thead>
                        <tr>
                            <th>브랜드</th>
                            <th>모델명</th>
                            <th>유형</th>
                            <th>착용 방식</th>
                            <th>S</th>
                            <th>C</th>
                            <th>AX</th>
                            <th>수량</th>
                            <th>유통기한</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this._expiringProducts.map(product => `
                            <tr>
                                <td>${product.brand}</td>
                                <td>${product.model}</td>
                                <td>${product.lensType}</td>
                                <td>${product.wearType || 'N/A'}</td>
                                <td>${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}</td>
                                <td>${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}</td>
                                <td>${product.powerAX !== null ? product.powerAX : 'N/A'}</td>
                                <td>${product.quantity}</td>
                                <td>${product.expirationDate}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .expiration-container {
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
                .expiration-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                .expiration-table th, .expiration-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: center; /* Center align all text for this table */
                }
                .expiration-table th {
                    background-color: #f2f2f2;
                }
                .expiration-table tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
            </style>
            <div class="expiration-container">
                <h3>유통 기한 임박 제품</h3>
                ${productListHtml}
            </div>
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('expiration-warning-modal', ExpirationWarningModal);