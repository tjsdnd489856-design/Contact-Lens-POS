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
        document.dispatchEvent(new CustomEvent('openProductModal'));
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
        document.addEventListener('clearProductForm', () => this.clearForm());
    }

    disconnectedCallback() {
        // Clean up event listeners
        document.removeEventListener('editProduct', this.populateForm);
        this._form.removeEventListener('submit', this.handleSubmit);
        // No need to remove clearProductForm listener if it's component-specific
    }

    _render() {
        const template = document.createElement('template');
        template.innerHTML = `
          <style>
            form { 
              background: #fdfdfd; 
              padding: 1rem; 
              border-radius: 8px; 
              box-shadow: none; 
              margin-bottom: 1rem;
            }
            .form-title { 
              margin-top: 0; 
              margin-bottom: 1.5rem; 
              font-weight: 400; 
              font-size: 1.2rem;
            }
            .form-group { margin-bottom: 0.8rem; }
            label { 
              display: block; 
              margin-bottom: 0.3rem; 
              font-weight: 500; 
              color: #555; 
              font-size: 0.9rem;
            }
            input { 
              width: 100%; 
              padding: 0.6rem; 
              border: 1px solid #ccc; 
              border-radius: 4px; 
              box-sizing: border-box; 
            }
            button { 
              cursor: pointer; 
              padding: 0.7rem 1.5rem; 
              border: none; 
              border-radius: 4px; 
              color: white; 
              background-color: #3498db; 
              font-size: 1rem; 
              width: 100%;
              margin-top: 1rem;
            }
          </style>
          <form>
            <h3 class="form-title">제품 추가</h3>
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
            <button type="submit">제품 추가</button>
          </form>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    populateForm(e) {
        // This form is now for multi-add, so populating for a single edit is disabled.
        // In a real-world scenario, we might have different modes.
        this.clearForm();
        const product = e.detail;
        this.shadowRoot.querySelector('.form-title').textContent = '제품 수정';
        this._form.id.value = product.id;
        this._form.brand.value = product.brand;
        this._form.model.value = product.model;
        this._form.power.value = product.power;
        this._form.price.value = product.price;
        this._form.stock.value = product.stock;
        this._form.querySelector('button').textContent = '제품 수정';
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this._form);
        const id = parseInt(formData.get('id'), 10) || null;
        
        const product = {
            brand: formData.get('brand'),
            model: formData.get('model'),
            power: parseFloat(formData.get('power')),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock'), 10),
        };

        if (id) { // Handle edit form submission - directly update the product
             product.id = id;
             ProductService.updateProduct(product);
             document.dispatchEvent(new CustomEvent('closeProductModal'));
        } else { // Handle add to temporary list
            // Add a temporary ID for list management
            product.tempId = Date.now();
            document.dispatchEvent(new CustomEvent('addProductToModalList', { detail: product }));
            this.clearForm(); // Clear form for next entry
        }
    }

    clearForm() {
        this._form.reset();
        this._form.id.value = '';
        this.shadowRoot.querySelector('.form-title').textContent = '제품 추가';
        this._form.querySelector('button').textContent = '제품 추가';
    }
}
customElements.define('product-form', ProductForm);

// --- Customer Service (Singleton) ---
const CustomerService = {
  _customers: [
    { id: 1, name: '홍길동', phone: '010-1234-5678', rightS: -1.00, rightC: -0.50, rightAX: 180, leftS: -1.25, leftC: -0.75, leftAX: 90, purchaseHistory: [], lastPurchaseDate: null, notes: '', isVIP: false, isCaution: false },
    { id: 2, name: '김철수', phone: '010-9876-5432', rightS: -2.00, rightC: 0.00, rightAX: 0, leftS: -2.00, leftC: 0.00, leftAX: 0, purchaseHistory: [], lastPurchaseDate: null, notes: '', isVIP: false, isCaution: false },
  ],
  _nextId: 3,

  getCustomers() {
    return [...this._customers];
  },
  
  getCustomerById(id) {
      return this._customers.find(c => c.id === id);
  },
  
  isDuplicateCustomer(name, phone, id = null) {
      return this._customers.some(customer => 
          customer.name === name && 
          customer.phone === phone && 
          customer.id !== id
      );
  },

  searchCustomers(query) {
      if (!query) {
          return this.getCustomers();
      }
      const lowerCaseQuery = query.toLowerCase().trim();
      
      return this._customers.filter(customer => {
          const customerNameLower = customer.name.toLowerCase();
          const customerPhoneCleaned = customer.phone.replace(/-/g, '');
          const customerPhoneLower = customerPhoneCleaned.toLowerCase();

          // Search by name
          if (customerNameLower.includes(lowerCaseQuery)) {
              return true;
          }
          // Search by last 4 digits of phone
          if (customerPhoneCleaned.slice(-4).includes(lowerCaseQuery)) {
              return true;
          }
          // Search by any part of the phone number
          if (customerPhoneLower.includes(lowerCaseQuery)) {
              return true;
          }

          // Search by "이름 전화번호" format
          const queryParts = lowerCaseQuery.split(' ');
          if (queryParts.length >= 2) {
              const nameQuery = queryParts[0];
              const phoneQuery = queryParts.slice(1).join(''); // Join remaining parts for phone query
              if (customerNameLower.includes(nameQuery) && customerPhoneCleaned.includes(phoneQuery)) {
                  return true;
              }
          }

          return false; // No match found
      });
  },

  addCustomer(customer) {
    if (this.isDuplicateCustomer(customer.name, customer.phone)) {
        alert('중복된 고객입니다.');
        return false;
    }
    customer.id = this._nextId++;
    customer.purchaseHistory = []; // Initialize empty purchase history
    customer.lastPurchaseDate = null; // Initialize last purchase date
    customer.notes = ''; // Initialize notes
    customer.isVIP = customer.isVIP || false; // Initialize VIP
    customer.isCaution = customer.isCaution || false; // Initialize Caution
    // Initialize new dose fields
    customer.rightS = customer.rightS || null;
    customer.rightC = customer.rightC || null;
    customer.rightAX = customer.rightAX || 0;
    customer.leftS = customer.leftS || null;
    customer.leftC = customer.leftC || null;
    customer.leftAX = customer.leftAX || 0;

    this._customers.push(customer);
    this._notify();
    return true;
  },

  updateCustomer(updatedCustomer) {
    if (this.isDuplicateCustomer(updatedCustomer.name, updatedCustomer.phone, updatedCustomer.id)) {
        alert('중복된 고객입니다.');
        return false;
    }
    const index = this._customers.findIndex(c => c.id === updatedCustomer.id);
    if (index !== -1) {
      // Preserve purchase history and last purchase date
      updatedCustomer.purchaseHistory = this._customers[index].purchaseHistory; 
      updatedCustomer.lastPurchaseDate = this._customers[index].lastPurchaseDate; 
      this._customers[index] = updatedCustomer;
      this._notify();
      return true;
    }
    return false;
  },

  deleteCustomer(id) {
    this._customers = this._customers.filter(c => c.id !== id);
    this._notify();
  },

  addPurchaseToCustomerHistory(customerId, saleId, purchaseDate) {
    const customer = this.getCustomerById(customerId);
    if (customer) {
      customer.purchaseHistory.push(saleId);
      customer.lastPurchaseDate = purchaseDate; // Update last purchase date
      this._notify(); // Notify that customer data has changed
    }
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers: null, query: '' } }));
  }
};


// --- CustomerList Component ---
class CustomerList extends HTMLElement {
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

// --- CustomerForm Component ---
class CustomerForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.populateForm = this.populateForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.clearForm = this.clearForm.bind(this);
        this.formatPhoneNumber = this.formatPhoneNumber.bind(this);
        this.formatDose = this.formatDose.bind(this);
        this.formatAX = this.formatAX.bind(this); // New AX formatter
        this.handleDeleteClick = this.handleDeleteClick.bind(this); // Bind new delete handler
        this.handleVipCautionChange = this.handleVipCautionChange.bind(this);
    }
    
    connectedCallback() {
        this._render();
        this._form = this.shadowRoot.querySelector('form');
        this._form.phone.addEventListener('input', this.formatPhoneNumber); // Add event listener for phone formatting
        // Attaching formatDose to blur event for cleaner input
        this._form.rightS.addEventListener('blur', this.formatDose);
        this._form.rightC.addEventListener('blur', this.formatDose);
        this._form.leftS.addEventListener('blur', this.formatDose);
        this._form.leftC.addEventListener('blur', this.formatDose);
        // On input, allow user to type freely
        this._form.rightS.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); });
        this._form.rightC.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); });
        this._form.leftS.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); });
        this._form.leftC.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); });

        // AX fields
        this._form.rightAX.addEventListener('blur', this.formatAX);
        this._form.leftAX.addEventListener('blur', this.formatAX);
        this._form.rightAX.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }); // Only digits
        this._form.leftAX.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }); // Only digits


        this._form.isVIP.addEventListener('change', this.handleVipCautionChange);
        this._form.isCaution.addEventListener('change', this.handleVipCautionChange);

        document.addEventListener('editCustomer', this.populateForm);
        document.addEventListener('clearCustomerForm', this.clearForm); // Listen for clear event
        this._form.addEventListener('submit', this.handleSubmit);
        this.shadowRoot.querySelector('#delete-customer-from-form-btn')?.addEventListener('click', this.handleDeleteClick);
        this.handleVipCautionChange(); // Set initial state
    }
    
    disconnectedCallback() {
        this._form.phone.removeEventListener('input', this.formatPhoneNumber); // Remove event listener
        this._form.rightS.removeEventListener('blur', this.formatDose);
        this._form.rightC.removeEventListener('blur', this.formatDose);
        this._form.leftS.removeEventListener('blur', this.formatDose);
        this._form.leftC.removeEventListener('blur', this.formatDose);
        // Need to remove listeners for anonymous functions using a stored reference or re-create the listeners
        // For simplicity, re-assigning null or empty function if original anonymous function reference is not stored
        // A better approach would be to store the anonymous function reference if needed for removal.
        // For now, these anonymous listeners might remain if the element is re-attached without full DOM refresh.
        // Given the Web Component lifecycle, a full render often replaces innerHTML, effectively cleaning listeners.
        
        this._form.isVIP.removeEventListener('change', this.handleVipCautionChange);
        this._form.isCaution.removeEventListener('change', this.handleVipCautionChange);

        document.removeEventListener('editCustomer', this.populateForm);
        document.removeEventListener('clearCustomerForm', this.clearForm);
        this.shadowRoot.querySelector('#delete-customer-from-form-btn')?.removeEventListener('click', this.handleDeleteClick);
    }

    formatPhoneNumber(event) {
        let input = event.target.value.replace(/\D/g, ''); // Remove all non-digit characters
        let formattedInput = '';

        if (input.length > 10) { // 000-0000-0000 format
            formattedInput = input.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (input.length > 7) { // 000-0000-000 format (older phone numbers)
            formattedInput = input.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3');
        } else {
            formattedInput = input;
        }
        event.target.value = formattedInput;
    }

    formatDose(event) {
        let input = event.target.value;
        if (input === '' || input === null) {
            event.target.value = '';
            return;
        }
        // Remove non-numeric characters except for '-' and '.'
        input = input.replace(/[^0-9.-]/g, ''); 
        let floatValue = parseFloat(input);

        if (isNaN(floatValue)) {
            event.target.value = '';
            return;
        }
        
        if (floatValue === 0) {
            event.target.value = '0.00';
        } else if (floatValue < 0) {
            event.target.value = floatValue.toFixed(2);
        } else {
            event.target.value = '+' + floatValue.toFixed(2);
        }
    }

    formatAX(event) {
        let input = event.target.value;
        if (input === '' || input === null) {
            event.target.value = '';
            return;
        }
        let intValue = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (isNaN(intValue)) {
            event.target.value = '';
            return;
        }
        event.target.value = intValue.toString(); // Store as plain number string, will parse as int for saving.
    }

    handleVipCautionChange(event) {
        const isVIPChecked = this._form.isVIP.checked;
        const isCautionChecked = this._form.isCaution.checked;

        if (event && event.target.id === 'isVIP') {
            if (isVIPChecked) {
                this._form.isCaution.checked = false;
                this._form.isCaution.disabled = true;
            } else {
                this._form.isCaution.disabled = false;
            }
        } else if (event && event.target.id === 'isCaution') {
            if (isCautionChecked) {
                this._form.isVIP.checked = false;
                this._form.isVIP.disabled = true;
            } else {
                this._form.isVIP.disabled = false;
            }
        } else { // Initial load or clear form
            if (isVIPChecked) {
                this._form.isCaution.disabled = true;
            } else if (isCautionChecked) {
                this._form.isVIP.disabled = true;
            } else {
                this._form.isVIP.disabled = false;
                this._form.isCaution.disabled = false;
            }
        }
    }

    handleDeleteClick() {
        const customerId = parseInt(this._form.id.value, 10);
        if (customerId && confirm('이 고객 정보를 삭제하시겠습니까?')) {
            CustomerService.deleteCustomer(customerId);
            document.dispatchEvent(new CustomEvent('closeCustomerModal'));
        }
    }

    _render() {
        const template = document.createElement('template');
        template.innerHTML = `
          <style>
            form { background: #fdfdfd; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 2rem; }
            .form-title { margin-top: 0; margin-bottom: 1.5rem; font-weight: 400; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555; }
            input[type="text"], input[type="tel"], textarea {
                padding: 0.8rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
                width: 100%; /* Default to 100% width for general inputs */
            }

            .checkbox-group { display: flex; align-items: center; margin-bottom: 1rem; gap: 15px; }
            .checkbox-group label { margin-bottom: 0; display: flex; align-items: center; }
            .checkbox-group input[type="checkbox"] { width: auto; margin-right: 5px; }
            button { cursor: pointer; padding: 0.8rem 1.5rem; border: none; border-radius: 4px; color: white; background-color: #3498db; font-size: 1rem; }

            .power-fields-container {
                display: flex;
                flex-direction: row; /* Changed to row for side-by-side */
                justify-content: space-between; /* Distribute space between eye sections */
                gap: 10px;
                margin-bottom: 1rem;
            }
            .eye-section-wrapper { /* New wrapper for each eye to control width */
                flex: 1; /* Allow each eye section to take equal space */
                min-width: 250px; /* Ensure minimum width to prevent squishing */
                padding: 10px;
                border: 1px solid #eee;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            .eye-section-divider {
                width: 1px;
                background-color: #ccc;
                margin: 0 10px; /* Space around the divider */
            }
            h4 {
                margin: 0 0 0.5rem 0; /* Adjusted margin */
                font-size: 1em;
                color: #34495e;
                text-align: center; /* Center the eye titles */
            }
            .power-eye-section {
                display: flex;
                flex-wrap: nowrap; /* Prevent wrapping */
                justify-content: center; /* Center align fields within section */
                gap: 5px; /* Reduced space between S, C, AX fields */
                align-items: flex-end; /* Align inputs at the bottom */
            }
            .power-eye-section .power-field-group {
                display: flex;
                flex-direction: column; /* Stack label and input vertically */
                align-items: center; /* Center items in column */
                gap: 3px; /* Further reduced space between label and input */
                flex-grow: 0; /* Prevent growth to maintain size */
                flex-shrink: 0; /* Allow shrinking */
            }
            .power-eye-section .power-field-group label {
                margin-bottom: 0; /* Remove default label margin */
                white-space: nowrap; /* Prevent label wrapping */
                font-size: 0.8em; /* Smaller label font size */
            }
            .power-eye-section .power-field-group input[type="text"] {
                width: 55px; /* Slightly larger fixed width for dose inputs */
                padding: 0.4rem; /* Reduced padding */
                text-align: center; /* Center align text in dose inputs */
                font-size: 0.9em;
            }

            .form-group-inline {
                display: flex;
                align-items: flex-end; /* Align items to the bottom */
                gap: 20px; /* Space between name input and checkboxes */
                margin-bottom: 1rem;
            }

            #delete-customer-from-form-btn {
                background-color: #c0392b; /* Ensure delete button is red */
            }
            .form-buttons {
                display: flex;
                justify-content: flex-end; /* 모든 버튼을 오른쪽으로 정렬 */
                margin-top: 2rem;
            }
            #delete-customer-from-form-btn {
                background-color: #c0392b; /* 붉은색으로 설정 */
                margin-right: auto; /* 삭제 버튼을 왼쪽으로 밀어냅니다. */
            }
          </style>
          <form>
            <h3 class="form-title">고객 추가 / 수정</h3>
            <input type="hidden" name="id">
            <div class="form-group-inline">
                <div class="form-group" style="flex-grow: 1;">
                    <label for="name">이름</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="checkbox-group" style="margin-top: auto; padding-bottom: 0.5rem;">
                    <label>
                        <input type="checkbox" id="isVIP" name="isVIP"> VIP
                    </label>
                    <label>
                        <input type="checkbox" id="isCaution" name="isCaution"> 주의
                    </label>
                </div>
            </div>
            <div class="form-group">
              <label for="phone">연락처</label>
              <input type="tel" id="phone" name="phone" required>
            </div>

            <div class="power-fields-container">
                <div class="eye-section-wrapper">
                    <h4>오른쪽 눈</h4>
                    <div class="power-eye-section">
                        <div class="form-group power-field-group">
                          <label for="rightS">S</label>
                          <input type="text" id="rightS" name="rightS" step="0.25">
                        </div>
                        <div class="form-group power-field-group">
                          <label for="rightC">C</label>
                          <input type="text" id="rightC" name="rightC" step="0.25">
                        </div>
                        <div class="form-group power-field-group">
                          <label for="rightAX">AX</label>
                          <input type="text" id="rightAX" name="rightAX">
                        </div>
                    </div>
                </div>
                <div class="eye-section-divider"></div> <!-- Divider -->
                <div class="eye-section-wrapper">
                    <h4>왼쪽 눈</h4>
                    <div class="power-eye-section">
                        <div class="form-group power-field-group">
                          <label for="leftS">S</label>
                          <input type="text" id="leftS" name="leftS" step="0.25">
                        </div>
                        <div class="form-group power-field-group">
                          <label for="leftC">C</label>
                          <input type="text" id="leftC" name="leftC" step="0.25">
                        </div>
                        <div class="form-group power-field-group">
                          <label for="leftAX">AX</label>
                          <input type="text" id="leftAX" name="leftAX">
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-group">
              <label for="notes">비고</label>
              <textarea id="notes" name="notes" rows="3"></textarea>
            </div>
            <div class="form-buttons">
                <button type="button" id="delete-customer-from-form-btn">고객 삭제</button>
                <button type="submit">고객 추가</button>
            </div>
          </form>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    clearForm() {
        this._form.reset();
        this._form.id.value = '';
        this._form.querySelector('button[type="submit"]').textContent = '고객 추가';
        this.shadowRoot.querySelector('#delete-customer-from-form-btn').style.display = 'none'; // Hide delete button for new customer
        this.handleVipCautionChange(); // Reset checkbox states
    }

    populateForm(e) {
        const customer = e.detail;
        this._form.id.value = customer.id;
        this._form.name.value = customer.name;
        this._form.isVIP.checked = customer.isVIP;
        this._form.isCaution.checked = customer.isCaution;
        this._form.phone.value = customer.phone;
        // Populate new dose fields, applying formatting for display
        this._form.rightS.value = customer.rightS ? (customer.rightS > 0 ? '+' : '') + customer.rightS.toFixed(2) : '';
        this._form.rightC.value = customer.rightC ? (customer.rightC > 0 ? '+' : '') + customer.rightC.toFixed(2) : '';
        this._form.rightAX.value = customer.rightAX !== null ? customer.rightAX.toString() : '';
        this._form.leftS.value = customer.leftS ? (customer.leftS > 0 ? '+' : '') + customer.leftS.toFixed(2) : '';
        this._form.leftC.value = customer.leftC ? (customer.leftC > 0 ? '+' : '') + customer.leftC.toFixed(2) : '';
        this._form.leftAX.value = customer.leftAX !== null ? customer.leftAX.toString() : '';
        
        this._form.notes.value = customer.notes;
        this.scrollIntoView({ behavior: 'smooth' });
        this._form.querySelector('button[type="submit"]').textContent = '고객 수정';
        this.shadowRoot.querySelector('#delete-customer-from-form-btn').style.display = 'inline-block'; // Show delete button for existing customer
        this.handleVipCautionChange(); // Set checkbox states
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this._form);
        const customer = {
            id: parseInt(formData.get('id'), 10) || null,
            name: formData.get('name'),
            phone: formData.get('phone'),
            // Parse formatted dose string back to float
            rightS: parseFloat(formData.get('rightS')) || null,
            rightC: parseFloat(formData.get('rightC')) || null,
            rightAX: parseInt(formData.get('rightAX'), 10) || 0, // AX is integer, default 0
            leftS: parseFloat(formData.get('leftS')) || null,
            leftC: parseFloat(formData.get('leftC')) || null,
            leftAX: parseInt(formData.get('leftAX'), 10) || 0, // AX is integer, default 0
            notes: formData.get('notes'),
            isVIP: formData.get('isVIP') === 'on',
            isCaution: formData.get('isCaution') === 'on',
        };

        let success = false;
        if (customer.id) {
            success = CustomerService.updateCustomer(customer);
        } else {
            delete customer.id;
            success = CustomerService.addCustomer(customer);
        }

        if (success) {
            document.dispatchEvent(new CustomEvent('closeCustomerModal')); // Close modal on success
            this.clearForm(); // Clear form after successful save
        }
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
  
  getSalesByCustomerId(customerId) {
      return this._sales.filter(sale => sale.customerId === customerId);
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
    CustomerService.addPurchaseToCustomerHistory(sale.customerId, sale.id, sale.date); // Pass purchaseDate
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
    document.removeEventListener('salesUpdated', this._render);
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

// --- CustomerPurchaseHistory Component ---
class CustomerPurchaseHistory extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selectedCustomerId = null;
        this.renderHistory = this.renderHistory.bind(this);
        document.addEventListener('customerSelectedForHistory', (e) => this.renderHistory(e.detail));
        document.addEventListener('salesUpdated', () => this.renderHistory(this.selectedCustomerId)); // Re-render if sales update
    }

    renderHistory(customerId) {
        this.selectedCustomerId = customerId;
        const customer = customerId ? CustomerService.getCustomerById(customerId) : null;
        const sales = customer ? SalesService.getSalesByCustomerId(customerId) : [];

        // Group purchases by date and then by product
        const groupedPurchases = {}; // { date: { totalAmount: X, items: { productId: { ...item, totalQuantity, totalItemAmount } } } }

        sales.forEach(sale => {
            const date = new Date(sale.date).toISOString().split('T')[0]; // YYYY-MM-DD
            if (!groupedPurchases[date]) {
                groupedPurchases[date] = {
                    totalAmount: 0,
                    items: {} // { productId: { product, quantity, itemTotal } }
                };
            }

            sale.items.forEach(item => {
                if (!groupedPurchases[date].items[item.product.id]) {
                    groupedPurchases[date].items[item.product.id] = {
                        product: item.product,
                        quantity: 0,
                        itemTotal: 0
                    };
                }
                groupedPurchases[date].items[item.product.id].quantity += item.quantity;
                groupedPurchases[date].items[item.product.id].itemTotal += (item.product.price * item.quantity);
            });
            groupedPurchases[date].totalAmount += sale.total;
        });

        let tbodyContent = '';
        for (const date in groupedPurchases) {
            const dateGroup = groupedPurchases[date];
            const itemsArray = Object.values(dateGroup.items); // Convert items object to array
            const rowspan = itemsArray.length; // Number of unique items for this date

            itemsArray.forEach((item, itemIndex) => {
                tbodyContent += `
                    <tr>
                        ${itemIndex === 0 ? `<td rowspan="${rowspan}">${date}</td>` : ''}
                        <td>${item.product.brand} ${item.product.model}</td>
                        <td>$${item.itemTotal.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        ${itemIndex === 0 ? `<td rowspan="${rowspan}">$${dateGroup.totalAmount.toFixed(2)}</td>` : ''}
                    </tr>
                `;
            });
        }

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                h4 { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 2rem; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: center; } /* 검색 결과 가운데 정렬 */
                thead { background-color: #5cb85c; color: white; } /* Green header for purchase history */
                tbody tr:nth-child(even) { background-color: #f2f2f2; }
                .message { text-align: center; padding: 1rem; color: #555; }
                thead tr:hover { background-color: #5cb85c; cursor: default; } /* Prevent hover on header */
                thead th { text-align: center; } /* Center align header text */
            </style>
            <h4>고객 구매 내역</h4>
            ${customer ? `
                ${Object.keys(groupedPurchases).length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>구매일자</th>
                            <th>구매품목</th>
                            <th>금액</th>
                            <th>구매수량</th>
                            <th>총 금액</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tbodyContent}
                    </tbody>
                </table>
                ` : `<p class="message">선택된 고객의 구매 내역이 없습니다.</p>`}
            ` : `<p class="message">고객을 선택하면 구매 내역이 표시됩니다.</p>`}
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}
customElements.define('customer-purchase-history', CustomerPurchaseHistory);


// --- Tab Switching Logic ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOMContentLoaded fired: Initializing application.');
        const tabButtons = document.querySelectorAll('.tabs-nav .tab-button');
        const tabContents = document.querySelectorAll('main .tab-content');
        
        // Customer Modal
        const customerModal = document.getElementById('customer-modal');
        const closeCustomerButton = customerModal ? customerModal.querySelector('.close-button') : null;
        const addCustomerBtn = document.getElementById('add-customer-btn');
        const customerSearchInput = document.getElementById('customer-search-input');

        // Product Modal
        const productModal = document.getElementById('product-modal');
        const closeProductButton = productModal ? productModal.querySelector('.close-button') : null;
        const addProductBtn = document.getElementById('add-product-btn');
        const productModalLayout = document.getElementById('product-modal-layout');
        const saveAllProductsBtn = document.getElementById('save-all-products-btn');
        const tempProductListDiv = document.getElementById('temp-product-list');

        let productsToAdd = [];
        let isEditMode = false;

        if (!customerModal) console.error('Error: customer-modal element not found.');
        if (!closeCustomerButton) console.error('Error: close-button element not found within customer-modal.');
        if (!addCustomerBtn) console.error('Error: add-customer-btn element not found.');
        if (!customerSearchInput) console.error('Error: customer-search-input element not found.');
        
        if (!productModal) console.error('Error: product-modal element not found.');
        if (!closeProductButton) console.error('Error: close-button element not found within product-modal.');
        if (!addProductBtn) console.error('Error: add-product-btn element not found.');
        if (!saveAllProductsBtn) console.error('Error: save-all-products-btn element not found.');

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
            console.log(`Tab switched to: ${tabId}`);
        }
        
        // Customer Modal Logic
        function openCustomerModal() {
            if (customerModal) {
                customerModal.style.display = 'block';
                console.log('Customer modal opened.');
            } else {
                console.error('Attempted to open customer modal but element not found.');
            }
        }

        function closeCustomerModal() {
            if (customerModal) {
                customerModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('clearCustomerForm'));
                console.log('Customer modal closed.');
            } else {
                console.error('Attempted to close customer modal but element not found.');
            }
        }

        // Product Modal Logic
        function renderTempProductList() {
            if (productsToAdd.length === 0) {
                tempProductListDiv.innerHTML = '<p>추가할 제품이 없습니다.</p>';
                return;
            }
            let table = `
                <table>
                    <thead>
                        <tr>
                            <th>브랜드</th>
                            <th>모델명</th>
                            <th>도수</th>
                            <th>가격</th>
                            <th>재고</th>
                            <th>삭제</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productsToAdd.map(p => `
                            <tr>
                                <td>${p.brand}</td>
                                <td>${p.model}</td>
                                <td>${p.power}</td>
                                <td>${p.price}</td>
                                <td>${p.stock}</td>
                                <td><button class="remove-temp-product-btn" data-tempid="${p.tempId}">삭제</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            tempProductListDiv.innerHTML = table;

            // Add event listeners to remove buttons
            tempProductListDiv.querySelectorAll('.remove-temp-product-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tempId = parseInt(e.target.dataset.tempid, 10);
                    productsToAdd = productsToAdd.filter(p => p.tempId !== tempId);
                    renderTempProductList();
                });
            });
        }


        function openProductModal(editMode = false) {
            isEditMode = editMode;
            if (productModal) {
                if (isEditMode) {
                    productModalLayout.style.display = 'block';
                    document.getElementById('temp-product-list-container').style.display = 'none';
                    saveAllProductsBtn.style.display = 'none';
                } else {
                    productModalLayout.style.display = 'flex';
                    document.getElementById('temp-product-list-container').style.display = 'block';
                    saveAllProductsBtn.style.display = 'block';
                    productsToAdd = [];
                    renderTempProductList();
                }
                productModal.style.display = 'block';
                console.log('Product modal opened in ' + (isEditMode ? 'edit' : 'add') + ' mode.');
            } else {
                console.error('Attempted to open product modal but element not found.');
            }
        }

        function closeProductModal() {
            if (productModal) {
                productModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('clearProductForm'));
                console.log('Product modal closed.');
            } else {
                console.error('Attempted to close product modal but element not found.');
            }
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const tabId = button.dataset.tab;
                showTab(tabId);
            });
        });

        // Event listeners for customer modal
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => {
                console.log('Add Customer button clicked.');
                openCustomerModal();
                document.dispatchEvent(new CustomEvent('clearCustomerForm'));
            });
        }
        if (closeCustomerButton) {
            closeCustomerButton.addEventListener('click', closeCustomerModal);
        }
        document.addEventListener('closeCustomerModal', closeCustomerModal);
        document.addEventListener('openCustomerModal', openCustomerModal);
        
        // Event listeners for product modal
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                openProductModal(false); // Open in add mode
                document.dispatchEvent(new CustomEvent('clearProductForm'));
            });
        }

        document.addEventListener('openProductModal', (e) => {
             openProductModal(true); // Open in edit mode
        });


        if (closeProductButton) {
            closeProductButton.addEventListener('click', closeProductModal);
        }
        document.addEventListener('closeProductModal', closeProductModal);

        document.addEventListener('addProductToModalList', (e) => {
            productsToAdd.push(e.detail);
            renderTempProductList();
        });

        saveAllProductsBtn.addEventListener('click', () => {
            if (productsToAdd.length === 0) {
                alert('추가할 제품이 없습니다.');
                return;
            }
            productsToAdd.forEach(p => {
                const { tempId, ...product } = p;
                ProductService.addProduct(product);
            });
            closeProductModal();
        });

        // Event listener for customer search
        if (customerSearchInput) {
            customerSearchInput.addEventListener('input', (event) => {
                const query = event.target.value;
                console.log(`Customer search input: "${query}"`);
                const filteredCustomers = CustomerService.searchCustomers(query);
                document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers: filteredCustomers, query: query } }));
            });
        }

        // Event listener for tab switching to reset search and purchase history
        document.addEventListener('showTab', (e) => {
            showTab(e.detail.tabId);
            if (e.detail.tabId !== 'customers') {
                document.dispatchEvent(new CustomEvent('customerSelectedForHistory', { detail: null }));
            }
            if (e.detail.tabId === 'customers') {
                if (customerSearchInput) customerSearchInput.value = '';
                document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers: [], query: '' } }));
            }
        });


        // Show the initial active tab (customers tab by default)
        showTab('customers');
        console.log('Initial tab set to customers.');

    } catch (error) {
        console.error('Error during DOMContentLoaded initialization:', error);
    }
});
// Forced update comment