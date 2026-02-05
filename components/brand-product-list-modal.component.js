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
        let products = ProductService.getProducts();
        let message = '';


        if (this._currentBrand) {
            products = products.filter(p => p.brand === this._currentBrand);
            if (products.length === 0) {
                message = `${this._currentBrand} 브랜드의 제품이 없습니다.`;
            }
        } else {
            message = products.length === 0 ? '전체 브랜드의 제품이 없습니다.' : '';
        }

        const tableBodyHtml = products.map(product => `
            <tr>
                <td>${product.brand}</td>
                <td>${product.lensType || 'N/A'}</td>
                <td>${product.model}</td>
                <td>
                    S:${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}
                    C:${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}
                    ${product.powerAX !== null ? `AX:${product.powerAX}` : ''}
                </td>
                <td>${product.quantity}</td>
                <td>${product.expirationDate}</td>
                <td>$${product.price.toFixed(2)}</td>
            </tr>
        `).join('');

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
                                <th>브랜드</th>
                                <th>유형 (투명/컬러)</th>
                                <th>제품명</th>
                                <th>도수 (S/C/AX)</th>
                                <th>수량</th>
                                <th>유통기한</th>
                                <th>가격</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableBodyHtml}
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