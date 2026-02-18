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
    this._selectedSearchIndex = -1; // Index for keyboard navigation in search results
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
   * This is intended for other components like the side panel's customer purchase history.
   * @param {string|Object|null} customerData - The ID or full object of the selected customer.
   * @private
   */
  _dispatchSalesCustomerSelectedEvent = (customerData) => {
    document.dispatchEvent(new CustomEvent('salesCustomerSelected', { detail: customerData }));
  }

  /**
   * Handles the custom event when a customer is selected from another part of the app.
   * @param {CustomEvent} event - The event containing the customer data.
   * @private
   */
  _handleSalesCustomerSelected = (event) => {
    const customerData = event.detail;
    const fullCustomer = typeof customerData === 'object' && customerData !== null ? customerData : CustomerService.getCustomerById(customerData);

    // Prevent infinite loop: Only update if the selected customer is actually different
    if (fullCustomer && (!this.selectedCustomer || this.selectedCustomer.id !== fullCustomer.id)) {
      this.selectedCustomer = fullCustomer;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      
      if (customerSearchInput) {
        customerSearchInput.value = `${fullCustomer.name} (${fullCustomer.phone})`;
      }
      
      const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
      if (searchResultsDiv) {
        searchResultsDiv.innerHTML = '';
        searchResultsDiv.classList.add('hidden');
      }
      
      this._updateSelectedCustomerDisplay();
    } else if (!fullCustomer && this.selectedCustomer !== null) {
      // Handle deselection (customerData is null)
      this.selectedCustomer = null;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      if (customerSearchInput) customerSearchInput.value = '';
      this._updateSelectedCustomerDisplay();
    }
  }

  /**
   * Handles click and double-click events on the customer search results div.
   * @param {Event} e - The mouse event.
   * @private
   */
  _handleCustomerSearchResultAction = (e) => {
    const selectedResult = e.target.closest('.customer-search-result-item');
    if (selectedResult) {
      const customerId = selectedResult.dataset.customerId; 
      const customer = CustomerService.getCustomerById(customerId);
      if (customer) this._selectCustomerFromSearch(customer);
    }
  }

  /**
   * Handles the 'customersUpdated' event.
   * @param {CustomEvent} event - The custom event.
   * @private
   */
  _handleCustomersUpdated = (event) => {
      const { filteredCustomers, query } = event.detail;
      if (query) {
          window.requestAnimationFrame(() => this._renderCustomerSearchResults(filteredCustomers));
      } else {
          if (this.selectedCustomer && CustomerService.getCustomerById(this.selectedCustomer.id)) {
              this.selectedCustomer = CustomerService.getCustomerById(this.selectedCustomer.id);
          } else {
              this.selectedCustomer = null;
          }
          window.requestAnimationFrame(() => this._updateSelectedCustomerDisplay());
          // Update side panel if needed
          this._dispatchSalesCustomerSelectedEvent(this.selectedCustomer ? this.selectedCustomer.id : null);
      }
  }

  /**
   * Handles the 'productSelectedForSale' custom event.
   * @param {CustomEvent} event - The custom event.
   * @private
   */
  _handleProductSelectedForSale = (event) => {
      const { product, quantity } = event.detail;
      if (product) {
          this._addProductToCart(product, quantity || DEFAULT_QUANTITY);
      }
  }

  /**
   * Attaches event listeners.
   * @private
   */
  _attachEventListeners = () => {
    const shadowRoot = this.shadowRoot;
    const customerSearchInput = shadowRoot.querySelector('#customer-search-input-sale');
    const clearCustomerSelectionBtn = shadowRoot.querySelector('#clear-customer-selection-btn');
    const customerSearchResultsDiv = shadowRoot.querySelector('#customer-search-results-sale');

    if (customerSearchInput) {
      customerSearchInput.addEventListener('input', this._handleCustomerSearchInput);
      customerSearchInput.addEventListener('keydown', this._handleCustomerSearchKeydown);
    }
    if (clearCustomerSelectionBtn) clearCustomerSelectionBtn.addEventListener('click', this._clearCustomerSelection);
    if (customerSearchResultsDiv) {
        customerSearchResultsDiv.addEventListener('click', this._handleCustomerSearchResultAction);
        customerSearchResultsDiv.addEventListener('dblclick', this._handleCustomerSearchResultAction);
    }

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
  _detachEventListeners = () => {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

    const customerSearchInput = shadowRoot.querySelector('#customer-search-input-sale');
    const clearCustomerSelectionBtn = shadowRoot.querySelector('#clear-customer-selection-btn');
    const customerSearchResultsDiv = shadowRoot.querySelector('#customer-search-results-sale');

    if (customerSearchInput) {
      customerSearchInput.removeEventListener('input', this._handleCustomerSearchInput);
      customerSearchInput.removeEventListener('keydown', this._handleCustomerSearchKeydown);
    }
    if (clearCustomerSelectionBtn) clearCustomerSelectionBtn.removeEventListener('click', this._clearCustomerSelection);
    if (customerSearchResultsDiv) {
        customerSearchResultsDiv.removeEventListener('click', this._handleCustomerSearchResultAction);
        customerSearchResultsDiv.removeEventListener('dblclick', this._handleCustomerSearchResultAction);
    }

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
   * Resets the entire sales transaction form.
   * @public
   */
  reset = () => {
      this.cart = [];
      this.selectedCustomer = null;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      if (customerSearchInput) customerSearchInput.value = '';
      const barcodeInput = this.shadowRoot.querySelector('#barcode-scanner-input');
      if (barcodeInput) barcodeInput.value = '';

      this._updateSelectedCustomerDisplay();
      this._dispatchSalesCustomerSelectedEvent(null);
      this._render();
  }

  /**
   * Handles changes in the customer search input.
   * @private
   */
  _handleCustomerSearchInput = (event) => {
      const query = event.target.value.trim();
      if (query.length > 0) {
          window.requestAnimationFrame(() => this._renderCustomerSearchResults(CustomerService.searchCustomers(query)));
      } else {
          window.requestAnimationFrame(() => this._renderCustomerSearchResults([]));
      }
  }

  /**
   * Handles keydown events on the customer search input.
   * @private
   */
  _handleCustomerSearchKeydown = (event) => {
    if (!this.shadowRoot) return;
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
        } else if (items.length > 0) {
          items[0].click();
        }
        break;
      case 'Escape':
        searchResultsDiv.innerHTML = '';
        searchResultsDiv.classList.add('hidden');
        this._selectedSearchIndex = -1;
        break;
    }
  }

  /**
   * Updates visual selection.
   * @private
   */
  _updateSelectedSearchResult = (items) => {
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
   * Renders search results.
   * @private
   */
  _renderCustomerSearchResults = (customers) => {
      this._selectedSearchIndex = -1;
      const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
      if (searchResultsDiv) {
          if (customers.length === 0) {
              searchResultsDiv.innerHTML = '';
              searchResultsDiv.classList.add('hidden');
              return;
          }
          searchResultsDiv.innerHTML = customers.map(c => `
              <div class="customer-search-result-item" data-customer-id="${c.id}">
                  ${c.name} (${c.phone})
              </div>
          `).join('');
          searchResultsDiv.classList.remove('hidden');
      }
  }

  /**
   * Selects a customer from search results.
   * @private
   */
  _selectCustomerFromSearch = (customer) => {
      this.selectedCustomer = customer;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      const searchResultsDiv = this.shadowRoot.querySelector('#customer-search-results-sale');
      
      if (customerSearchInput) {
        customerSearchInput.value = `${customer.name} (${customer.phone})`;
      }
      if (searchResultsDiv) {
        searchResultsDiv.innerHTML = '';
        searchResultsDiv.classList.add('hidden');
      }
      this._updateSelectedCustomerDisplay();
      // Notify the entire system (including side panel) about the selection
      this._dispatchSalesCustomerSelectedEvent(customer);
  }

  /**
   * Clears selection.
   * @private
   */
  _clearCustomerSelection = () => {
      this.selectedCustomer = null;
      const customerSearchInput = this.shadowRoot.querySelector('#customer-search-input-sale');
      if (customerSearchInput) customerSearchInput.value = '';
      this._updateSelectedCustomerDisplay();
      this._dispatchSalesCustomerSelectedEvent(null);
  }

  /**
   * Updates display.
   * @private
   */
  _updateSelectedCustomerDisplay = () => {
      const clearButton = this.shadowRoot.querySelector('#clear-customer-selection-btn');
      if (this.selectedCustomer) {
          if (clearButton) clearButton.style.display = 'inline-block';
      } else {
          if (clearButton) clearButton.style.display = 'none';
      }
  }
  
  /**
   * Handles barcode input.
   * @private
   */
  _handleBarcodeInput = (e) => {
      let input = e.target.value;
      input = input.replace(/[^A-Za-z0-9]/g, '');
      e.target.value = input.toUpperCase();
  }
  
  /**
   * Handles barcode keydown.
   * @private
   */
  _handleBarcodeInputKeydown = (event) => {
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
   * Processes barcode.
   * @private
   */
  async _processBarcodeString(barcodeString) {
    const udiData = parseUdiBarcode(barcodeString);
    let product = await this._findProduct(udiData, barcodeString);
    if (product) {
      this._addProductToCart(product, DEFAULT_QUANTITY);
    } else {
      alert(ALERT_MESSAGES.PRODUCT_NOT_FOUND(barcodeString));
    }
  }

  /**
   * Finds product.
   * @private
   */
  async _findProduct(udiData, barcodeString) {
    let product = null;
    if (udiData.gtin) {
      product = ProductService.getProductByGtin(udiData.gtin);
      if (product) return product;
      const externalProduct = await ProductService.fetchProductDetailsFromExternalApi(udiData.gtin);
      if (externalProduct && externalProduct.productFound) {
        ProductService.addProduct({
          ...externalProduct,
          barcode: udiData.gtin,
          udiDi: udiData.gtin,
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
   * Opens product modal.
   * @private
   */
  _handleOpenProductSelectionModal = () => {
    document.dispatchEvent(new CustomEvent('openProductSelectionModal'));
  }

  /**
   * Adds product to cart.
   * @private
   */
  _addProductToCart = (product, quantity) => {
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
   * Removes from cart.
   * @private
   */
  _removeFromCart = (productId) => {
    this.cart = this.cart.filter(item => item.product.id !== productId);
    this._renderCart();
  }

  /**
   * Renders cart.
   * @private
   */
  _renderCart = () => {
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
        const productId = e.target.dataset.productId;
        this._removeFromCart(productId);
      });
    });
  }

  /**
   * Completes sale.
   * @private
   */
  completeSale = () => {
    if (!this.selectedCustomer) {
      alert(ALERT_MESSAGES.NO_CUSTOMER_SELECTED);
      return;
    }
    if (this.cart.length === 0) {
      alert(ALERT_MESSAGES.SELECT_CUSTOMER_AND_ITEMS);
      return;
    }
    const total = this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const saleItems = this.cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price
    }));

    SalesService.addSale({ 
      customerId: this.selectedCustomer.id, 
      items: saleItems,
      total: total
    })
      .then(() => {
        alert(ALERT_MESSAGES.SALE_SUCCESS);
        this.cart = [];
        this.selectedCustomer = null;
        this._render();
        this._dispatchSalesCustomerSelectedEvent(null);
      })
      .catch(error => {
        alert(`판매 실패: ${error.message}`);
        console.error('Error completing sale:', error);
      });
  }
  
  /**
   * Renders component.
   * @private
   */
  _render = () => {
    const products = ProductService.getProducts();
    this._detachEventListeners();
    this.shadowRoot.innerHTML = this._getSalesTemplate(products);
    this._renderCart();
    this._attachEventListeners();
  }

  /**
   * Template.
   * @private
   */
  _getSalesTemplate = (products) => {
    return `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .overall-sales-layout-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
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
        @media (max-width: 768px) {
            .top-sales-section { flex-direction: column; padding: 1rem; }
            .main-content, .cart-section { flex: none; width: 100%; min-width: unset; }
        }
        .form-group { 
            margin-bottom: 1.5rem; 
            border-bottom: none !important; /* Ensure no bottom border */
        }
        /* Specific removal for customer search group bottom line */
        .customer-search-wrapper {
            border-bottom: none !important;
            padding-bottom: 0;
        }
        label { display: block; margin-bottom: 0.6rem; font-weight: 600; color: #555; font-size: 0.95rem; }
        input[type="text"], input[type="number"] {
            width: 100%; padding: 0.9rem 1rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-size: 1rem;
        }
        button {
            cursor: pointer; color: white; padding: 0.9rem 1.2rem; border: none; border-radius: 6px; font-weight: 600;
        }
        #open-product-selection-modal-btn { background-color: #28a745; }
        #complete-sale-btn { background-color: #007bff; }
        .remove-from-cart-btn { background-color: #dc3545; padding: 0.5rem 0.8rem; font-size: 0.85rem; }
        .customer-search-wrapper { position: relative; }
        .customer-search-results {
            position: absolute; background-color: white; border: 1px solid #ddd; border-radius: 6px; max-height: 200px; overflow-y: auto; width: 100%; z-index: 10;
            list-style: none; padding: 0; margin: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .customer-search-results.hidden { display: none; }
        .customer-search-result-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #eee; }
        .customer-search-result-item:hover, .customer-search-result-item.selected { background-color: #f8f9fa; color: #007bff; }
        .selected-customer-display {
            display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border: 1px solid #cce5ff; border-radius: 6px; background-color: #e0f2ff; margin-top: 1rem;
        }
        #clear-customer-selection-btn { background-color: #6c757d; padding: 0.4rem 0.7rem; font-size: 0.8rem; margin-left: 10px; }
        .cart-title { font-size: 1.5rem; margin-bottom: 1.5rem; }
        .cart-items table { width: 100%; border-collapse: collapse; }
        .cart-items th, .cart-items td { border: 1px solid #e9ecef; padding: 12px 15px; text-align: left; }
        .total { font-size: 1.3rem; font-weight: bold; text-align: right; margin-top: 1rem; padding: 0.6rem 0.8rem; }
        .sale-actions { display: flex; justify-content: flex-end; }
      </style>
      <div class="overall-sales-layout-container">
        <div class="top-sales-section">
          <div class="main-content">
            <div class="form-group customer-search-wrapper">
                <label for="customer-search-input-sale">고객 검색</label>
                <input type="text" id="customer-search-input-sale" placeholder="고객 이름 또는 연락처 입력/검색 후 선택" value="${this.selectedCustomer ? `${this.selectedCustomer.name} (${this.selectedCustomer.phone})` : ''}">
                <ul id="customer-search-results-sale" class="customer-search-results"></ul>
            </div>
            <div class="form-group">
                <label for="barcode-scanner-input">바코드 스캔 (USB 스캐너)</label>
                <input type="text" id="barcode-scanner-input" placeholder="여기에 바코드를 스캔하세요">
            </div>
            <div class="product-selection-group">
                <button id="open-product-selection-modal-btn">제품 선택</button>
            </div>
          </div>
          <div class="cart-section">
              <h4 class="cart-title">장바구니</h4>
              <div class="cart-items"></div>
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
