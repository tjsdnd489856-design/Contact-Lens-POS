// --- SaleTransaction Component ---
export default class SaleTransaction extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cart = [];
    this.rerender = this.rerender.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.completeSale = this.completeSale.bind(this);
    this.setSelectedCustomer = this.setSelectedCustomer.bind(this);
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
        <div class="form-group">
          <label for="product-select">제품 선택</label>
          <select id="product-select">
            <option value="">--제품을 선택하세요--</option>
            ${products.map(p => `<option value="${p.id}">${p.brand} ${p.model} - $${p.price.toFixed(2)}</option>`).join('')}
          </select>
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
    this.shadowRoot.querySelector('#add-to-cart-btn').addEventListener('click', this.addToCart);
    this.shadowRoot.querySelector('#complete-sale-btn').addEventListener('click', this.completeSale);
    this._renderCart();
  }

  addToCart() {
    const productId = parseInt(this.shadowRoot.querySelector('#product-select').value, 10);
    const quantity = parseInt(this.shadowRoot.querySelector('#quantity').value, 10);
    const product = ProductService.getProductById(productId);

    if (!product || !quantity || quantity <= 0) {
        alert('유효한 제품과 수량을 선택해주세요.');
        return;
    }
    
    const cartItem = this.cart.find(item => item.product.id === productId);
    if(cartItem) {
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