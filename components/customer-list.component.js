import { CustomerService } from '../services/customer.service.js';

// --- Constants ---
const MESSAGES = {
  NO_SEARCH_RESULTS: '검색 결과가 없습니다.',
  ENTER_SEARCH_QUERY: '검색어를 입력하여 고객을 조회해주세요.',
};

const TABLE_STYLES = `
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
`;

// --- CustomerList Component ---
export default class CustomerList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedCustomerId = null; // State to keep track of the selected customer
    
    // Bind event handlers
    this._handleCustomersUpdated = this._handleCustomersUpdated.bind(this);
        this._openEditModal = this._openEditModal.bind(this);
        this._selectCustomerRow = this._selectCustomerRow.bind(this);
        this._handleSearchCustomers = this._handleSearchCustomers.bind(this);
      }
        
      connectedCallback() {
          this._render([]); // Render with an empty list initially
          document.addEventListener('customersUpdated', this._handleCustomersUpdated);
          document.addEventListener('customerSelectedForHistory', this._handleCustomerSelectedForHistory.bind(this));
          document.addEventListener('searchCustomers', this._handleSearchCustomers);
      }
    
      disconnectedCallback() {
        document.removeEventListener('customersUpdated', this._handleCustomersUpdated);
        document.removeEventListener('customerSelectedForHistory', this._handleCustomerSelectedForHistory);
        document.removeEventListener('searchCustomers', this._handleSearchCustomers);
      }
    
      /**
       * Handles the 'customersUpdated' event to re-render the list.
       * @param {CustomEvent} e - The event containing filtered customers and query.
       * @private
       */
      _handleCustomersUpdated(e) {
        const { filteredCustomers, query } = e.detail;
        // If no query and filteredCustomers is empty, it means search was cleared or initialized
        if (!query && (!filteredCustomers || filteredCustomers.length === 0)) {
            this._render([]); // Render empty state
            this.selectedCustomerId = null; // Clear selection
        } else {
            this._render(filteredCustomers, query);
        }
      }
    
      /**
       * Handles the 'searchCustomers' event, performs the search, and notifies updates.
       * @param {CustomEvent} e - The event containing the search query.
       * @private
       */
      _handleSearchCustomers(e) {
          const query = e.detail;
          const results = CustomerService.searchCustomers(query);
          CustomerService._notify(results, query); // Notify listeners with filtered results
      }
    
      /**
       * Handles 'customerSelectedForHistory' event, primarily to keep selection state in sync.   * @param {CustomEvent} e - Event with customerId.
   * @private
   */
  _handleCustomerSelectedForHistory(e) {
    this.selectedCustomerId = e.detail;
    this._updateSelectionHighlight(); // Update highlight without full re-render
  }


  /**
   * Opens the customer modal for editing an existing customer.
   * @param {Event} e - The click event from the edit button.
   * @private
   */
  _openEditModal(e) {
      e.stopPropagation(); // Prevent row selection when clicking edit button
      const id = parseInt(e.target.dataset.id, 10);
      const customer = CustomerService.getCustomerById(id);
      if (customer) {
          document.dispatchEvent(new CustomEvent('editCustomer', { detail: customer }));
          document.dispatchEvent(new CustomEvent('openCustomerModal'));
      }
  }
  
  /**
   * Handles customer row selection.
   * @param {Event} e - The click event from the customer row.
   * @private
   */
  _selectCustomerRow(e) {
      const row = e.currentTarget;
      const customerId = parseInt(row.dataset.id, 10);

      // Deselect if the same row is clicked again
      if (this.selectedCustomerId === customerId) {
          this.selectedCustomerId = null;
          document.dispatchEvent(new CustomEvent('customerSelectedForHistory', { detail: null }));
      } else {
          this.selectedCustomerId = customerId;
          document.dispatchEvent(new CustomEvent('customerSelectedForHistory', { detail: customerId }));
      }
      this._updateSelectionHighlight();
  }

  /**
   * Updates the visual highlight of the selected customer row without re-rendering the whole table.
   * @private
   */
  _updateSelectionHighlight() {
      this.shadowRoot.querySelectorAll('tbody tr').forEach(r => {
          if (parseInt(r.dataset.id, 10) === this.selectedCustomerId) {
              r.classList.add('selected');
          } else {
              r.classList.remove('selected');
          }
      });
  }

  /**
   * Generates the HTML string for the customer table rows.
   * @param {Array<Object>} customers - The list of customer objects to display.
   * @param {string|null} query - The current search query.
   * @returns {string} The HTML string for the table body.
   * @private
   */
  _generateTableRowsHtml(customers) {
    return customers.map(customer => `
        <tr data-id="${customer.id}" class="customer-row ${customer.id === this.selectedCustomerId ? 'selected' : ''}">
            <td style="text-align: center;">
                <span class="customer-name-highlight ${customer.isVIP ? 'vip-highlight' : ''} ${customer.isCaution ? 'caution-highlight' : ''}">
                    ${customer.name}
                </span>
            </td>
            <td style="text-align: center;">${customer.phone}</td>
            <td style="text-align: center;">${customer.rightS !== null ? (customer.rightS > 0 ? '+' : '') + customer.rightS.toFixed(2) : 'N/A'}</td>
            <td style="text-align: center;">${customer.rightC !== null ? (customer.rightC > 0 ? '+' : '') + customer.rightC.toFixed(2) : 'N/A'}</td>
            <td style="text-align: center;">${customer.rightAX !== null ? customer.rightAX : 'N/A'}</td>
            <td style="text-align: center;">${customer.leftS !== null ? (customer.leftS > 0 ? '+' : '') + customer.leftS.toFixed(2) : 'N/A'}</td>
            <td style="text-align: center;">${customer.leftC !== null ? (customer.leftC > 0 ? '+' : '') + customer.leftC.toFixed(2) : 'N/A'}</td>
            <td style="text-align: center;">${customer.leftAX !== null ? customer.leftAX : 'N/A'}</td>
            <td style="text-align: center;">${customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'N/A'}</td>
            <td style="text-align: center;">${customer.notes}</td>
            <td class="actions-cell" style="text-align: center;">
                <button data-id="${customer.id}" class="edit-customer-btn">수정</button>
            </td>
        </tr>
    `).join('');
  }


  /**
   * Renders the customer list table or a message if no customers are found.
   * @param {Array<Object>} customers - The list of customer objects to display.
   * @param {string|null} query - The current search query.
   * @private
   */
  _render(customers, query) {
    let contentHtml = '';
    let message = '';

    if (!query && customers.length === 0) {
        message = MESSAGES.ENTER_SEARCH_QUERY;
    } else if (query && customers.length === 0) {
        message = MESSAGES.NO_SEARCH_RESULTS;
    }

    if (message) {
        contentHtml = `<div class="message">${message}</div>`;
    } else {
        contentHtml = `
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
                ${this._generateTableRowsHtml(customers)}
                </tbody>
            </table>
        `;
    }

    this.shadowRoot.innerHTML = `
      <style>${TABLE_STYLES}</style>
      ${contentHtml}
    `;

    if (!message) { // Only add event listeners if table is rendered
        this._attachEventListenersToTable();
    }
  }

  /**
   * Attaches event listeners to the dynamically rendered table elements.
   * @private
   */
  _attachEventListenersToTable() {
      this.shadowRoot.querySelectorAll('.edit-customer-btn').forEach(btn => btn.addEventListener('click', this._openEditModal));
      this.shadowRoot.querySelectorAll('tbody tr.customer-row').forEach(row => {
          row.addEventListener('click', this._selectCustomerRow);
          row.addEventListener('dblclick', (e) => {
              const customerId = parseInt(row.dataset.id, 10);
              document.dispatchEvent(new CustomEvent('selectCustomerForSale', { detail: { customerId: customerId } }));
              const salesTabButton = document.querySelector('.tab-button[data-tab="sales"]');
              if (salesTabButton) {
                  salesTabButton.click();
              }
          });
      });
  }
}
customElements.define('customer-list', CustomerList);