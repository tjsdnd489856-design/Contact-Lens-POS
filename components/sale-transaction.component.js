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
    console.log('SaleTransaction: constructor called');

    // Bind event handlers
    this._handleBarcodeInputKeydown = this._handleBarcodeInputKeydown.bind(this);
    this._handleBarcodeInput = this._handleBarcodeInput.bind(this);
    this._handleCustomerSearchInput = this._handleCustomerSearchInput.bind(this);
    this._selectCustomerFromSearch = this._selectCustomerFromSearch.bind(this);
    this._clearCustomerSelection = this._clearCustomerSelection.bind(this);
    this._addToCartFromSelect = this._addToCartFromSelect.bind(this);
    this.completeSale = this.completeSale.bind(this);
    this._handleCustomersUpdated = this._handleCustomersUpdated.bind(this);
    this._handleSelectCustomerForSale = this._handleSelectCustomerForSale.bind(this);
    this._updateSelectedCustomerDisplay = this._updateSelectedCustomerDisplay.bind(this);
  }

  connectedCallback() {
    console.log('SaleTransaction: connectedCallback called');
    console.log('SaleTransaction: connectedCallback called');
    this._render();
    this._attachEventListeners();
    document.addEventListener('productsUpdated', this._render.bind(this));
    document.addEventListener('customersUpdated', this._handleCustomersUpdated);
    document.addEventListener('selectCustomerForSale', this._handleSelectCustomerForSale);
  }

  disconnectedCallback() {
    this._detachEventListeners();
    document.removeEventListener('productsUpdated', this._render.bind(this));
    document.removeEventListener('customersUpdated', this._handleCustomersUpdated);
    document.removeEventListener('selectCustomerForSale', this._handleSelectCustomerForSale);
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
      }
  }

  /**
   * Handles the 'selectCustomerForSale' custom event.
   * @param {CustomEvent} event - The custom event containing customerId.
   */
  _handleSelectCustomerForSale(event) {
    const customerId = event.detail.customerId;
    this.selectedCustomer = CustomerService.getCustomerById(customerId);
    this._updateSelectedCustomerDisplay();
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

    if (customerSearchInput) customerSearchInput.addEventListener('input', this._handleCustomerSearchInput);
    if (clearCustomerSelectionBtn) clearCustomerSelectionBtn.addEventListener('click', this._clearCustomerSelection);
    if (customerSearchResultsDiv) {
        customerSearchResultsDiv.addEventListener('click', (e) => {
            const selectedResult = e.target.closest('.customer-search-result-item');
            if (selectedResult) {
                const customerId = parseInt(selectedResult.dataset.customerId, 10);
                const customer = CustomerService.getCustomerById(customerId);
                if (customer) this._selectCustomerFromSearch(customer);
            }
        });
    }

    // Product and barcode listeners
    shadowRoot.querySelector('#add-to-cart-btn').addEventListener('click', this._addToCartFromSelect);
    shadowRoot.querySelector('#barcode-scanner-input').addEventListener('keydown', this._handleBarcodeInputKeydown);
    shadowRoot.querySelector('#barcode-scanner-input').addEventListener('input', this._handleBarcodeInput);
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

    if (customerSearchInput) customerSearchInput.removeEventListener('input', this._handleCustomerSearchInput);
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

    shadowRoot.querySelector('#add-to-cart-btn').removeEventListener('click', this._addToCartFromSelect);
    shadowRoot.querySelector('#barcode-scanner-input').removeEventListener('keydown', this._handleBarcodeInputKeydown);
    shadowRoot.querySelector('#barcode-scanner-input').removeEventListener('input', this._handleBarcodeInput);
    shadowRoot.querySelector('#complete-sale-btn').removeEventListener('click', this.completeSale);
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
   * Renders the customer search results.
   * @param {Array<Object>} customers - Array of customer objects to display.
   * @private
   */
  _renderCustomerSearchResults(customers) {
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
      
      if (customerSearchInput) customerSearchInput.value = ''; // Clear search input
      if (searchResultsDiv) searchResultsDiv.innerHTML = ''; // Clear search results

      this._updateSelectedCustomerDisplay();
  }

  /**
   * Clears the selected customer.
   * @private
   */
  _clearCustomerSelection() {
      this.selectedCustomer = null;
      this._updateSelectedCustomerDisplay();
  }

  /**
   * Updates the display of the selected customer's name and the clear button visibility.
   * @private
   */
  _updateSelectedCustomerDisplay() {
      const selectedCustomerNameSpan = this.shadowRoot.querySelector('#selected-customer-name');
      const clearButton = this.shadowRoot.querySelector('#clear-customer-selection-btn');

      if (this.selectedCustomer) {
          selectedCustomerNameSpan.textContent = `${this.selectedCustomer.name} (${this.selectedCustomer.phone})`;
          if (clearButton) clearButton.style.display = 'inline-block';
      } else {
          selectedCustomerNameSpan.textContent = '선택된 고객 없음';
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
          gtin: udiData.gtin,
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
   * Adds a product to the cart from the product selection dropdown.
   * @private
   */
  _addToCartFromSelect() {
    const productId = parseInt(this.shadowRoot.querySelector('#product-select').value, 10);
    const quantity = parseInt(this.shadowRoot.querySelector('#quantity').value, 10);
    const product = ProductService.getProductById(productId);

    if (!product) {
        alert(ALERT_MESSAGES.INVALID_PRODUCT_SELECTION);
        return;
    }
    this._addProductToCart(product, quantity);
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
      totalDiv.textContent = `총액: $0.00`;
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
    totalDiv.textContent = `총액: $${total.toFixed(2)}`;

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

    SalesService.addSale(this.selectedCustomer.id, saleItems)
      .then(() => {
        alert(ALERT_MESSAGES.SALE_SUCCESS);
        this.cart = [];
        this.selectedCustomer = null; // Clear selected customer after sale
        this._render(); // Re-render to clear cart and customer display
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

    this.shadowRoot.innerHTML = `
      <style>
        /* General styling */
        .transaction-form {
            background: #fdfdfd;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .form-title {
            margin-top: 0;
            color: #333;
            font-size: 1.8rem;
            border-bottom: 2px solid #eee;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
        }
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
        #add-to-cart-btn { background-color: #28a745; margin-top: 1rem; }
        #add-to-cart-btn:hover { background-color: #218838; }
        #complete-sale-btn { background-color: #007bff; margin-top: 1.5rem; }
        #complete-sale-btn:hover { background-color: #0069d9; }
        .remove-from-cart-btn {
            background-color: #dc3545;
            padding: 0.5rem 0.8rem;
            font-size: 0.85rem;
            margin-top: 0;
        }
        .remove-from-cart-btn:hover { background-color: #c82333; }

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
        .customer-search-result-item:hover {
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
            margin-top: 2.5rem;
            border-top: 1px solid #eee;
            padding-top: 2rem;
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
            font-size: 1.8rem;
            font-weight: bold;
            text-align: right;
            margin-top: 2rem;
            color: #28a745; /* Green for total */
        }
      </style>
      <div class="transaction-form">
        <h3 class="form-title">새로운 판매</h3>
        <div class="form-group customer-search-wrapper">
            <label for="customer-search-input-sale">고객 검색</label>
            <input type="text" id="customer-search-input-sale" placeholder="이름 또는 연락처로 고객 검색">
            <ul id="customer-search-results-sale" class="customer-search-results"></ul>
        </div>
        <div class="form-group selected-customer-group">
            <label>선택된 고객</label>
            <div id="selected-customer-display" class="selected-customer-display">
                <span id="selected-customer-name">${this.selectedCustomer ? `${this.selectedCustomer.name} (${this.selectedCustomer.phone})` : '선택된 고객 없음'}</span>
                <button id="clear-customer-selection-btn" style="display:${this.selectedCustomer ? 'inline-block' : 'none'};">X</button>
            </div>
        </div>
        
        <div class="product-selection-group">
            <div class="form-group">
                <label for="product-select">제품 선택</label>
                <select id="product-select">
                    <option value="">--제품을 선택하세요--</option>
                    ${products.map(p => `<option value="${p.id}">${p.brand} ${p.model} - $${p.price.toFixed(2)}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label for="barcode-scanner-input">바코드 스캔 (USB 스캐너)</label>
            <input type="text" id="barcode-scanner-input" placeholder="여기에 바코드를 스캔하세요" inputmode="latin" lang="en" pattern="[A-Za-z0-9]*">
        </div>
        
        <div class="form-group">
            <label for="quantity">수량</label>
            <input type="number" id="quantity" value="1" min="1">
        </div>
        <button id="add-to-cart-btn">카트에 추가</button>

        <div class="cart">
            <h4 class="cart-title">장바구니</h4>
            <div class="cart-items"></div>
            <div class="total">총액: $0.00</div>
        </div>
        
        <button id="complete-sale-btn">판매 완료</button>
      </div>
    `;
    this._renderCart();
    // Re-attach event listeners as shadowRoot.innerHTML was reset
    this._attachEventListeners();
  }
}

customElements.define('sale-transaction-component', SaleTransaction);
