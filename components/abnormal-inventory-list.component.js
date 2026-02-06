import { ProductService } from '../services/product.service.js';

export default class AbnormalInventoryList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._abnormalProducts = [];
    }

    setAbnormalProducts(products) {
        this._abnormalProducts = products;
        this._render();
    }

    connectedCallback() {
        this._render();
    }

    _render() {
        const tableRows = this._abnormalProducts.length === 0
            ? '<tr><td colspan="6">이상 재고가 없습니다.</td></tr>'
            : this._abnormalProducts.map(product => `
                <tr>
                    <td>${product.brand}</td>
                    <td>${product.model}</td>
                    <td>${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}</td>
                    <td>${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}</td>
                    <td>${product.powerAX !== null ? product.powerAX : 'N/A'}</td>
                    <td class="negative-quantity">${product.quantity}</td>
                </tr>
            `).join('');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 15px;
                }
                h4 {
                    margin-top: 0;
                    color: #d9534f;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .abnormal-inventory-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                .abnormal-inventory-table th, .abnormal-inventory-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: center;
                }
                .abnormal-inventory-table th {
                    background-color: #f2f2f2;
                }
                .abnormal-inventory-table tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .negative-quantity {
                    color: #d9534f; /* Red color for negative quantities */
                    font-weight: bold;
                }
            </style>
            <h4>이상 재고 목록</h4>
            <table class="abnormal-inventory-table">
                <thead>
                    <tr>
                        <th>브랜드</th>
                        <th>모델명</th>
                        <th>S</th>
                        <th>C</th>
                        <th>AX</th>
                        <th>수량</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }
}

customElements.define('abnormal-inventory-list', AbnormalInventoryList);
