import { ProductService } from '../services/product.service.js';

// --- ProductList Component ---
export default class ProductList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleDelete = this.handleDelete.bind(this); // These are no longer needed here
    this.handleEdit = this.handleEdit.bind(this);   // These are no longer needed here
    this.filterByBrand = this.filterByBrand.bind(this);
    this.showExpirationWarning = this.showExpirationWarning.bind(this); // Bind new method
    this._currentFilterBrand = null; // Default filter, no brand selected initially
    document.addEventListener('productsUpdated', () => this._render());
  }
    
  connectedCallback() {
      this._render(); // Initial render to show message or empty state
  }

  disconnectedCallback() {
    document.removeEventListener('productsUpdated', this._render);
  }

  handleDelete(e) { /* No longer used here */ }
  handleEdit(e) { /* No longer used here */ }

  filterByBrand(e) {
      const selectedBrand = e.target.dataset.brand;
      let brandToOpenModalWith = selectedBrand;
      if (selectedBrand === '전체') {
          brandToOpenModalWith = null; // Send null to modal to indicate "show all" or initial message
      }
      // Update internal state for active button styling
      this._currentFilterBrand = selectedBrand;
      this._render(); // Re-render buttons to update active state
      document.dispatchEvent(new CustomEvent('openBrandProductListModal', { detail: brandToOpenModalWith }));
  }

  showExpirationWarning() {
      document.dispatchEvent(new CustomEvent('openExpirationWarningModal'));
  }

  _render() {
    const uniqueBrands = ProductService.getUniqueBrands();

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .brand-filter-buttons {
            margin-bottom: 1rem;
            display: grid; /* Use grid for layout */
            grid-template-columns: repeat(5, 1fr); /* 5 columns, equal width */
            gap: 10px; /* Space between buttons */
            flex-wrap: wrap; /* Allow wrapping to next line if needed */
        }
        .brand-filter-button {
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            padding: 12px; /* Adjust padding as needed */
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            display: flex; /* Use flex for centering content */
            justify-content: center;
            align-items: center;
            text-align: center; /* Fallback for older browsers */
            box-sizing: border-box; /* Include padding and border in the element's total width and height */
            transition: background-color 0.2s, border-color 0.2s, color 0.2s;
        }
        .brand-filter-button:hover {
            background-color: #e0e0e0;
        }
        .brand-filter-button.active {
            background-color: #3498db;
            color: white;
            border-color: #3498db;
        }
        .expiration-warning-button {
            background-color: #ffc107; /* Warning yellow */
            border: 1px solid #ffc107;
            color: #333;
            padding: 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            display: block; /* Take full width */
            width: 100%;
            margin-top: 1rem; /* Space from above buttons */
            box-sizing: border-box;
            transition: background-color 0.2s, border-color 0.2s;
        }
        .expiration-warning-button:hover {
            background-color: #e0a800;
            border-color: #e0a800;
        }
      </style>
      <div class="brand-filter-buttons">
        ${uniqueBrands.map(brand => `
            <button class="brand-filter-button ${this._currentFilterBrand === brand ? 'active' : ''}" data-brand="${brand}">
                ${brand}
            </button>
        `).join('')}
      </div>
      <button class="expiration-warning-button" id="expiration-warning-btn">
          유통 기한 주의
      </button>
    `;
    this.shadowRoot.innerHTML = ''; 
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelectorAll('.brand-filter-button').forEach(btn => btn.addEventListener('click', this.filterByBrand));
    this.shadowRoot.getElementById('expiration-warning-btn').addEventListener('click', this.showExpirationWarning);
  }
}
customElements.define('product-list', ProductList);