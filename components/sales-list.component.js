// --- SalesList Component ---
export default class SalesList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.rerender = this.rerender.bind(this);
  }

  connectedCallback() {
      this._render();
      document.addEventListener('salesUpdated', this.rerender);
  }

  disconnectedCallback() {
    document.removeEventListener('salesUpdated', this._render);
  }

  rerender() {
      this._render();
  }

  _render() {
    const sales = SalesService.getSales();
    
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        h4 { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 2rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        thead { background-color: #34495e; color: #ecf0f1; }
      </style>
      <h4>과거 판매 내역</h4>
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
          ${sales.map(sale => {
            const customer = CustomerService.getCustomerById(sale.customerId);
            return `
              <tr>
                <td>${sale.id}</td>
                <td>${sale.date.toLocaleString()}</td>
                <td>${customer ? customer.name : 'N/A'}</td>
                <td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td>$${sale.total.toFixed(2)}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `;

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}
customElements.define('sales-list', SalesList);