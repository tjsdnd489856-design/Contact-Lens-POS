// --- Product Service (Singleton) ---
const ProductService = {
  _products: [
    { id: 1, brand: '아큐브', model: '오아시스 원데이', power: -1.25, price: 55.00, stock: 20 },
    { id: 2, brand: '바슈롬', model: '바이오트루 원데이', power: -2.50, price: 65.00, stock: 15 },
    { id: 3, brand: '알콘', model: '워터렌즈', power: -1.75, price: 70.00, stock: 4 },
    { id: 4, brand: '쿠퍼비전', model: '클래리티 원데이', power: -3.00, price: 75.00, stock: 30 },
  ],
  _nextId: 5,

  getProducts() {
    return [...this._products];
  },

  getProductById(id) {
    return this._products.find(p => p.id === id);
  },

  addProduct(product) {
    product.id = this._nextId++;
    this._products.push(product);
    this._notify();
  },

  updateProduct(updatedProduct) {
    const index = this._products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      this._products[index] = updatedProduct;
      this._notify();
    }
  },

  deleteProduct(id) {
    this._products = this._products.filter(p => p.id !== id);
    this._notify();
  },

  decreaseStock(productId, quantity) {
      const product = this.getProductById(productId);
      if (product) {
          product.stock -= quantity;
          this._notify();
      }
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('productsUpdated'));
  }
};

