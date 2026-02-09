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
};

// --- SaleTransaction Component ---
export default class SaleTransaction extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cart = [];
    this.selectedCustomer = null; // To store selected customer ID directly

    // Bind event handlers
    this._onCustomerSelectChange = this._onCustomerSelectChange.bind(this);
    this._addToCartFromSelect = this._addToCartFromSelect.bind(this);
    this._onUsbBarcodeScan = this._onUsbBarcodeScan.bind(this);
    this.completeSale = this.completeSale.bind(this);
  }

  connectedCallback() {
    this._render();
    this._attachEventListeners();
    document.addEventListener('productsUpdated', this._render.bind(this));
    document.addEventListener('customersUpdated', this._render.bind(this));
    document.addEventListener('selectCustomerForSale', this._handleSelectCustomerForSale.bind(this));
  }

  disconnectedCallback() {
    this._detachEventListeners();
    document.removeEventListener('productsUpdated', this._render.bind(this));
    document.removeEventListener('customersUpdated', this._render.bind(this));
    document.removeEventListener('selectCustomerForSale', this._handleSelectCustomerForSale.bind(this));
  }

  /**
   * Handles the 'selectCustomerForSale' custom event.
   * @param {CustomEvent} event - The custom event containing customerId.
   */
  _handleSelectCustomerForSale(event) {
    this.selectedCustomer = event.detail.customerId;
    if (this.shadowRoot.querySelector('#customer-select')) {
      this.shadowRoot.querySelector('#customer-select').value = this.selectedCustomer;
    }
  }

  /**
   * Attaches all necessary event listeners to the component's elements.
   * @private
   */
  _attachEventListeners() {
    const shadowRoot = this.shadowRoot;
    shadowRoot.querySelector('#customer-select').addEventListener('change', this._onCustomerSelectChange);
    shadowRoot.querySelector('#add-to-cart-btn').addEventListener('click', this._addToCartFromSelect);
    shadowRoot.querySelector('#barcode-scanner-input').addEventListener('keydown', this._onUsbBarcodeScan);
    shadowRoot.querySelector('#complete-sale-btn').addEventListener('click', this.completeSale);
  }

  /**
   * Detaches all event listeners.
   * @private
   */
  _detachEventListeners() {
    const shadowRoot = this.shadowRoot;
    shadowRoot.querySelector('#customer-select').removeEventListener('change', this._onCustomerSelectChange);
    shadowRoot.querySelector('#add-to-cart-btn').removeEventListener('click', this._addToCartFromSelect);
    shadowRoot.querySelector('#barcode-scanner-input').removeEventListener('keydown', this._onUsbBarcodeScan);
    shadowRoot.querySelector('#complete-sale-btn').removeEventListener('click', this.completeSale);
  }

  /**
   * Handles changes in the customer selection dropdown.
   * @param {Event} event - The change event.
   * @private
   */
  _onCustomerSelectChange(event) {
    this.selectedCustomer = parseInt(event.target.value, 10);
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
   * Handles USB barcode scanner input.
   * @param {KeyboardEvent} event - The keyboard event.
   * @private
   */
  _onUsbBarcodeScan(event) {
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
   * Renders the component's HTML structure and updates dynamic content.
   * @private
   */
  _render() {
    const customers = CustomerService.getCustomers();
    const products = ProductService.getProducts();

    this.shadowRoot.innerHTML = `
      <style>
        .transaction-form { background: #fdfdfd; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .form-title { margin-top: 0; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        select, input, button { width: 100%; padding: 0.8rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { cursor: pointer; color: white; font-size: 1rem; }
        #add-to-cart-btn { background-color: #3498db; margin-top: 1rem; }
        #complete-sale-btn { background-color: #27ae60; margin-top: 1rem; }
        .cart-title { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 2rem; }
        .cart-items table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .cart-items th, .cart-items td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .total { font-size: 1.5rem; font-weight: bold; text-align: right; margin-top: 1rem; }
        .product-selection-group { display: flex; gap: 1rem; align-items: flex-end; }
        .product-selection-group > div { flex-grow: 1; }
        #barcode-scanner-input { margin-bottom: 1rem; }
      </style>
      <div class="transaction-form">
        <h3 class="form-title">새로운 판매</h3>
        <div class="form-group">
          <label for="customer-select">고객 선택</label>
          <select id="customer-select" required>
            <option value="">--고객을 선택하세요--</option>
            ${customers.map(c => `<option value="${c.id}" ${c.id === this.selectedCustomer ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
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
            <input type="text" id="barcode-scanner-input" placeholder="여기에 바코드를 스캔하세요">
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

  /**
   * Renders the current state of the shopping cart.
   * @private
   */
  _renderCart() {
      const cartItemsContainer = this.shadowRoot.querySelector('.cart-items');
      let total = 0;
      if(this.cart.length === 0) {
          cartItemsContainer.innerHTML = '<p>장바구니가 비어 있습니다.</p>';
      } else {
        let cartTable = `
            <table>
                <thead><tr><th>제품</th><th>수량</th><th>가격</th><th>총액</th></tr></thead>
                <tbody>
        `;
        this.cart.forEach(item => {
            const itemTotal = item.product.price * item.quantity;
            total += itemTotal;
            cartTable += `
                <tr>
                    <td>${item.product.brand} ${item.product.model}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.product.price.toFixed(2)}</td>
                    <td>$${itemTotal.toFixed(2)}</td>
                </tr>
            `;
        });
        cartTable += '</tbody></table>';
        cartItemsContainer.innerHTML = cartTable;
      }
      this.shadowRoot.querySelector('.total').textContent = `총액: $${total.toFixed(2)}`;
  }

  /**
   * Completes the current sale transaction.
   * @public
   */
  completeSale() {
    if (!this.selectedCustomer || this.cart.length === 0) {
      alert(ALERT_MESSAGES.SELECT_CUSTOMER_AND_ITEMS);
      return;
    }
    const total = this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const sale = { customerId: this.selectedCustomer, items: this.cart, total };
    
    const success = SalesService.addSale(sale);
    
    if(success) {
        this.cart = [];
        this._renderCart();
        this.selectedCustomer = null; // Clear selected customer
        this.shadowRoot.querySelector('#customer-select').value = ''; // Update dropdown
        alert(ALERT_MESSAGES.SALE_SUCCESS);
    }
  }
}
customElements.define('sale-transaction', SaleTransaction);