import { CustomerService } from '../services/customer.service.js';
import { SalesService } from '../services/sales.service.js';
import { ProductService } from '../services/product.service.js';

// --- Constants ---
const MESSAGES = {
    NO_CUSTOMER_SELECTED: '고객을 선택하면 구매 내역이 표시됩니다.',
    NO_PURCHASE_HISTORY: '선택된 고객의 구매 내역이 없습니다.',
};

const PURCHASE_HISTORY_STYLES = `
    h4 { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: center; } /* 검색 결과 가운데 정렬 */
    thead { background-color: #5cb85c; color: white; } /* Green header for purchase history */
    tbody tr:nth-child(even) { background-color: #f2f2f2; }
    .message { text-align: center; padding: 1rem; color: #555; }
    thead tr:hover { background-color: #5cb85c; cursor: default; } /* Prevent hover on header */
    thead th { text-align: center; } /* Center align header text */
`;

// --- CustomerPurchaseHistory Component ---
export default class CustomerPurchaseHistory extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selectedCustomerId = null;
        
        // Bind event handlers
        this._handleCustomerSelectedForHistory = this._handleCustomerSelectedForHistory.bind(this);
        this._handleSalesUpdated = this._handleSalesUpdated.bind(this);
    }

    connectedCallback() {
        this._render(); // Initial render
        document.addEventListener('customerSelectedForHistory', this._handleCustomerSelectedForHistory);
        document.addEventListener('salesUpdated', this._handleSalesUpdated);
    }

    disconnectedCallback() {
        document.removeEventListener('customerSelectedForHistory', this._handleCustomerSelectedForHistory);
        document.removeEventListener('salesUpdated', this._handleSalesUpdated);
    }

    /**
     * Handles the 'customerSelectedForHistory' event to update the displayed history.
     * @param {CustomEvent} e - The event containing the customer ID.
     * @private
     */
    _handleCustomerSelectedForHistory(e) {
        this.selectedCustomerId = e.detail;
        this._render();
    }

    /**
     * Handles the 'salesUpdated' event to refresh the purchase history.
     * @private
     */
    _handleSalesUpdated() {
        // Re-render only if a customer is currently selected
        if (this.selectedCustomerId !== null) {
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
            const date = new Date(sale.date).toISOString().split('T')[0]; // YYYY-MM-DD
            if (!groupedPurchases[date]) {
                groupedPurchases[date] = {
                    totalAmount: 0,
                    items: {}
                };
            }

            sale.items.forEach(item => {
                const product = ProductService.getProductById(item.productId); // Fetch full product details
                if (!product) return; // Skip if product not found

                if (!groupedPurchases[date].items[item.productId]) {
                    groupedPurchases[date].items[item.productId] = {
                        product: product, // Store the full product object
                        quantity: 0,
                        itemTotal: 0
                    };
                }
                groupedPurchases[date].items[item.productId].quantity += item.quantity;
                groupedPurchases[date].items[item.productId].itemTotal += (product.price * item.quantity);
            });
            groupedPurchases[date].totalAmount += sale.total;
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
                tbodyContent += `
                    <tr>
                        ${itemIndex === 0 ? `<td rowspan="${rowspan}">${date}</td>` : ''}
                        <td>${item.product.brand} ${item.product.model}</td>
                        <td>$${item.itemTotal.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        ${itemIndex === 0 ? `<td rowspan="${rowspan}">$${dateGroup.totalAmount.toFixed(2)}</td>` : ''}
                    </tr>
                `;
            });
        }
        return tbodyContent;
    }

    /**
     * Renders the customer purchase history table or appropriate messages.
     * @private
     */
    _render() {
        const customer = this.selectedCustomerId ? CustomerService.getCustomerById(this.selectedCustomerId) : null;
        const sales = customer ? SalesService.getSalesByCustomerId(this.selectedCustomerId) : [];
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
                            <th>구매일자</th>
                            <th>구매품목</th>
                            <th>금액</th>
                            <th>구매수량</th>
                            <th>총 금액</th>
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