// --- ProductList Component ---
class ProductList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleDelete = this.handleDelete.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    document.addEventListener('productsUpdated', () => this._render());
  }
    
  connectedCallback() {
      this._render();
  }

  disconnectedCallback() {
    document.removeEventListener('productsUpdated', this._render);
  }

  handleDelete(e) {
    const id = parseInt(e.target.dataset.id, 10);
    if (confirm('이 제품을 삭제하시겠습니까?')) {
        ProductService.deleteProduct(id);
    }
  }

  handleEdit(e) {
    const id = parseInt(e.target.dataset.id, 10);
    const product = ProductService.getProductById(id);
    if (product) {
        document.dispatchEvent(new CustomEvent('editProduct', { detail: product }));
    }
  }

  _render() {
    const products = ProductService.getProducts();
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        thead { background-color: #34495e; color: #ecf0f1; }
        tr:nth-child(even) { background-color: #f8f9f9; }
        tr:hover { background-color: #ecf0f1; }
        .actions { text-align: center; }
        .actions button { cursor: pointer; padding: 8px 12px; margin-right: 5px; border: none; border-radius: 4px; color: white; transition: background-color 0.3s ease; }
        .edit-btn { background-color: #2980b9; }
        .delete-btn { background-color: #c0392b; }
        .low-stock { color: #c0392b; font-weight: bold; }
      </style>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>브랜드</th>
            <th>모델명</th>
            <th>도수 (D)</th>
            <th>가격</th>
            <th>재고</th>
            <th class="actions">동작</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr class="${product.stock < 5 ? 'low-stock-row' : ''}">
              <td>${product.id}</td>
              <td>${product.brand}</td>
              <td>${product.model}</td>
              <td>${product.power.toFixed(2)}</td>
              <td>$${product.price.toFixed(2)}</td>
              <td class="${product.stock < 5 ? 'low-stock' : ''}">${product.stock}</td>
              <td class="actions">
                <button class="edit-btn" data-id="${product.id}">수정</button>
                <button class="delete-btn" data-id="${product.id}">삭제</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    this.shadowRoot.innerHTML = ''; 
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', this.handleDelete));
    this.shadowRoot.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', this.handleEdit));
  }
}
customElements.define('product-list', ProductList);

// --- ProductForm Component ---
class ProductForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.populateForm = this.populateForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    connectedCallback() {
        this._render();
        this._form = this.shadowRoot.querySelector('form');
        document.addEventListener('editProduct', this.populateForm);
        this._form.addEventListener('submit', this.handleSubmit);
    }

    disconnectedCallback() {
        document.removeEventListener('editProduct', this.populateForm);
    }

    _render() {
        const template = document.createElement('template');
        template.innerHTML = `
          <style>
            form { background: #fdfdfd; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 2rem; }
            .form-title { margin-top: 0; margin-bottom: 1.5rem; font-weight: 400; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555; }
            input { width: 100%; padding: 0.8rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
            button { cursor: pointer; padding: 0.8rem 1.5rem; border: none; border-radius: 4px; color: white; background-color: #3498db; font-size: 1rem; }
          </style>
          <form>
            <h3 class="form-title">제품 추가 / 수정</h3>
            <input type="hidden" name="id">
            <div class="form-group">
              <label for="brand">브랜드</label>
              <input type="text" id="brand" name="brand" required>
            </div>
            <div class="form-group">
              <label for="model">모델명</label>
              <input type="text" id="model" name="model" required>
            </div>
            <div class="form-group">
              <label for="power">도수 (D)</label>
              <input type="number" id="power" name="power" step="0.25" required>
            </div>
            <div class="form-group">
              <label for="price">가격</label>
              <input type="number" id="price" name="price" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label for="stock">재고</label>
              <input type="number" id="stock" name="stock" min="0" required>
            </div>
            <button type="submit">제품 저장</button>
          </form>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    populateForm(e) {
        const product = e.detail;
        this._form.id.value = product.id;
        this._form.brand.value = product.brand;
        this._form.model.value = product.model;
        this._form.power.value = product.power;
        this._form.price.value = product.price;
        this._form.stock.value = product.stock;
        this.scrollIntoView({ behavior: 'smooth' });
        this._form.querySelector('button').textContent = '제품 수정';
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this._form);
        const product = {
            id: parseInt(formData.get('id'), 10) || null,
            brand: formData.get('brand'),
            model: formData.get('model'),
            power: parseFloat(formData.get('power')),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock'), 10),
        };

        if (product.id) {
            ProductService.updateProduct(product);
        } else {
            delete product.id;
            ProductService.addProduct(product);
        }

        this._form.reset();
        this._form.id.value = '';
        this._form.querySelector('button').textContent = '제품 저장';
    }
}
customElements.define('product-form', ProductForm);

// --- Customer Service (Singleton) ---
const CustomerService = {
  _customers: [
    { id: 1, name: '홍길동', phone: '010-1234-5678', email: 'hong.gd@email.com' },
    { id: 2, name: '김철수', phone: '010-9876-5432', email: 'kim.cs@email.com' },
  ],
  _nextId: 3,

  getCustomers() {
    return [...this._customers];
  },
  
  getCustomerById(id) {
      return this._customers.find(c => c.id === id);
  },

  addCustomer(customer) {
    customer.id = this._nextId++;
    this._customers.push(customer);
    this._notify();
  },

  updateCustomer(updatedCustomer) {
    const index = this._customers.findIndex(c => c.id === updatedCustomer.id);
    if (index !== -1) {
      this._customers[index] = updatedCustomer;
      this._notify();
    }
  },

  deleteCustomer(id) {
    this._customers = this._customers.filter(c => c.id !== id);
    this._notify();
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('customersUpdated'));
  }
};


// --- CustomerList Component ---
class CustomerList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleDelete = this.handleDelete.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    document.addEventListener('customersUpdated', () => this._render());
  }
    
  connectedCallback() {
      this._render();
  }

  disconnectedCallback() {
    document.removeEventListener('customersUpdated', this._render);
  }

  handleDelete(e) {
    const id = parseInt(e.target.dataset.id, 10);
    if (confirm('이 고객 정보를 삭제하시겠습니까?')) {
        CustomerService.deleteCustomer(id);
    }
  }

  handleEdit(e) {
    const id = parseInt(e.target.dataset.id, 10);
    const customer = CustomerService.getCustomerById(id);
    if (customer) {
        document.dispatchEvent(new CustomEvent('editCustomer', { detail: customer }));
    }
  }

  _render() {
    const customers = CustomerService.getCustomers();
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        thead { background-color: #34495e; color: #ecf0f1; }
        tr:nth-child(even) { background-color: #f8f9f9; }
        .actions { text-align: center; }
        .actions button { cursor: pointer; padding: 8px 12px; margin-right: 5px; border: none; border-radius: 4px; color: white; }
        .edit-btn { background-color: #2980b9; }
        .delete-btn { background-color: #c0392b; }
      </style>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>이름</th>
            <th>연락처</th>
            <th>이메일</th>
            <th class="actions">동작</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(customer => `
            <tr>
              <td>${customer.id}</td>
              <td>${customer.name}</td>
              <td>${customer.phone}</td>
              <td>${customer.email}</td>
              <td class="actions">
                <button class="edit-btn" data-id="${customer.id}">수정</button>
                <button class="delete-btn" data-id="${customer.id}">삭제</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', this.handleDelete));
    this.shadowRoot.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', this.handleEdit));
  }
}
customElements.define('customer-list', CustomerList);

// --- CustomerForm Component ---
class CustomerForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.populateForm = this.populateForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    
    connectedCallback() {
        this._render();
        this._form = this.shadowRoot.querySelector('form');
        document.addEventListener('editCustomer', this.populateForm);
        this._form.addEventListener('submit', this.handleSubmit);
    }
    
    disconnectedCallback() {
        document.removeEventListener('editCustomer', this.populateForm);
    }

    _render() {
        const template = document.createElement('template');
        template.innerHTML = `
          <style>
            form { background: #fdfdfd; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 2rem; }
            .form-title { margin-top: 0; margin-bottom: 1.5rem; font-weight: 400; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555; }
            input { width: 100%; padding: 0.8rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
            button { cursor: pointer; padding: 0.8rem 1.5rem; border: none; border-radius: 4px; color: white; background-color: #3498db; font-size: 1rem; }
          </style>
          <form>
            <h3 class="form-title">고객 추가 / 수정</h3>
            <input type="hidden" name="id">
            <div class="form-group">
              <label for="name">이름</label>
              <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
              <label for="phone">연락처</label>
              <input type="tel" id="phone" name="phone" required>
            </div>
            <div class="form-group">
              <label for="email">이메일</label>
              <input type="email" id="email" name="email" required>
            </div>
            <button type="submit">고객 저장</button>
          </form>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    populateForm(e) {
        const customer = e.detail;
        this._form.id.value = customer.id;
        this._form.name.value = customer.name;
        this._form.phone.value = customer.phone;
        this._form.email.value = customer.email;
        this.scrollIntoView({ behavior: 'smooth' });
        this._form.querySelector('button').textContent = '고객 수정';
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this._form);
        const customer = {
            id: parseInt(formData.get('id'), 10) || null,
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
        };

        if (customer.id) {
            CustomerService.updateCustomer(customer);
        } else {
            delete customer.id;
            CustomerService.addCustomer(customer);
        }

        this._form.reset();
        this._form.id.value = '';
        this._form.querySelector('button').textContent = '고객 저장';
    }
}
customElements.define('customer-form', CustomerForm);

// --- Sales Service (Singleton) ---
const SalesService = {
  _sales: [],
  _nextId: 1,

  getSales() {
    return [...this._sales];
  },

  addSale(sale) {
    for (const item of sale.items) {
        const product = ProductService.getProductById(item.product.id);
        if (!product || product.stock < item.quantity) {
            alert(`${item.product.brand} ${item.product.model} 제품의 재고가 부족합니다. 현재 재고: ${product.stock}개`);
            return false;
        }
    }
    
    for (const item of sale.items) {
        ProductService.decreaseStock(item.product.id, item.quantity);
    }

    sale.id = this._nextId++;
    sale.date = new Date();
    this._sales.push(sale);
    this._notify();
    return true;
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('salesUpdated'));
  }
};

// --- SaleTransaction Component ---
class SaleTransaction extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cart = [];
    this.rerender = this.rerender.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.completeSale = this.completeSale.bind(this);
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

// --- SalesList Component ---
class SalesList extends HTMLElement {
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
      document.removeEventListener('salesUpdated', this.rerender);
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

// --- Tab Switching Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tabs-nav .tab-button');
    const tabContents = document.querySelectorAll('main .tab-content');

    function showTab(tabId) {
        tabContents.forEach(content => {
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        tabButtons.forEach(button => {
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            const tabId = button.dataset.tab;
            showTab(tabId);
        });
    });

    // Show the initial active tab (products tab by default)
    showTab('products');
});
