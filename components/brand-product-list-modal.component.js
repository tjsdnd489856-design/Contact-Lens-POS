import { ProductService } from '../services/product.service.js';

export default class BrandProductListModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._currentBrand = null;
    }

    setBrand(brand) {
        this._currentBrand = brand;
        this._render();
    }

    _render() {
        let products = [];
        let message = '브랜드를 선택하면 해당 브랜드의 제품 목록이 여기에 표시됩니다.';

        if (this._currentBrand) {
            products = ProductService.getProducts().filter(p => p.brand === this._currentBrand);
            if (products.length === 0) {
                message = `${this._currentBrand} 브랜드의 제품이 없습니다.`;
            } else {
                message = ''; // Clear message if products are found
            }
        }

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                h3 {
                    margin-top: 0;
                    color: #333;
                    text-align: center;
                }
                .message {
                    text-align: center;
                    padding: 20px;
                    color: #555;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
            </style>
            <div>
                <h3>${this._currentBrand ? `${this._currentBrand} 브랜드 제품 목록` : '제품 목록'}</h3>
                ${message ? `<p class="message">${message}</p>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>바코드</th>
                                <th>브랜드</th>
                                <th>모델명</th>
                                <th>S</th>
                                <th>C</th>
                                <th>AX</th>
                                <th>수량</th>
                                <th>유통기한</th>
                                <th>가격</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(product => `
                                <tr>
                                    <td>${product.barcode || 'N/A'}</td>
                                    <td>${product.brand}</td>
                                    <td>${product.model}</td>
                                    <td>${product.powerS ? product.powerS.toFixed(2) : 'N/A'}</td>
                                    <td>${product.powerC ? product.powerC.toFixed(2) : 'N/A'}</td>
                                    <td>${product.powerAX !== null ? product.powerAX : 'N/A'}</td>
                                    <td>${product.quantity}</td>
                                    <td>${product.expirationDate}</td>
                                    <td>$${product.price.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('brand-product-list-modal', BrandProductListModal);