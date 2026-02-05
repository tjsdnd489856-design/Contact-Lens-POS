// --- ProductList Component ---
export default class ProductList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleDelete = this.handleDelete.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.filterByBrand = this.filterByBrand.bind(this);
    this._currentFilterBrand = '전체'; // Default filter
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

  filterByBrand(e) {
      this._currentFilterBrand = e.target.dataset.brand;
      this._render();
  }

  _render() {
    let products = ProductService.getProducts();
    const uniqueBrands = ProductService.getUniqueBrands();

    if (this._currentFilterBrand !== '전체') {
        products = products.filter(p => p.brand === this._currentFilterBrand);
    }

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .brand-filter-buttons {
            margin-bottom: 1rem;
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }
        .brand-filter-button {
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .brand-filter-button.active {
            background-color: #3498db;
            color: white;
            border-color: #3498db;
        }
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); /* 5 items per row, roughly square */
            gap: 20px;
            margin-top: 1rem;
        }
        .product-card {
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            aspect-ratio: 1 / 1; /* Make it square */
            position: relative;
            overflow: hidden;
        }
        .product-card.low-stock {
            border-color: #c0392b;
            box-shadow: 0 0 8px rgba(192, 57, 43, 0.4);
        }
        .product-card h4 {
            margin: 0 0 5px 0;
            font-size: 1.1rem;
            color: #333;
        }
        .product-card p {
            margin: 0;
            font-size: 0.9rem;
            color: #555;
        }
        .product-card .price {
            font-size: 1.1rem;
            font-weight: bold;
            color: #27ae60;
            margin-top: 10px;
        }
        .product-card .quantity {
            font-size: 1rem;
            color: #e67e22;
        }
        .product-card .actions {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 5px;
        }
        .product-card .actions button {
            padding: 6px 10px;
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            font-size: 0.85rem;
            transition: background-color 0.3s ease;
        }
        .product-card .edit-btn { background-color: #2980b9; }
        .product-card .delete-btn { background-color: #c0392b; }
      </style>
      <div class="brand-filter-buttons">
        ${uniqueBrands.map(brand => `
            <button class="brand-filter-button ${this._currentFilterBrand === brand ? 'active' : ''}" data-brand="${brand}">
                ${brand}
            </button>
        `).join('')}
      </div>
      <div class="product-grid">
          ${products.map(product => `
            <div class="product-card ${product.quantity < 5 ? 'low-stock' : ''}">
              <div>
                <h4>${product.brand} ${product.model}</h4>
                <p>S: ${product.powerS.toFixed(2)} / C: ${product.powerC.toFixed(2)} / AX: ${product.powerAX}</p>
                <p>유통기한: ${product.expirationDate}</p>
                <p class="quantity">수량: ${product.quantity}</p>
                <p class="price">$${product.price.toFixed(2)}</p>
              </div>
              <div class="actions">
                <button class="edit-btn" data-id="${product.id}">수정</button>
                <button class="delete-btn" data-id="${product.id}">삭제</button>
              </div>
            </div>
          `).join('')}
      </div>
    `;
    this.shadowRoot.innerHTML = ''; 
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', this.handleDelete));
    this.shadowRoot.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', this.handleEdit));
    this.shadowRoot.querySelectorAll('.brand-filter-button').forEach(btn => btn.addEventListener('click', this.filterByBrand));
  }
}
customElements.define('product-list', ProductList);
