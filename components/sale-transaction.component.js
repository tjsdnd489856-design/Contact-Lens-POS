import { CustomerService } from '../services/customer.service.js';
import { ProductService } from '../services/product.service.js';
import { SalesService } from '../services/sales.service.js';
import { parseUdiBarcode } from '../utils/udi-parser.js';

// --- Constants for better readability and maintainability ---
const ALERT_MESSAGES = {
  SELECT_CUSTOMER_AND_ITEMS: '고객을 선택하고 장바구니에 제품을 추가해주세요.',
  PRODUCT_NOT_FOUND: (barcode) => `바코드 "${barcode}"에 해당하는 제품을 로컬 및 외부 API에서 찾을 수 없습니다.`,
  PRODUCT_FETCHED_EXTERNAL: (model) => `외부 API에서 제품 정보를 가져왔습니다: ${model}`,
  INVALID_PRODUCT_SELECTION: '유효한 제품을 선택해주세요.',
  INVALID_QUANTITY: '유효한 수량을 입력해주세요.',
  SALE_SUCCESS: '판매가 성공적으로 완료되었습니다!',
  NO_CUSTOMER_SELECTED: '판매를 완료하려면 고객을 선택해주세요.'
};

const DEFAULT_QUANTITY = 1; // Constant for default quantity

