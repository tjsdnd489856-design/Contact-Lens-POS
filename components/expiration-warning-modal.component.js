import { ProductService } from '../services/product.service.js';

// --- Constants ---
const MESSAGES = {
    NO_EXPIRING_PRODUCTS: '유통기한이 임박한 제품이 없습니다.',
};

const EXPIRATION_MODAL_STYLES = `
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
`;

export default class ExpirationWarningModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._expiringProducts = [];
    }

    /**
     * Sets the list of expiring products and triggers a re-render.
     * @param {Array<Object>} products - An array of product objects that are expiring soon.
     */
    setProducts(products) {
        this._expiringProducts = products;
        this._render();
    }

    connectedCallback() {
        this._render();
    }

    /**
     * Generates the HTML table for displaying expiring products.
     * @param {Array<Object>} products - The list of expiring products.
     * @returns {string} The HTML string for the table or a message.
     * @private
     */
    _generateTableHtml(products) {
        if (products.length === 0) {
            return `<p class="message">${MESSAGES.NO_EXPIRING_PRODUCTS}</p>`;
        }

        const tableRows = products.map(product => `
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
        `).join('');

        return `
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
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    /**
     * Renders the component's HTML structure.
     * @private
     */
    _render() {
        this.shadowRoot.innerHTML = `
            <style>${EXPIRATION_MODAL_STYLES}</style>
            <div class="expiration-container">
                <h3>유통 기한 임박 제품</h3>
                ${this._generateTableHtml(this._expiringProducts)}
            </div>
        `;
    }
}

customElements.define('expiration-warning-modal', ExpirationWarningModal);