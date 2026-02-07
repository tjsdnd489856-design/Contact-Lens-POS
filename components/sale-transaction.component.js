import { CustomerService } from '../services/customer.service.js';
import { ProductService } from '../services/product.service.js';
import { SalesService } from '../services/sales.service.js';
import { parseUdiBarcode } from '../utils/udi-parser.js';

// --- SaleTransaction Component ---
export default class SaleTransaction extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cart = [];

    this.rerender = this.rerender.bind(this);
    this._addToCartFromSelect = this._addToCartFromSelect.bind(this);
    this._addProductToCart = this._addProductToCart.bind(this);
    this.completeSale = this.completeSale.bind(this);
    this.setSelectedCustomer = this.setSelectedCustomer.bind(this);
    this._onUsbBarcodeScan = this._onUsbBarcodeScan.bind(this);
    this._processBarcodeString = this._processBarcodeString.bind(this);

    document.addEventListener('selectCustomerForSale', (e) => this.setSelectedCustomer(e.detail.customerId));
  }

  connectedCallback() {
    this._render();
    document.addEventListener('productsUpdated', this.rerender);
    document.addEventListener('customersUpdated', this.rerender);
  }

  disconnectedCallback() {
    document.removeEventListener('productsUpdated', this.rerender);
    document.removeEventListener('customersUpdated', this.rerender);
  }

  rerender() {
    this._render();
  }

  setSelectedCustomer(customerId) {
    this.shadowRoot.querySelector('#customer-select').value = customerId;
  }
  
  async _processBarcodeString(barcodeString) {
    console.log(`Scanned Barcode: ${barcodeString}`);
    const udiData = parseUdiBarcode(barcodeString);
    console.log('Parsed UDI Data:', udiData);

    let product = null;

    if (udiData.gtin) {
        // First, try to find product locally using the parsed GTIN
        product = ProductService.getProductByGtin(udiData.gtin);

        if (!product) {
            // If not found locally, try to fetch from external API via Firebase Function
            console.log('Product not found locally by GTIN, fetching from external API...');
            const externalProduct = await ProductService.fetchProductDetailsFromExternalApi(udiData.gtin);
            
            if (externalProduct && externalProduct.productFound) { // Check productFound flag
                // Add to local service
                ProductService.addProduct({
                    ...externalProduct,
                    id: ProductService._nextId, // Assign new local ID
                    barcode: udiData.gtin, // Use GTIN as barcode for consistency
                    gtin: udiData.gtin,
                    // Assume default power and wearType if not provided by external API
                    powerS: externalProduct.power || 0,
                    powerC: 0,
                    powerAX: 0,
                    quantity: 1, // Default to 1
                    expirationDate: '2099-12-31', // Placeholder
                    price: 0.00, // Placeholder
                });
                product = ProductService.getProductByGtin(udiData.gtin); // Get the newly added product
                alert(`외부 API에서 제품 정보를 가져왔습니다: ${product.model}`);
            }
        }
    } else {
        // If no valid GTIN found from UDI parsing, try as a legacy barcode
        console.log('Not a UDI formatted string with GTIN, trying as legacy barcode...');
        product = ProductService.getProductByLegacyBarcode(barcodeString);
    }
    
    if (product) {
        this._addProductToCart(product, 1); // Default quantity to 1
    } else {
        alert(`바코드 "${barcodeString}"에 해당하는 제품을 로컬 및 외부 API에서 찾을 수 없습니다.`);
    }
  }

  _onUsbBarcodeScan(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      const barcodeInput = this.shadowRoot.querySelector('#barcode-scanner-input');
      const barcodeString = barcodeInput.value;
      if (barcodeString) {
        this._processBarcodeString(barcodeString);
        barcodeInput.value = ''; // Clear the input field after processing
      }
    }
  }


  _render() {
    const customers = CustomerService.getCustomers();
    const products = ProductService.getProducts();

    const template = document.createElement('template');
    template.innerHTML = `
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
        #barcode-scanner-input { margin-bottom: 1rem; } /* Style for new input */
      </style>
      <div class="transaction-form">
        <h3 class="form-title">새로운 판매</h3>
        <div class="form-group">
          <label for="customer-select">고객 선택</label>
          <select id="customer-select" required>
            <option value="">--고객을 선택하세요--</option>
            ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
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
            <!-- Removed #scan-udi-btn -->
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
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelector('#add-to-cart-btn').addEventListener('click', this._addToCartFromSelect);
    this.shadowRoot.querySelector('#barcode-scanner-input').addEventListener('keydown', this._onUsbBarcodeScan);
    this.shadowRoot.querySelector('#complete-sale-btn').addEventListener('click', this.completeSale);
    this._renderCart();
  }

  _addToCartFromSelect() {
    const productId = parseInt(this.shadowRoot.querySelector('#product-select').value, 10);
    const quantity = parseInt(this.shadowRoot.querySelector('#quantity').value, 10);
    const product = ProductService.getProductById(productId);

    if (!product) {
        alert('유효한 제품을 선택해주세요.');
        return;
    }
    this._addProductToCart(product, quantity);
  }

  _addProductToCart(product, quantity) {
    if (!quantity || quantity <= 0) {
        alert('유효한 수량을 입력해주세요.');
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

  completeSale() {
    const customerId = parseInt(this.shadowRoot.querySelector('#customer-select').value, 10);
    if (!customerId || this.cart.length === 0) {
      alert('고객을 선택하고 장바구니에 제품을 추가해주세요.');
      return;
    }
    const total = this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const sale = { customerId, items: this.cart, total };
    
    const success = SalesService.addSale(sale);
    
    if(success) {
        this.cart = [];
        this._renderCart();
        this.shadowRoot.querySelector('#customer-select').value = '';
        alert('판매가 성공적으로 완료되었습니다!');
    }
  }
}
customElements.define('sale-transaction', SaleTransaction);