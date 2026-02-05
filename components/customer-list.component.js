import { CustomerService } from '../services/customer.service.js';

// --- CustomerList Component ---
export default class CustomerList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleDelete = this.handleDelete.bind(this); // These are now just placeholders, actual buttons for these are gone from UI
    this.handleEdit = this.handleEdit.bind(this); // These are now just placeholders, actual buttons for these are gone from UI
    this.openEditModal = this.openEditModal.bind(this); // New method to open modal for editing
    this.selectCustomer = this.selectCustomer.bind(this);
    document.addEventListener('customersUpdated', (e) => this._render(e.detail?.filteredCustomers, e.detail?.query)); // Listen for filtered customers and query
  }
    
  connectedCallback() {
      // Initial render should not show all customers by default
      // this._render(); // Removed to hide list initially
  }

  disconnectedCallback() {
    document.removeEventListener('customersUpdated', this._render);
  }

  handleDelete(e) { /* Placeholder */ } // Not used directly in new UI
  handleEdit(e) { /* Placeholder */ } // Not used directly in new UI

  openEditModal(e) {
      const id = parseInt(e.target.dataset.id, 10);
      const customer = CustomerService.getCustomerById(id);
      if (customer) {
          document.dispatchEvent(new CustomEvent('editCustomer', { detail: customer }));
          document.dispatchEvent(new CustomEvent('openCustomerModal')); // Trigger modal open
      }
  }
  
  selectCustomer(e) {
      const row = e.currentTarget; // The clicked <tr>
      const customerId = parseInt(row.dataset.id, 10);
      const customer = CustomerService.getCustomerById(customerId);
      if (customer) {
          // Highlight selected row
          this.shadowRoot.querySelectorAll('tbody tr').forEach(r => r.classList.remove('selected'));
          row.classList.add('selected');
          // Dispatch event to show purchase history
          document.dispatchEvent(new CustomEvent('customerSelectedForHistory', { detail: customerId }));
          
          // New: Single selection logic
          // Only show the selected customer in the list
          this._render([customer], document.getElementById('customer-search-input')?.value.toLowerCase().trim());
      }
  }

  _render(filteredCustomers, currentQueryFromEvent) {
    const query = currentQueryFromEvent; // Use query from event
    let customers = [];
    let message = '';

    if (query) { // A query exists, so perform search or use provided filtered customers
        customers = filteredCustomers;
        if (customers.length === 0) {
            message = '검색 결과가 없습니다.';
        }
    } else { // No query, so display initial message
        message = '검색어를 입력하여 고객을 조회해주세요.';
        // Also clear history when search query is empty
        document.dispatchEvent(new CustomEvent('customerSelectedForHistory', { detail: null }));
    }

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .message { text-align: center; padding: 2rem; color: #555; font-size: 1.1rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        thead { background-color: #34495e; color: #ecf0f1; }
        thead tr:hover { background-color: #34495e; cursor: default; } /* Prevent hover on header */
        thead th { text-align: center; } /* Center align header text */
        tr:nth-child(even) { background-color: #f8f9f9; }
        tr:hover { background-color: #ecf0f1; cursor: pointer; } 
        tr.selected { background-color: #cce0ff; border: 2px solid #3498db; }
        .actions-cell { text-align: center; } 
        .edit-customer-btn { 
            cursor: pointer; padding: 6px 10px; margin: 2px; border: none; border-radius: 4px; color: white; font-size: 0.7rem;
            background-color: #2980b9; 
        }
        .edit-customer-btn:hover {
            background-color: #3498db;
        }
        .customer-name-highlight {
            font-weight: bold;
        }
        .vip-highlight {
            color: #f39c12; /* Orange */
        }
        .caution-highlight {
            color: #e74c3c; /* Red */
        }
        .customer-tags {
            font-size: 0.8em;
            margin-left: 5px;
            padding: 2px 5px;
            border-radius: 3px;
            color: white;
            background-color: gray;
        }
        .vip-tag { background-color: #f39c12; } /* Orange */
        .caution-tag { background-color: #e74c3c; } /* Red */
      </style>
      ${message ? `<div class="message">${message}</div>` : `
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 15%;">이름</th>
            <th rowspan="2" style="width: 15%;">연락처</th>
            <th colspan="3">오른쪽 눈</th>
            <th colspan="3">왼쪽 눈</th>
            <th rowspan="2" style="width: 10%;">최종 구매일</th>
            <th rowspan="2" style="width: 25%;">비고</th>
            <th rowspan="2" class="actions-cell" style="width: 5%;">관리</th>
          </tr>
          <tr>
            <th style="background-color: #34495e; color: #ecf0f1;">S</th>
            <th style="background-color: #34495e; color: #ecf0f1;">C</th>
            <th style="background-color: #34495e; color: #ecf0f1;">AX</th>
            <th style="background-color: #34495e; color: #ecf0f1;">S</th>
            <th style="background-color: #34495e; color: #ecf0f1;">C</th>
            <th style="background-color: #34495e; color: #ecf0f1;">AX</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(customer => `
            <tr data-id="${customer.id}" class="customer-row">
              <td style="text-align: center;">
                <span class="customer-name-highlight ${customer.isVIP ? 'vip-highlight' : ''} ${customer.isCaution ? 'caution-highlight' : ''}">
                    ${customer.name}
                </span>
              </td>
              <td style="text-align: center;">${customer.phone}</td>
              <td style="text-align: center;">${customer.rightS ? (customer.rightS > 0 ? '+' : '') + customer.rightS.toFixed(2) : 'N/A'}</td>
              <td style="text-align: center;">${customer.rightC ? (customer.rightC > 0 ? '+' : '') + customer.rightC.toFixed(2) : 'N/A'}</td>
              <td style="text-align: center;">${customer.rightAX !== null ? customer.rightAX : 'N/A'}</td>
              <td style="text-align: center;">${customer.leftS ? (customer.leftS > 0 ? '+' : '') + customer.leftS.toFixed(2) : 'N/A'}</td>
              <td style="text-align: center;">${customer.leftC ? (customer.leftC > 0 ? '+' : '') + customer.leftC.toFixed(2) : 'N/A'}</td>
              <td style="text-align: center;">${customer.leftAX !== null ? customer.leftAX : 'N/A'}</td>
              <td style="text-align: center;">${customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'N/A'}</td>
              <td style="text-align: center;">${customer.notes}</td>
              <td class="actions-cell" style="text-align: center;">
                <button data-id="${customer.id}" class="edit-customer-btn">수정</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      `}
    `;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    if (!message) { // Only add event listeners if table is rendered
        this.shadowRoot.querySelectorAll('.edit-customer-btn').forEach(btn => btn.addEventListener('click', this.openEditModal));
        this.shadowRoot.querySelectorAll('tbody tr.customer-row').forEach(row => {
            row.addEventListener('click', this.selectCustomer);
            row.addEventListener('dblclick', (e) => { // Double-click to go to sales
                const customerId = parseInt(row.dataset.id, 10);
                document.dispatchEvent(new CustomEvent('selectCustomerForSale', { detail: { customerId: customerId } }));
                document.dispatchEvent(new CustomEvent('showTab', { detail: { tabId: 'sales' } }));
            });
        });
    }
  }
}
customElements.define('customer-list', CustomerList);