// --- SaleTransaction Component ---
export default class SaleTransaction extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cart = [];
    this.selectedCustomer = null; // To store selected customer object

    // Bind event handlers
    this._handleBarcodeInputKeydown = this._handleBarcodeInputKeydown.bind(this);
    this._handleBarcodeInput = this._handleBarcodeInput.bind(this);
    this._handleCustomerSearchInput = this._handleCustomerSearchInput.bind(this);
    this._selectCustomerFromSearch = this._selectCustomerFromSearch.bind(this);
    this._clearCustomerSelection = this._clearCustomerSelection.bind(this);
    this.completeSale = this.completeSale.bind(this);
    this._handleCustomersUpdated = this._handleCustomersUpdated.bind(this);
    this._handleOpenProductSelectionModal = this._handleOpenProductSelectionModal.bind(this); // New binding
    this._handleProductSelectedForSale = this._handleProductSelectedForSale.bind(this); // New binding for product selection event
    this._dispatchSalesCustomerSelectedEvent = this._dispatchSalesCustomerSelectedEvent.bind(this); // Bind new dispatcher
    this._handleSalesCustomerSelected = this._handleSalesCustomerSelected.bind(this); // NEW: Bind sales customer selected event handler
    this._handleCustomerSearchResultClick = this._handleCustomerSearchResultClick.bind(this); // NEW: Bind for customer search result clicks
    this._selectedSearchIndex = -1;
  }

  connectedCallback() {
    // Defer rendering to the next animation frame to ensure the component is fully attached to the DOM
    // and its shadowRoot is ready for interaction.
    window.requestAnimationFrame(() => {
      this._render();
    });

    document.addEventListener('productsUpdated', () => window.requestAnimationFrame(() => this._render()));
    document.addEventListener('customersUpdated', this._handleCustomersUpdated);
    document.addEventListener('productSelectedForSale', this._handleProductSelectedForSale); // Listen for product selection
    document.addEventListener('salesCustomerSelected', this._handleSalesCustomerSelected);
  }

  disconnectedCallback() {
    this._detachEventListeners();
    document.removeEventListener('productsUpdated', () => window.requestAnimationFrame(() => this._render()));
    document.removeEventListener('customersUpdated', this._handleCustomersUpdated);
    document.removeEventListener('productSelectedForSale', this._handleProductSelectedForSale); // Remove listener
    document.removeEventListener('salesCustomerSelected', this._handleSalesCustomerSelected);
  }

  /**
   * Dispatches a custom event when a customer is selected within the sales transaction context.
   * This is intended for the sales panel's customer purchase history.
   * @param {number|null} customerId - The ID of the selected customer, or null if no customer is selected.
   * @private
   */
  _dispatchSalesCustomerSelectedEvent(customerId) {
    document.dispatchEvent(new CustomEvent('salesCustomerSelected', { detail: customerId }));
  }

  /**
   * NEW: Handles the custom event when a customer is selected from another tab (e.g., Customer List).
   * @param {CustomEvent} event - The event containing the full customer object.
   * @private
   */
  _handleSalesCustomerSelected(event) {
    const customer = event.detail;
    // The detail might be a customer ID from other parts of the app, or a full object.
    // Ensure we have the full customer object before proceeding.
    const fullCustomer = typeof customer === 'object' && customer !== null ? customer : CustomerService.getCustomerById(customer);

    if (fullCustomer) {
      this.selectedCustomer = fullCustomer;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      
      // Update the input field to show the selected customer
      if (customerSearchInput) {
        customerSearchInput.value = `${fullCustomer.name} (${fullCustomer.phone})`;
      }
      
      // Clear any previous search results that might be showing
      const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
      if (searchResultsDiv) {
        searchResultsDiv.innerHTML = '';
        searchResultsDiv.classList.add('hidden'); // Add hidden class after clearing
      }
      
      this._updateSelectedCustomerDisplay(); // Manages visibility of the 'clear' button
      // Removed: this._dispatchSalesCustomerSelectedEvent(this.selectedCustomer.id); // This caused infinite recursion
    }
  }

  /**
   * Handles click events on the customer search results div, delegating to individual items.
   * @param {Event} e - The click event.
   * @private
   */
  _handleCustomerSearchResultClick(e) {
    const selectedResult = e.target.closest('.customer-search-result-item');
    if (selectedResult) {
      const customerId = selectedResult.dataset.customerId; // customerId can be a string from dataset
      const customer = CustomerService.getCustomerById(customerId);
      if (customer) this._selectCustomerFromSearch(customer);
    }
  }

  /**
   * Handles the 'customersUpdated' event, often triggered after search or modification.
   * Re-renders the customer search results if a query is present.
   * @param {CustomEvent} event - The custom event containing filtered customers and query.
   * @private
   */
  _handleCustomersUpdated(event) {
      const { filteredCustomers, query } = event.detail;
      // If there's a query, render the search results; otherwise, just update the selected customer display
      if (query) {
          window.requestAnimationFrame(() => this._renderCustomerSearchResults(filteredCustomers));
      } else {
          // If a customer was already selected and customersUpdated without a query,
          // ensure its info is up-to-date (e.g., after an edit)
          if (this.selectedCustomer && CustomerService.getCustomerById(this.selectedCustomer.id)) {
              this.selectedCustomer = CustomerService.getCustomerById(this.selectedCustomer.id);
          } else {
              this.selectedCustomer = null;
          }
          window.requestAnimationFrame(() => this._updateSelectedCustomerDisplay());
          this._dispatchSalesCustomerSelectedEvent(this.selectedCustomer ? this.selectedCustomer.id : null);
      }
  }

  /**
   * Handles the 'productSelectedForSale' custom event.
   * Adds the selected product to the cart.
   * @param {CustomEvent} event - The custom event containing product details.
   * @private
   */
  _handleProductSelectedForSale(event) {
      const { product, quantity } = event.detail;
      if (product) {
          this._addProductToCart(product, quantity || DEFAULT_QUANTITY);
      }
  }

  /**
   * Attaches all necessary event listeners to the component's elements.
   * @private
   */
  _attachEventListeners() {
    const shadowRoot = this.shadowRoot;
    
    // Customer search listeners
    const customerSearchInput = shadowRoot.querySelector('#customer-search-input-sale');
    const clearCustomerSelectionBtn = shadowRoot.querySelector('#clear-customer-selection-btn');
    const customerSearchResultsDiv = shadowRoot.querySelector('#customer-search-results-sale');

    if (customerSearchInput) {
      customerSearchInput.addEventListener('input', this._handleCustomerSearchInput);
      customerSearchInput.addEventListener('keydown', this._handleCustomerSearchKeydown);
    }
    if (clearCustomerSelectionBtn) clearCustomerSelectionBtn.addEventListener('click', this._clearCustomerSelection);
    if (customerSearchResultsDiv) {
        customerSearchResultsDiv.addEventListener('click', this._handleCustomerSearchResultClick);
    }

    // Product and barcode listeners
    const barcodeInput = shadowRoot.querySelector('#barcode-scanner-input');
    if (barcodeInput) {
      barcodeInput.addEventListener('keydown', this._handleBarcodeInputKeydown);
      barcodeInput.addEventListener('input', this._handleBarcodeInput);
    }

    const openProductModalBtn = shadowRoot.querySelector('#open-product-selection-modal-btn');
    if (openProductModalBtn) {
      openProductModalBtn.addEventListener('click', this._handleOpenProductSelectionModal);
    }

    const completeSaleBtn = shadowRoot.querySelector('#complete-sale-btn');
    if (completeSaleBtn) {
      completeSaleBtn.addEventListener('click', this.completeSale);
    }
  }

  /**
   * Detaches all event listeners.
   * @private
   */
  _detachEventListeners() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return; // Add null check for shadowRoot

    const customerSearchInput = shadowRoot.querySelector('#customer-search-input-sale');
    const clearCustomerSelectionBtn = shadowRoot.querySelector('#clear-customer-selection-btn');
    const customerSearchResultsDiv = shadowRoot.querySelector('#customer-search-results-sale');

    if (customerSearchInput) {
      customerSearchInput.removeEventListener('input', this._handleCustomerSearchInput);
      customerSearchInput.removeEventListener('keydown', this._handleCustomerSearchKeydown);
    }
    if (clearCustomerSelectionBtn) clearCustomerSelectionBtn.removeEventListener('click', this._clearCustomerSelection);
    if (customerSearchResultsDiv) {
        customerSearchResultsDiv.removeEventListener('click', this._handleCustomerSearchResultClick);
    }

    // These querySelector calls might return null if the elements aren't in the shadow DOM yet (or anymore)
    // Add null checks for robustness
    const barcodeInput = shadowRoot.querySelector('#barcode-scanner-input');
    if (barcodeInput) {
      barcodeInput.removeEventListener('keydown', this._handleBarcodeInputKeydown);
      barcodeInput.removeEventListener('input', this._handleBarcodeInput);
    }

    const openProductModalBtn = shadowRoot.querySelector('#open-product-selection-modal-btn');
    if (openProductModalBtn) {
      openProductModalBtn.removeEventListener('click', this._handleOpenProductSelectionModal);
    }

    const completeSaleBtn = shadowRoot.querySelector('#complete-sale-btn');
    if (completeSaleBtn) {
      completeSaleBtn.removeEventListener('click', this.completeSale);
    }
  }

  /**
   * Resets the entire sales transaction form and state.
   * @public
   */
  reset() {
      this.cart = [];
      this.selectedCustomer = null;
      // Clear customer search input
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      if (customerSearchInput) customerSearchInput.value = '';
      // Clear barcode input
      const barcodeInput = this.shadowRoot.querySelector('#barcode-scanner-input');
      if (barcodeInput) barcodeInput.value = '';

      this._updateSelectedCustomerDisplay(); // Hide clear customer button
      this._dispatchSalesCustomerSelectedEvent(null); // Clear customer in sales history panel
      this._render(); // Re-render to clear cart and other displays
  }

  /**
   * Handles changes in the customer search input field.
   * @param {Event} event - The input event.
   * @private
   */
  _handleCustomerSearchInput(event) {
      const query = event.target.value.trim();
      if (query.length > 0) {
          window.requestAnimationFrame(() => this._renderCustomerSearchResults(CustomerService.searchCustomers(query)));
      } else {
          window.requestAnimationFrame(() => this._renderCustomerSearchResults([])); // Clear results if query is empty
      }
  }

  /**
   * Handles keydown events on the customer search input field for keyboard navigation.
   * @param {KeyboardEvent} event - The keyboard event.
   * @private
   */
  _handleCustomerSearchKeydown(event) {
    if (!this.shadowRoot) { 
      console.warn("shadowRoot is null in _handleCustomerSearchKeydown. Event ignored.");
      return;
    }
    const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
    const items = searchResultsDiv ? searchResultsDiv.querySelectorAll('.customer-search-result-item') : [];

    if (!items.length) {
      this._selectedSearchIndex = -1;
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this._selectedSearchIndex = (this._selectedSearchIndex + 1) % items.length;
        this._updateSelectedSearchResult(items);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this._selectedSearchIndex = (this._selectedSearchIndex - 1 + items.length) % items.length;
        this._updateSelectedSearchResult(items);
        break;
      case 'Enter':
        event.preventDefault();
        if (this._selectedSearchIndex > -1) {
          items[this._selectedSearchIndex].click();
        }
        break;
      case 'Escape':
        searchResultsDiv.innerHTML = '';
        searchResultsDiv.classList.add('hidden'); // Hide the results on escape
        this._selectedSearchIndex = -1;
        break;
    }
  }

  /**
   * Updates the visual selection of the search result items.
   * @param {NodeListOf<Element>} items - The list of search result items.
   * @private
   */
  _updateSelectedSearchResult(items) {
    items.forEach((item, index) => {
      if (index === this._selectedSearchIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  /**
   * Renders the customer search results.
   * @param {Array<Object>} customers - Array of customer objects to display.
   * @private
   */
  _renderCustomerSearchResults(customers) {
      this._selectedSearchIndex = -1;
      const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
      if (searchResultsDiv) {
          if (customers.length === 0) {
              searchResultsDiv.innerHTML = '';
              searchResultsDiv.classList.add('hidden'); // Hide if no results
              return;
          }
          searchResultsDiv.innerHTML = customers.map(c => `
              <div class="customer-search-result-item" data-customer-id="${c.id}">
                  ${c.name} (${c.phone})
              </div>
          `).join('');
          searchResultsDiv.classList.remove('hidden'); // Show results
      }
  }

  /**
   * Selects a customer from the search results.
   * @param {Object} customer - The selected customer object.
   * @private
   */
  _selectCustomerFromSearch(customer) {
      this.selectedCustomer = customer;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
      
      if (customerSearchInput) {
        customerSearchInput.value = `${customer.name} (${customer.phone})`; // Display selected customer in input
      }
      if (searchResultsDiv) {
        searchResultsDiv.innerHTML = ''; // Clear search results
        searchResultsDiv.classList.add('hidden'); // Add hidden class after clearing
      }
      this._updateSelectedCustomerDisplay(); // Update internal state and clear button visibility
      // Removed: this._dispatchSalesCustomerSelectedEvent(this.selectedCustomer ? this.selectedCustomer.id : null); // This caused infinite recursion
  }

  /**
   * Clears the selected customer.
   * @private
   */
  _clearCustomerSelection() {
      this.selectedCustomer = null;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      if (customerSearchInput) customerSearchInput.value = ''; // Clear the input field
      this._updateSelectedCustomerDisplay();
      this._dispatchSalesCustomerSelectedEvent(null);
  }

  /**
   * Updates the display of the selected customer's name and the clear button visibility.
   * @private
   */
  _updateSelectedCustomerDisplay() {
      // The customer name display is now handled by the input field directly.
      // This method now primarily manages the internal selectedCustomer state
      // and the visibility of the clear button.
      const clearButton = this.shadowRoot.querySelector('#clear-customer-selection-btn');

      if (this.selectedCustomer) {
          if (clearButton) clearButton.style.display = 'inline-block';
      } else {
          if (clearButton) clearButton.style.display = 'none';
      }
  }
  
  /**
   * Handles input to the barcode field, restricting to English letters and numbers, and converting to uppercase.
   * @param {Event} e - The input event.
   * @private
   */
  _handleBarcodeInput(e) {
      let input = e.target.value;
      // Remove any characters that are not English letters or numbers
      input = input.replace(/[^A-Za-z0-9]/g, '');
      // Convert to uppercase
      e.target.value = input.toUpperCase();
  }
  
  /**
   * Handles keydown events on the barcode input field, specifically for 'Enter'.
   * @param {KeyboardEvent} event - The keyboard event.
   * @private
   */
  _handleBarcodeInputKeydown(event) {
    if (!this.shadowRoot) { 
      console.warn("shadowRoot is null in _handleCustomerSearchKeydown. Event ignored.");
      return;
    }
    const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
    const items = searchResultsDiv ? searchResultsDiv.querySelectorAll('.customer-search-result-item') : [];

    if (!items.length) {
      this._selectedSearchIndex = -1;
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this._selectedSearchIndex = (this._selectedSearchIndex + 1) % items.length;
        this._updateSelectedSearchResult(items);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this._selectedSearchIndex = (this._selectedSearchIndex - 1 + items.length) % items.length;
        this._updateSelectedSearchResult(items);
        break;
      case 'Enter':
        event.preventDefault();
        if (this._selectedSearchIndex > -1) {
          items[this._selectedSearchIndex].click();
        }
        break;
      case 'Escape':
        searchResultsDiv.innerHTML = '';
        searchResultsDiv.classList.add('hidden'); // Hide the results on escape
        this._selectedSearchIndex = -1;
        break;
    }
  }

  /**
   * Updates the visual selection of the search result items.
   * @param {NodeListOf<Element>} items - The list of search result items.
   * @private
   */
  _updateSelectedSearchResult(items) {
    items.forEach((item, index) => {
      if (index === this._selectedSearchIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  /**
   * Renders the customer search results.
   * @param {Array<Object>} customers - Array of customer objects to display.
   * @private
   */
  _renderCustomerSearchResults(customers) {
      this._selectedSearchIndex = -1;
      const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
      if (searchResultsDiv) {
          if (customers.length === 0) {
              searchResultsDiv.innerHTML = '';
              searchResultsDiv.classList.add('hidden'); // Hide if no results
              return;
          }
          searchResultsDiv.innerHTML = customers.map(c => `
              <div class="customer-search-result-item" data-customer-id="${c.id}">
                  ${c.name} (${c.phone})
              </div>
          `).join('');
          searchResultsDiv.classList.remove('hidden'); // Show results
      }
  }

  /**
   * Selects a customer from the search results.
   * @param {Object} customer - The selected customer object.
   * @private
   */
  _selectCustomerFromSearch(customer) {
      this.selectedCustomer = customer;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
      
      if (customerSearchInput) {
        customerSearchInput.value = `${customer.name} (${customer.phone})`; // Display selected customer in input
      }
      if (searchResultsDiv) {
        searchResultsDiv.innerHTML = ''; // Clear search results
        searchResultsDiv.classList.add('hidden'); // Add hidden class after clearing
      }
      this._updateSelectedCustomerDisplay(); // Update internal state and clear button visibility
      // Removed: this._dispatchSalesCustomerSelectedEvent(this.selectedCustomer ? this.selectedCustomer.id : null); // This caused infinite recursion
  }

  /**
   * Clears the selected customer.
   * @private
   */
  _clearCustomerSelection() {
      this.selectedCustomer = null;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      if (customerSearchInput) customerSearchInput.value = ''; // Clear the input field
      this._updateSelectedCustomerDisplay();
      this._dispatchSalesCustomerSelectedEvent(null);
  }

  /**
   * Updates the display of the selected customer's name and the clear button visibility.
   * @private
   */
  _updateSelectedCustomerDisplay() {
      // The customer name display is now handled by the input field directly.
      // This method now primarily manages the internal selectedCustomer state
      // and the visibility of the clear button.
      const clearButton = this.shadowRoot.querySelector('#clear-customer-selection-btn');

      if (this.selectedCustomer) {
          if (clearButton) clearButton.style.display = 'inline-block';
      } else {
          if (clearButton) clearButton.style.display = 'none';
      }
  }
  
  /**
   * Handles input to the barcode field, restricting to English letters and numbers, and converting to uppercase.
   * @param {Event} e - The input event.
   * @private
   */
  _handleBarcodeInput(e) {
      let input = e.target.value;
      // Remove any characters that are not English letters or numbers
      input = input.replace(/[^A-Za-z0-9]/g, '');
      // Convert to uppercase
      e.target.value = input.toUpperCase();
  }
  
  /**
   * Handles keydown events on the barcode input field, specifically for 'Enter'.
   * @param {KeyboardEvent} event - The keyboard event.
   * @private
   */
  _handleBarcodeInputKeydown(event) {
    if (!this.shadowRoot) { 
      console.warn("shadowRoot is null in _handleCustomerSearchKeydown. Event ignored.");
      return;
    }
    const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
    const items = searchResultsDiv ? searchResultsDiv.querySelectorAll('.customer-search-result-item') : [];

    if (!items.length) {
      this._selectedSearchIndex = -1;
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this._selectedSearchIndex = (this._selectedSearchIndex + 1) % items.length;
        this._updateSelectedSearchResult(items);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this._selectedSearchIndex = (this._selectedSearchIndex - 1 + items.length) % items.length;
        this._updateSelectedSearchResult(items);
        break;
      case 'Enter':
        event.preventDefault();
        if (this._selectedSearchIndex > -1) {
          items[this._selectedSearchIndex].click();
        }
        break;
      case 'Escape':
        searchResultsDiv.innerHTML = '';
        searchResultsDiv.classList.add('hidden'); // Hide the results on escape
        this._selectedSearchIndex = -1;
        break;
    }
  }

  /**
   * Updates the visual selection of the search result items.
   * @param {NodeListOf<Element>} items - The list of search result items.
   * @private
   */
  _updateSelectedSearchResult(items) {
    items.forEach((item, index) => {
      if (index === this._selectedSearchIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }
}

customElements.define('sale-transaction-component', SaleTransaction);