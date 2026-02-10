import { SalesService } from '../services/sales.service.js';
import { CustomerService } from '../services/customer.service.js';

// --- Constants ---
const SALES_LIST_STYLES = ``;

// --- SalesList Component ---
export default class SalesList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
   * Handles the 'salesUpdated' event to re-render the sales list.
   * @private
   */
  _handleSalesUpdated() {
      this._render();
  }

  /**
   * Generates the HTML table for displaying sales records.
   * @param {Array<Object>} sales - An array of sales objects.
   * @returns {string} The HTML string for the sales table.
   * @private
   */
  _generateTableHtml(sales) {
    if (sales.length === 0) {
        return `<p class="message">판매 내역이 없습니다.</p>`;
    }

    const tableBodyHtml = sales.map(sale => {
        const customer = CustomerService.getCustomerById(sale.customerId);
        // Ensure date is a Date object for toLocaleDateString
        const saleDate = sale.date instanceof Date ? sale.date : new Date(sale.date);
        return `
            <tr>
                <td>${sale.id}</td>
                <td>${saleDate.toLocaleString()}</td>
                <td>${customer ? customer.name : 'N/A'}</td>
                <td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td>$${sale.total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>날짜</th>
                    <th>고객</th>
                    <th>품목 수</th>
                    <th>총액</th>
                </tr>
            </thead>
            <tbody>
                ${tableBodyHtml}
            </tbody>
        </table>
    `;
  }

  /**
   * Renders the component's HTML structure with sales history.
   * @private
   */
  _render() {
    this.shadowRoot.innerHTML = `
      <style>${SALES_LIST_STYLES}</style>
    `;
  }
}
customElements.define('sales-list', SalesList);