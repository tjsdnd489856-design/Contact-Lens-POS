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
        let filteredProducts = ProductService.getProducts();
        let message = '';

        if (this._currentBrand) {
            filteredProducts = filteredProducts.filter(p => p.brand === this._currentBrand);
        }

        const groupedProducts = filteredProducts.reduce((acc, product) => {
            const key = `${product.brand}_${product.lensType || 'N/A'}_${product.model}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(product);
            return acc;
        }, {});

        if (Object.keys(groupedProducts).length === 0) {
            if (this._currentBrand) {
                message = `${this._currentBrand} 브랜드의 제품이 없습니다.`;
            } else {
                message = '등록된 제품이 없습니다.';
            }
        }

        const mainRowsHtml = Object.keys(groupedProducts).map(key => {
            const [brand, lensType, model] = key.split('_');
            return `
                <tr class="main-row" data-group-key="${key}">
                    <td>${brand}</td>
                    <td>${lensType}</td>
                    <td>${model}</td>
                    <td><button class="toggle-details-btn" data-group-key="${key}">세부 정보 보기</button></td>
                </tr>
                <tr class="detail-row" data-group-key="${key}" style="display: none;">
                    <td colspan="4">
                        <div class="detail-content">
                            <h4>${model} 세부 목록</h4>
                            <table class="nested-table">
                                <thead>
                                    <tr>
                                        <th>도수 (S/C/AX)</th>
                                        <th>수량</th>
                                        <th>유통기한</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groupedProducts[key].map(product => `
                                        <tr>
                                            <td>
                                                S:${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}
                                                C:${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}
                                                ${product.powerAX !== null ? `AX:${product.powerAX}` : ''}
                                            </td>
                                            <td>${product.quantity}</td>
                                            <td>${product.expirationDate}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

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
                .main-row { cursor: pointer; }
                .main-row:hover { background-color: #e0e0e0; }
                .detail-row { background-color: #f0f0f0; }
                .nested-table { width: 95%; margin: 10px auto; }
                .nested-table th, .nested-table td { padding: 5px; font-size: 0.9em; }
            </style>
            <div>
                <h3>${this._currentBrand ? `${this._currentBrand} 브랜드 제품 목록` : '제품 목록'}</h3>
                ${message ? `<p class="message">${message}</p>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>브랜드</th>
                                <th>유형</th>
                                <th>제품명</th>
                                <th>세부 정보</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mainRowsHtml}
                        </tbody>
                    </table>
                `}
            </div>
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        if (!message) {
            this.shadowRoot.querySelectorAll('.toggle-details-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const groupKey = e.target.dataset.groupKey;
                    this.shadowRoot.querySelectorAll(`.detail-row[data-group-key="${groupKey}"]`).forEach(row => {
                        row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
                    });
                });
            });
        }
    }
}

customElements.define('brand-product-list-modal', BrandProductListModal);