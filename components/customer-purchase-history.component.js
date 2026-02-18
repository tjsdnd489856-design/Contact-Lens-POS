import { CustomerService } from '../services/customer.service.js';
import { SalesService } from '../services/sales.service.js';
import { ProductService } from '../services/product.service.js';

// --- Constants ---
const MESSAGES = {
    NO_CUSTOMER_SELECTED: '고객을 선택하면 구매 내역이 표시됩니다.',
    NO_PURCHASE_HISTORY: '선택된 고객의 구매 내역이 없습니다.',
};

const PURCHASE_HISTORY_STYLES = `
    h4 { margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
    thead { background-color: #5cb85c; color: white; }
    tbody tr:nth-child(even) { background-color: #f2f2f2; }
    .message { text-align: center; padding: 1rem; color: #555; }
    thead tr:hover { background-color: #5cb85c; cursor: default; }
    thead th { text-align: center; }
`;

// --- CustomerPurchaseHistory Component ---
export default class CustomerPurchaseHistory extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._selectedCustomerId = null;

        // Bind event handlers
        this._handleSalesUpdated = this._handleSalesUpdated.bind(this);
    }

    connectedCallback() {
        this._render();
        document.addEventListener('salesUpdated', this._handleSalesUpdated);
    }

    disconnectedCallback() {
        document.removeEventListener('salesUpdated', this._handleSalesUpdated);
    }

    /**
     * Public method to set the customer ID and update the history display.
     * @param {number|null} id - The ID of the customer to display history for.
     */
    setCustomerId(id) {
        if (this._selectedCustomerId !== id) {
            this._selectedCustomerId = id;
            this._render();
        }
    }

    /**
     * Handles the 'salesUpdated' event to refresh the purchase history.
     * @private
     */
    _handleSalesUpdated() {
        if (this._selectedCustomerId !== null) {
            this._render();
        }
    }

    /**
     * Groups purchase data by date and then by product for display.
     * @param {Array<Object>} sales - An array of sales objects.
     * @returns {Object} Grouped purchase data.
     * @private
     */
    _groupPurchases(sales) {
        const groupedPurchases = {};
        sales.forEach(sale => {
            if (!sale.date) return;
            const date = new Date(sale.date).toISOString().split('T')[0]; // YYYY-MM-DD
            if (!groupedPurchases[date]) {
                groupedPurchases[date] = {
                    totalAmount: 0,
                    items: {}
                };
            }

            sale.items.forEach(item => {
                const product = ProductService.getProductById(item.productId);
                if (!product) return;

                if (!groupedPurchases[date].items[item.productId]) {
                    groupedPurchases[date].items[item.productId] = {
                        product: product,
                        quantity: 0,
                        itemTotal: 0
                    };
                }
                groupedPurchases[date].items[item.productId].quantity += item.quantity;
                groupedPurchases[date].items[item.productId].itemTotal += (item.price * item.quantity);
            });
            groupedPurchases[date].totalAmount += (sale.total || 0);
        });
        return groupedPurchases;
    }

    /**
     * Generates the HTML table content for grouped purchases.
     * @param {Object} groupedPurchases - The grouped purchase data.
     * @returns {string} The HTML string for the table body.
     * @private
     */
    _generateTableBodyHtml(groupedPurchases) {
        let tbodyContent = '';
        for (const date in groupedPurchases) {
            const dateGroup = groupedPurchases[date];
            const itemsArray = Object.values(dateGroup.items);
            const rowspan = itemsArray.length;

            itemsArray.forEach((item, itemIndex) => {
                const p = item.product;
                const formattedS = (p.powerS !== null && p.powerS !== undefined) ? (p.powerS > 0 ? '+' : '') + p.powerS.toFixed(2) : 'N/A';
                const formattedC = (p.powerC !== null && p.powerC !== undefined) ? (p.powerC > 0 ? '+' : '') + p.powerC.toFixed(2) : 'N/A';
                const formattedAX = (p.powerAX !== null && p.powerAX !== undefined) ? p.powerAX : 'N/A';

                tbodyContent += `
                    <tr>
                        ${itemIndex === 0 ? `<td rowspan="${rowspan}">${date}</td>` : ''}
                        <td>${p.brand} ${p.model}</td>
                        <td>${formattedS}</td>
                        <td>${formattedC}</td>
                        <td>${formattedAX}</td>
                        <td>${item.quantity}</td>
                    </tr>
                `;
            });
        }
        return tbodyContent;
    }

    /**
     * Renders the customer purchase history table.
     * @private
     */
    _render() {
        const customer = this._selectedCustomerId ? CustomerService.getCustomerById(this._selectedCustomerId) : null;
        const sales = customer ? SalesService.getSalesByCustomerId(this._selectedCustomerId) : [];
        const groupedPurchases = this._groupPurchases(sales);

        let contentHtml = '';
        if (!customer) {
            contentHtml = `<p class="message">${MESSAGES.NO_CUSTOMER_SELECTED}</p>`;
        } else if (Object.keys(groupedPurchases).length === 0) {
            contentHtml = `<p class="message">${MESSAGES.NO_PURCHASE_HISTORY}</p>`;
        } else {
            contentHtml = `
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">일자</th>
                            <th rowspan="2">품목</th>
                            <th colspan="3">도수</th>
                            <th rowspan="2">수량</th>
                        </tr>
                        <tr>
                            <th>S</th>
                            <th>C</th>
                            <th>AX</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this._generateTableBodyHtml(groupedPurchases)}
                    </tbody>
                </table>
            `;
        }

        this.shadowRoot.innerHTML = `
            <style>${PURCHASE_HISTORY_STYLES}</style>
            <h4>고객 구매 내역</h4>
            ${contentHtml}
        `;
    }
}
customElements.define('customer-purchase-history', CustomerPurchaseHistory);
