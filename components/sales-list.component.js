import { SalesService } from '../services/sales.service.js';
import { CustomerService } from '../services/customer.service.js';

// --- Constants ---
const SALES_LIST_STYLES = `
    h4 { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    thead { background-color: #34495e; color: #ecf0f1; }
    thead tr:hover { background-color: #34495e; cursor: default; } /* Prevent hover on header */
    thead th { text-align: center; } /* Center align header text */
    tbody tr:nth-child(even) { background-color: #f8f9f9; }
    tbody tr:hover { background-color: #ecf0f1; cursor: pointer; } 
    .message { text-align: center; padding: 1rem; color: #555; }
`;

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
      <p class="message">과거 판매 내역은 이 탭에서 표시되지 않습니다.</p>
    `;
  }
}
customElements.define('sales-list', SalesList);