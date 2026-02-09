import { ProductService } from '../services/product.service.js';

// --- Constants ---
const MESSAGES = {
  NO_EXPIRING_PRODUCTS: '유통기한이 임박한 제품이 없습니다.',
};

const PRODUCT_LIST_STYLES = `
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
    .expiration-warning-section {
        margin-top: 2rem; /* Increased margin to separate from brand buttons */
        border-top: 1px solid #eee;
        padding-top: 1.5rem;
    }
    .expiration-warning-section h3 {
        text-align: center;
        color: #d9534f; /* Danger red */
        margin-bottom: 1rem;
    }
    .expiration-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    .expiration-table th, .expiration-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: center;
    }
    .expiration-table th {
        background-color: #f2f2f2;
    }
    .expiration-table tbody tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    .message {
        text-align: center;
        padding: 20px;
        color: #555;
    }
`;

// --- ProductList Component ---
export default class ProductList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._currentFilterBrand = null; // Default filter, no brand selected initially
    
    // Bind event handlers
    this._handleProductsUpdated = this._handleProductsUpdated.bind(this);
    this._filterByBrand = this._filterByBrand.bind(this);
  }
    
  connectedCallback() {
      this._render(); // Initial render to show message or empty state
      document.addEventListener('productsUpdated', this._handleProductsUpdated);
  }

  disconnectedCallback() {
    document.removeEventListener('productsUpdated', this._handleProductsUpdated);
  }

  /**
   * Handles the 'productsUpdated' event to re-render the list.
   * @private
   */
  _handleProductsUpdated() {
    this._render();
  }

  /**
   * Filters products by brand and opens the brand product list modal.
   * @param {Event} e - The click event from the brand filter button.
   * @private
   */
  _filterByBrand(e) {
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

  /**
   * Generates the HTML for the brand filter buttons.
   * @param {Array<string>} uniqueBrands - List of unique brand names.
   * @returns {string} HTML string for brand filter buttons.
   * @private
   */
  _generateBrandFilterButtonsHtml(uniqueBrands) {
    return uniqueBrands.map(brand => `
        <button class="brand-filter-button ${this._currentFilterBrand === brand ? 'active' : ''}" data-brand="${brand}">
            ${brand}
        </button>
    `).join('');
  }

  /**
   * Generates the HTML for the expiration warning table.
   * @param {Array<Object>} expiringProducts - List of products expiring soon.
   * @returns {string} HTML string for the expiration table or a message.
   * @private
   */
  _generateExpirationTableHtml(expiringProducts) {
    if (expiringProducts.length === 0) {
        return `<p class="message">${MESSAGES.NO_EXPIRING_PRODUCTS}</p>`;
    }

    return `
        <table class="expiration-table">
            <thead>
                <tr>
                    <th>브랜드</th>
                    <th>모델명</th>
                    <th>유형</th>
                    <th>착용 방식</th>
                    <th>S</th>
                    <th>C</th>
                    <th>AX</th>
                    <th>수량</th>
                    <th>유통기한</th>
                </tr>
            </thead>
            <tbody>
                ${expiringProducts.map(product => `
                    <tr>
                        <td>${product.brand}</td>
                        <td>${product.model}</td>
                        <td>${product.lensType}</td>
                        <td>${product.wearType || 'N/A'}</td>
                        <td>${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}</td>
                        <td>${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}</td>
                        <td>${product.powerAX !== null ? product.powerAX : 'N/A'}</td>
                        <td>${product.quantity}</td>
                        <td>${product.expirationDate}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
  }

  /**
   * Renders the product list component, including brand filters and expiration warnings.
   * @private
   */
  _render() {
    const uniqueBrands = ProductService.getUniqueBrands();
    const expiringProducts = ProductService.getExpiringProducts();

    this.shadowRoot.innerHTML = `
      <style>${PRODUCT_LIST_STYLES}</style>
      <div class="brand-filter-buttons">
        ${this._generateBrandFilterButtonsHtml(uniqueBrands)}
      </div>
      <div class="expiration-warning-section">
          <h3>유통 기한 임박 제품</h3>
          ${this._generateExpirationTableHtml(expiringProducts)}
      </div>
    `;
    this.shadowRoot.querySelectorAll('.brand-filter-button').forEach(btn => btn.addEventListener('click', this._filterByBrand));
  }
}
customElements.define('product-list', ProductList);