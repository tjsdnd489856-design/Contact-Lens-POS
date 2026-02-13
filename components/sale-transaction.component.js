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
    this._selectedSearchIndex = -1;
  }

  connectedCallback() {

    this._render();
    this._attachEventListeners();
    document.addEventListener('productsUpdated', this._render.bind(this));
    document.addEventListener('customersUpdated', this._handleCustomersUpdated);
    document.addEventListener('productSelectedForSale', this._handleProductSelectedForSale); // Listen for product selection
    document.addEventListener('salesCustomerSelected', this._handleSalesCustomerSelected);
  }

  disconnectedCallback() {
    this._detachEventListeners();
    document.removeEventListener('productsUpdated', this._render.bind(this));
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
      }
      
      this._updateSelectedCustomerDisplay(); // Manages visibility of the 'clear' button
      this._dispatchSalesCustomerSelectedEvent(this.selectedCustomer.id); // Notify other components like purchase history
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
          this._renderCustomerSearchResults(filteredCustomers);
      } else {
          // If a customer was already selected and customersUpdated without a query,
          // ensure its info is up-to-date (e.g., after an edit)
          if (this.selectedCustomer && CustomerService.getCustomerById(this.selectedCustomer.id)) {
              this.selectedCustomer = CustomerService.getCustomerById(this.selectedCustomer.id);
          } else {
              this.selectedCustomer = null;
          }
          this._updateSelectedCustomerDisplay();
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
        customerSearchResultsDiv.addEventListener('click', (e) => {
            const selectedResult = e.target.closest('.customer-search-result-item');
            if (selectedResult) {
                const customerId = selectedResult.dataset.customerId;
                const customer = CustomerService.getCustomerById(customerId);
                if (customer) this._selectCustomerFromSearch(customer);
            }
        });
    }

    // Product and barcode listeners
    shadowRoot.querySelector('#barcode-scanner-input').addEventListener('keydown', this._handleBarcodeInputKeydown);
    shadowRoot.querySelector('#barcode-scanner-input').addEventListener('input', this._handleBarcodeInput);
    shadowRoot.querySelector('#open-product-selection-modal-btn').addEventListener('click', this._handleOpenProductSelectionModal); // New listener
    shadowRoot.querySelector('#complete-sale-btn').addEventListener('click', this.completeSale);
  }

  /**
   * Detaches all event listeners.
   * @private
   */
  _detachEventListeners() {
    const shadowRoot = this.shadowRoot;
    const customerSearchInput = shadowRoot.querySelector('#customer-search-input-sale');
    const clearCustomerSelectionBtn = shadowRoot.querySelector('#clear-customer-selection-btn');
    const customerSearchResultsDiv = shadowRoot.querySelector('#customer-search-results-sale');

    if (customerSearchInput) {
      customerSearchInput.removeEventListener('input', this._handleCustomerSearchInput);
      customerSearchInput.removeEventListener('keydown', this._handleCustomerSearchKeydown);
    }
    if (clearCustomerSelectionBtn) clearCustomerSelectionBtn.removeEventListener('click', this._clearCustomerSelection);
    if (customerSearchResultsDiv) {
        customerSearchResultsDiv.removeEventListener('click', (e) => { // This anonymous function might not be removed
            const selectedResult = e.target.closest('.customer-search-result-item');
            if (selectedResult) {
                const customerId = parseInt(selectedResult.dataset.customerId, 10);
                const customer = CustomerService.getCustomerById(customerId);
                if (customer) this._selectCustomerFromSearch(customer);
            }
        });
    }

    shadowRoot.querySelector('#barcode-scanner-input').removeEventListener('keydown', this._handleBarcodeInputKeydown);
    shadowRoot.querySelector('#barcode-scanner-input').removeEventListener('input', this._handleBarcodeInput);
    shadowRoot.querySelector('#open-product-selection-modal-btn').removeEventListener('click', this._handleOpenProductSelectionModal); // New listener
    shadowRoot.querySelector('#complete-sale-btn').removeEventListener('click', this.completeSale);
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
          const results = CustomerService.searchCustomers(query);
          this._renderCustomerSearchResults(results);
      } else {
          this._renderCustomerSearchResults([]); // Clear results if query is empty
      }
  }

  /**
   * Handles keydown events on the customer search input field for keyboard navigation.
   * @param {KeyboardEvent} event - The keyboard event.
   * @private
   */
  _handleCustomerSearchKeydown(event) {
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
              return;
          }
          searchResultsDiv.innerHTML = customers.map(c => `
              <div class="customer-search-result-item" data-customer-id="${c.id}">
                  ${c.name} (${c.phone})
              </div>
          `).join('');
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
      
      if (customerSearchInput) customerSearchInput.value = `${customer.name} (${customer.phone})`; // Display selected customer in input
      if (searchResultsDiv) searchResultsDiv.innerHTML = ''; // Clear search results
      this._updateSelectedCustomerDisplay(); // Update internal state and clear button visibility
      this._dispatchSalesCustomerSelectedEvent(this.selectedCustomer ? this.selectedCustomer.id : null);
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
    if (event.key === 'Enter') {
      event.preventDefault();
      const barcodeInput = this.shadowRoot.querySelector('#barcode-scanner-input');
      const barcodeString = barcodeInput.value;
      if (barcodeString) {
        this._processBarcodeString(barcodeString);
        barcodeInput.value = '';
      }
    }
  }

  /**
   * Processes a barcode string, attempting to find or fetch product details.
   * @param {string} barcodeString - The raw barcode string.
   * @private
   */
  async _processBarcodeString(barcodeString) {
    console.log(`Scanned Barcode: ${barcodeString}`);
    const udiData = parseUdiBarcode(barcodeString);
    console.log('Parsed UDI Data:', udiData);
    let product = await this._findProduct(udiData, barcodeString);
    
    if (product) {
      this._addProductToCart(product, DEFAULT_QUANTITY);
    } else {
      alert(ALERT_MESSAGES.PRODUCT_NOT_FOUND(barcodeString));
    }
  }

  /**
   * Attempts to find a product locally or fetches it from an external API.
   * @param {Object} udiData - Parsed UDI data.
   * @param {string} barcodeString - The original barcode string.
   * @returns {Promise<Object|null>} The found or fetched product, or null.
   * @private
   */
  async _findProduct(udiData, barcodeString) {
    let product = null;

    if (udiData.gtin) {
      product = ProductService.getProductByGtin(udiData.gtin);
      if (product) return product;

      console.log('Product not found locally by GTIN, fetching from external API...');
      const externalProduct = await ProductService.fetchProductDetailsFromExternalApi(udiData.gtin);
      
      if (externalProduct && externalProduct.productFound) {
        ProductService.addProduct({
          ...externalProduct,
          barcode: udiData.gtin, // Use GTIN as barcode for consistency
          udiDi: udiData.gtin, // Assuming udiDi is GTIN from UDI-DI
          // Override with parsed UDI data if available
          expirationDate: udiData.expirationDate || externalProduct.expirationDate,
          lotNumber: udiData.lotNumber || externalProduct.lotNumber,
          serialNumber: udiData.serialNumber || externalProduct.serialNumber,
        });
        alert(ALERT_MESSAGES.PRODUCT_FETCHED_EXTERNAL(externalProduct.model || externalProduct.productName));
        return ProductService.getProductByGtin(udiData.gtin);
      }
    } else {
      product = ProductService.getProductByLegacyBarcode(barcodeString);
    }
    return product;
  }

  /**
   * Handles the click event for opening the product selection modal.
   * Dispatches a custom event to open the modal.
   * @private
   */
  _handleOpenProductSelectionModal() {
    document.dispatchEvent(new CustomEvent('openProductSelectionModal'));
  }

  /**
   * Adds a product to the cart or updates its quantity if already present.
   * @param {Object} product - The product object to add.
   * @param {number} quantity - The quantity to add.
   * @private
   */
  _addProductToCart(product, quantity) {
    if (!quantity || quantity <= 0) {
        alert(ALERT_MESSAGES.INVALID_QUANTITY);
        return;
    }
    const cartItem = this.cart.find(item => item.product.id === product.id);
    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        this.cart.push({ product, quantity });
    }
    this._renderCart();
  }

  /**
   * Removes an item from the cart.
   * @param {number} productId - The ID of the product to remove.
   * @private
   */
  _removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.product.id !== productId);
    this._renderCart();
  }

  /**
   * Renders the cart contents and updates the total.
   * @private
   */
  _renderCart() {
    const cartItemsDiv = this.shadowRoot.querySelector('.cart-items');
    const totalDiv = this.shadowRoot.querySelector('.total');
    let total = 0;

    if (this.cart.length === 0) {
      cartItemsDiv.innerHTML = '<p>장바구니가 비어 있습니다.</p>';
      totalDiv.textContent = `총액: 0원`;
      return;
    }

    const tableRows = this.cart.map(item => {
      const itemTotal = item.product.price * item.quantity;
      total += itemTotal;
      return `
        <tr>
          <td>${item.product.brand} ${item.product.model}</td>
          <td>${item.quantity}</td>
          <td>$${item.product.price.toFixed(2)}</td>
          <td>$${itemTotal.toFixed(2)}</td>
          <td><button class="remove-from-cart-btn" data-product-id="${item.product.id}">삭제</button></td>
        </tr>
      `;
    }).join('');

    cartItemsDiv.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>제품</th>
            <th>수량</th>
            <th>가격</th>
            <th>합계</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
    totalDiv.textContent = `총액: ${total === 0 ? '0' : total.toLocaleString('ko-KR')}원`;

    this.shadowRoot.querySelectorAll('.remove-from-cart-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = parseInt(e.target.dataset.productId, 10);
        this._removeFromCart(productId);
      });
    });
  }

  /**
   * Completes the sale transaction.
   * @private
   */
  completeSale() {
    if (!this.selectedCustomer) {
      alert(ALERT_MESSAGES.NO_CUSTOMER_SELECTED);
      return;
    }
    if (this.cart.length === 0) {
      alert(ALERT_MESSAGES.SELECT_CUSTOMER_AND_ITEMS);
      return;
    }

    const saleItems = this.cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price
    }));

    SalesService.addSale({ customerId: this.selectedCustomer.id, items: saleItems })
      .then(() => {
        alert(ALERT_MESSAGES.SALE_SUCCESS);
        this.cart = [];
        this.selectedCustomer = null; // Clear selected customer after sale
        this._render(); // Re-render to clear cart and customer display
        this._dispatchSalesCustomerSelectedEvent(null);
      })
      .catch(error => {
        alert(`판매 실패: ${error.message}`);
        console.error('Error completing sale:', error);
      });
  }
  
  /**
   * Renders the component's HTML structure and updates dynamic content.
   * @private
   */
  _render() {
    const products = ProductService.getProducts();
    this.shadowRoot.innerHTML = this._getSalesTemplate(products);
    this._renderCart();
    // Re-attach event listeners as shadowRoot.innerHTML was reset
    this._attachEventListeners();
  }

  /**
   * Returns the HTML and CSS template for the sale transaction component.
   * @param {Array<Object>} products - The list of products to display in the product selection.
   * @returns {string} The HTML string for the component.
   * @private
   */
  _getSalesTemplate(products) {
    return `
      <style>
        :host {
          display: flex; /* Make the host element a flex container */
          flex-direction: column; /* Stack children vertically */
          height: 100%; /* Ensure it takes full height of its parent */
        }
        .overall-sales-layout-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        /* Layout for the whole sale transaction component */
        .top-sales-section {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            padding: 2rem;
            background: #fdfdfd;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            margin-bottom: 0;
        }

        .main-content {
            flex: 1;
            min-width: 300px;
            display: flex;
            flex-direction: column;
        }

        .cart-section {
            flex: 2;
            min-width: 280px;
            display: flex;
            flex-direction: column;
            background: #fdfdfd;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            justify-content: space-between;
        }

        .scrollable-cart-items {
            flex-grow: 1;
            overflow-y: auto;
            margin-bottom: 1rem;
        }

        customer-purchase-history {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            background: #fdfdfd;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        @media (max-width: 768px) {
            .top-sales-section {
                flex-direction: column;
                padding: 1rem;
            }
            .main-content, .cart-section {
                flex: none;
                width: 100%;
                min-width: unset;
            }
        }
        /* General styling */
        .transaction-form {
            padding: 0;
            background: none;
            box-shadow: none;
            margin-bottom: 0;
        }
        /* Removed .form-title styles */
        .form-group {
            margin-bottom: 1.5rem;
        }
        label {
            display: block;
            margin-bottom: 0.6rem;
            font-weight: 600;
            color: #555;
            font-size: 0.95rem;
        }
        input[type="text"],
        input[type="number"],
        select {
            width: 100%;
            padding: 0.9rem 1rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-sizing: border-box;
            font-size: 1rem;
            color: #333;
            transition: border-color 0.2s ease-in-out;
        }
        input[type="text"]:focus,
        input[type="number"]:focus,
        select:focus {
            border-color: #007bff;
            outline: none;
            box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }
        button {
            cursor: pointer;
            color: white;
            padding: 0.9rem 1.2rem;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 600;
            transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        button:hover {
            transform: translateY(-1px);
        }
        button:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Specific button styles */
        #open-product-selection-modal-btn { background-color: #28a745; }
        #open-product-selection-modal-btn:hover { background-color: #218838; }
        #complete-sale-btn { background-color: #007bff; }
        #complete-sale-btn:hover { background-color: #0069d9; }
        .remove-from-cart-btn {
            background-color: #dc3545;
            padding: 0.5rem 0.8rem;
            font-size: 0.85rem;
            margin-top: 0;
        }
        .remove-from-cart-btn:hover { background-color: #c82333; }
        /* Moved #reset-sale-btn to global CSS */

        /* Layout and components */
        .product-selection-group {
            display: flex;
            gap: 1rem;
            align-items: flex-end;
            margin-bottom: 1.5rem;
        }
        .product-selection-group > div { flex-grow: 1; }

        #barcode-scanner-input {
            margin-bottom: 1rem;
            text-transform: uppercase; /* Ensure scanned barcodes are displayed uppercase */
        }

        /* Customer Search styles */
        .customer-search-wrapper {
            position: relative;
        }
        .customer-search-results {
            position: absolute;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            max-height: 200px;
            overflow-y: auto;
            width: 100%;
            z-index: 10; /* Ensure it's above other elements */
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            list-style: none; /* Remove bullet points */
            padding: 0; /* Remove default padding */
            margin: 0; /* Remove default margin */
        }
        .customer-search-result-item {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            font-size: 0.95rem;
            color: #333;
        }
        .customer-search-result-item:last-child {
            border-bottom: none;
        }
        .customer-search-result-item:hover, .customer-search-result-item.selected {
            background-color: #f8f9fa;
            color: #007bff;
        }

        /* Selected Customer Display */
        .selected-customer-display {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            border: 1px solid #cce5ff;
            border-radius: 6px;
            background-color: #e0f2ff;
            margin-top: 1rem;
            color: #004085;
            font-weight: 500;
        }
        #selected-customer-name {
            flex-grow: 1;
            padding-right: 10px;
        }
        #clear-customer-selection-btn {
            background-color: #6c757d; /* Muted clear button */
            padding: 0.4rem 0.7rem;
            font-size: 0.8rem;
            line-height: 1;
            margin-left: 10px;
            box-shadow: none;
        }
        #clear-customer-selection-btn:hover {
            background-color: #5a6268;
        }

        /* Cart styling */
        .cart-title {
            margin-top: 0;
            /* Removed border-top */
            padding-top: 0; /* Adjust padding as border-top is removed */
            color: #333;
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .cart-items table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        .cart-items th, .cart-items td {
            border: 1px solid #e9ecef;
            padding: 12px 15px;
            text-align: left;
            font-size: 0.9rem;
            color: #495057;
        }
        .cart-items th {
            background-color: #f8f9fa;
            font-weight: 700;
            color: #343a40;
            text-transform: uppercase;
        }
        .total {
            font-size: 1.3rem; /* Adjusted size */
            font-weight: bold;
            text-align: right;
            margin-top: 1rem;
            color: #333; /* Blackish color */
            background-color: #ffffff; /* White tone background */
            padding: 0.6rem 0.8rem; /* Adjusted padding */
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            margin-bottom: 0.5rem; /* Small gap to button */
        }
      </style>
      <div class="overall-sales-layout-container">
        <div class="top-sales-section">
          <div class="main-content transaction-form">
            <div class="form-group customer-search-wrapper">
                <label for="customer-search-input-sale">고객 검색</label>
                <input type="text" id="customer-search-input-sale" placeholder="고객 이름 또는 연락처 입력/검색 후 선택" value="${this.selectedCustomer ? `${this.selectedCustomer.name} (${this.selectedCustomer.phone})` : ''}">
                <ul id="customer-search-results-sale" class="customer-search-results"></ul>
            </div>
            <div class="form-group selected-customer-group" style="display:none;">
                <label>선택된 고객</label>
                <div id="selected-customer-display" class="selected-customer-display">
                    <span id="selected-customer-name"></span>
                    <button id="clear-customer-selection-btn" style="display:none;">X</button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="barcode-scanner-input">바코드 스캔 (USB 스캐너)</label>
                <input type="text" id="barcode-scanner-input" placeholder="여기에 바코드를 스캔하세요" inputmode="latin" lang="en" pattern="[A-Za-z0-9]*">
            </div>
            
            <div class="product-selection-group">
                <div class="form-group">

                    <button id="open-product-selection-modal-btn" class="add-to-cart-btn">제품 선택</button>
                </div>
            </div>
            
          </div>
          <div class="cart-section transaction-form">
              <h4 class="cart-title">장바구니</h4>
              <div class="scrollable-cart-items">
                <div class="cart-items"></div>
              </div>
              <div class="total">총액: $0.00</div>
              <div class="sale-actions">
                  <button id="complete-sale-btn">판매</button>
              </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('sale-transaction-component', SaleTransaction);
