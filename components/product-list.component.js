import { ProductService } from '../services/product.service.js';

// --- Constants ---
const MESSAGES = {
  NO_EXPIRING_PRODUCTS: '유통기한이 임박한 제품이 없습니다.',
};

const PRODUCT_LIST_STYLES = `
    :host {
        display: block;
        --header-height: 40px; /* Default header height for expiration table */
        --row-height: 36px;    /* Default row height for expiration table body */
    }
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
        table-layout: fixed; /* 헤더와 바디의 열 너비를 고정 */
    }
    .expiration-table thead {
        position: sticky;
        top: 0;
        z-index: 1;
        background-color: #f2f2f2;
        height: var(--header-height); /* Apply header height variable */
    }
    .expiration-table tbody {
        display: block; /* 스크롤 가능하게 함 */
        max-height: calc(var(--header-height) + 5 * var(--row-height)); /* 1 header + 5 body rows = 6 visible rows */
        overflow-y: auto; /* 세로 스크롤 활성화 */
        width: 100%;
    }
    /* 스크롤바 숨기기 (선택 사항) */
    .expiration-table tbody::-webkit-scrollbar {
        display: none; /* Webkit 기반 브라우저 */
    }
    .expiration-table tbody {
        -ms-overflow-style: none; /* Internet Explorer 10+ */
        scrollbar-width: none; /* Firefox */
    }
    .expiration-table tr { /* tbody 내부의 tr 요소에 적용 */
        display: table; /* 테이블 행처럼 동작하게 함 */
        width: 100%; /* tr이 tbody의 전체 너비를 차지하도록 하여 스크롤바 공간을 고려 */
        table-layout: fixed; /* 열 너비를 고정하여 헤더와 정렬 유지 */
        height: var(--row-height); /* Apply row height variable */
    }
    .expiration-table th, .expiration-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: center;
        box-sizing: border-box; /* 패딩과 테두리를 너비에 포함 */
    }
    .expiration-table th {
        background-color: #f2f2f2;
        cursor: pointer;
    }
    .expiration-table th.active {
        background-color: #007bff;
        color: white;
    }
    .expiration-table tbody tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    .expiration-table tbody tr:hover {
        background-color: #e0e0e0;
    }
    /* 상세 팝업 스타일 */
    .detail-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 1px solid #ccc;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        padding: 20px;
        width: 80%;
        max-width: 500px;
        border-radius: 8px;
    }
    .detail-popup h4 {
        margin-top: 0;
        color: #333;
        text-align: center;
        margin-bottom: 15px;
    }
    .detail-popup .detail-table { /* New style for popup table */
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        table-layout: fixed;
    }
    .detail-popup .detail-table th, .detail-popup .detail-table td {
        border: 1px solid #eee;
        padding: 8px;
        text-align: center;
        box-sizing: border-box;
    }
    .detail-popup .detail-table th {
        background-color: #f9f9f9;
        cursor: pointer;
    }
    .detail-popup .detail-table th.active {
        background-color: #007bff;
        color: white;
    }
    .detail-popup .detail-table tbody tr:nth-child(even) {
        background-color: #fcfcfc;
    }
    .detail-popup .detail-table tbody tr:hover {
        background-color: #f0f0f0;
    }
    .detail-popup button {
        display: block;
        margin: 15px auto 0;
        padding: 8px 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
`;

// --- ProductList Component ---
export default class ProductList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._currentFilterBrand = null; // Default filter, no brand selected initially
    this._allExpiringProducts = []; // 원본 모든 유통 기한 임박 제품 데이터
    this._groupedExpiringProducts = new Map(); // 모델명으로 그룹화된 유통 기한 임박 제품 데이터
    this._sortExpiringBy = null; // 'brand', 'model', 'expirationDate' 등
    this._sortExpiringOrder = 'asc'; // 'asc' 또는 'desc'
    this._detailPopupVisible = false;
    this._currentDetailedExpiringProducts = [];
    this._detailPopupSortBy = null; // Sort key for detail popup table
    this._detailPopupSortOrder = 'asc'; // Sort order for detail popup table
    
    // Bind event handlers
    this._handleProductsUpdated = this._handleProductsUpdated.bind(this);
    this._filterByBrand = this._filterByBrand.bind(this);
    this._handleSortExpiring = this._handleSortExpiring.bind(this);
    this._handleExpiringRowDoubleClick = this._handleExpiringRowDoubleClick.bind(this);
    this._closeDetailExpiringPopup = this._closeDetailExpiringPopup.bind(this);
    this._handleDetailPopupSort = this._handleDetailPopupSort.bind(this);
  }
    
  connectedCallback() {
      this._groupExpiringProductsAndRender(); // Initial render for expiring products
      this._render(); // Initial render for general product list
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
    this._groupExpiringProductsAndRender(); // Re-group and re-render expiring products
    this._render(); // Re-render general product list
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
    // This method will be replaced by _generateGroupedExpirationTableHtml later
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
    // const expiringProducts = ProductService.getExpiringProducts(); // This will be handled by _groupExpiringProductsAndRender

    this.shadowRoot.innerHTML = `
      <style>${PRODUCT_LIST_STYLES}</style>
      <div class="brand-filter-buttons">
        ${this._generateBrandFilterButtonsHtml(uniqueBrands)}
      </div>
      <div class="expiration-warning-section">
          <h3>유통 기한 임박 제품</h3>
          ${this._generateGroupedExpirationTableHtml()} <!-- Use grouped table -->
          ${this._renderDetailExpiringPopup()} <!-- Render detail popup -->
      </div>
    `;
    this.shadowRoot.querySelectorAll('.brand-filter-button').forEach(btn => btn.addEventListener('click', this._filterByBrand));
    this._attachExpiringEventListeners(); // Attach new event listeners
  }

  // --- New methods for Expiring Products Table ---

  /**
   * Groups expiring products by model name and then renders the table.
   * @private
   */
  _groupExpiringProductsAndRender() {
    this._groupedExpiringProducts.clear();
    const expiringProducts = ProductService.getExpiringProducts(); // Get fresh data
    this._allExpiringProducts = expiringProducts; // Keep a copy of all expiring products

    this._allExpiringProducts.forEach(product => {
        if (!this._groupedExpiringProducts.has(product.model)) {
            this._groupedExpiringProducts.set(product.model, []);
        }
        this._groupedExpiringProducts.get(product.model).push(product);
    });
    this._render();
  }

  /**
   * Sorts the expiring products based on the current _sortExpiringBy and _sortExpiringOrder.
   * @param {Array<Object>} products - The list of products to sort.
   * @returns {Array<Object>} Sorted products.
   * @private
   */
  _sortExpiringProducts(products) {
    if (!this._sortExpiringBy) {
        // Default sort by expirationDate if no specific sort is set
        return [...products].sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
    }

    return [...products].sort((a, b) => {
        let valA = a[this._sortExpiringBy];
        let valB = b[this._sortExpiringBy];

        // Handle date comparison for expirationDate
        if (this._sortExpiringBy === 'expirationDate') {
            valA = new Date(valA);
            valB = new Date(valB);
        }

        if (valA < valB) {
            return this._sortExpiringOrder === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return this._sortExpiringOrder === 'asc' ? 1 : -1;
        }
        return 0;
    });
  }

  /**
   * Handles sorting when a sortable column header is clicked for expiring products.
   * @param {string} sortBy - The key to sort by ('brand', 'model', 'expirationDate', etc.).
   * @private
   */
  _handleSortExpiring(sortBy) {
    if (this._sortExpiringBy === sortBy) {
        this._sortExpiringOrder = (this._sortExpiringOrder === 'asc' ? 'desc' : 'asc');
    } else {
        this._sortExpiringBy = sortBy;
        this._sortExpiringOrder = 'asc';
    }
    this._groupExpiringProductsAndRender(); // Re-group and re-render after sort order changes
  }

  /**
   * Generates the HTML table for displaying grouped expiring products.
   * @returns {string} The HTML string for the expiration table or a message.
   * @private
   */
  _generateGroupedExpirationTableHtml() {
    if (this._groupedExpiringProducts.size === 0) {
        return `<p class="message">${MESSAGES.NO_EXPIRING_PRODUCTS}</p>`;
    }

    // Sort the grouped products by model name for consistent display, then by expirationDate for summary
    const sortedModels = Array.from(this._groupedExpiringProducts.keys()).sort();
    const tableRows = sortedModels.map(modelName => {
        const productsInGroup = this._groupedExpiringProducts.get(modelName);
        // Find the product with the earliest expiration date to display as summary
        const earliestExpiringProduct = this._sortExpiringProducts(productsInGroup)[0]; // Apply sort
        const totalQuantity = productsInGroup.reduce((sum, p) => sum + p.quantity, 0);

        return `
            <tr data-model="${modelName}" class="grouped-expiring-product-row">
                <td>${earliestExpiringProduct.brand}</td>
                <td>${earliestExpiringProduct.model}</td>
                <td>${earliestExpiringProduct.lensType}</td>
                <td>${earliestExpiringProduct.wearType || 'N/A'}</td>
                <td>${totalQuantity}</td>
                <td>${earliestExpiringProduct.expirationDate}</td>
            </tr>
        `;
    }).join('');

    return `
        <table class="expiration-table">
            <thead>
                <tr>
                    <th data-sort-by="brand">브랜드</th>
                    <th data-sort-by="model">모델명</th>
                    <th data-sort-by="lensType">유형</th>
                    <th data-sort-by="wearType">착용 방식</th>
                    <th data-sort-by="quantity">총 수량</th>
                    <th data-sort-by="expirationDate">유통기한</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
  }

  /**
   * Handles double-click on a grouped product row to show details.
   * @param {Event} event - The double-click event.
   * @private
   */
  _handleExpiringRowDoubleClick(event) {
      const row = event.currentTarget;
      const modelName = row.dataset.model;
      this._currentDetailedExpiringProducts = this._sortDetailedProductsForPopup(this._groupedExpiringProducts.get(modelName) || []);
      this._detailPopupVisible = true;
      this._render();
  }

  /**
   * Closes the detail popup.
   * @private
   */
  _closeDetailExpiringPopup() {
      this._detailPopupVisible = false;
      this._currentDetailedExpiringProducts = [];
      this._detailPopupSortBy = null; // Reset sort for popup
      this._detailPopupSortOrder = 'asc'; // Reset sort order for popup
      this._render();
  }

  /**
   * Sorts the detailed products for the popup based on _detailPopupSortBy and _detailPopupSortOrder.
   * @param {Array<Object>} products - The list of detailed products to sort.
   * @returns {Array<Object>} Sorted products.
   * @private
   */
  _sortDetailedProductsForPopup(products) {
    if (!this._detailPopupSortBy) {
        // Default sort by expirationDate if no specific sort is set
        return [...products].sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
    }

    return [...products].sort((a, b) => {
        let valA = a[this._detailPopupSortBy];
        let valB = b[this._detailPopupSortBy];

        // Handle date comparison for expirationDate
        if (this._detailPopupSortBy === 'expirationDate') {
            valA = new Date(valA);
            valB = new Date(valB);
        } else if (this._detailPopupSortBy === 'powerS' || this._detailPopupSortBy === 'powerC' || this._detailPopupSortBy === 'powerAX' || this._detailPopupSortBy === 'quantity') {
            // Ensure numeric comparison for power and quantity fields
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        }


        if (valA < valB) {
            return this._detailPopupSortOrder === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return this._detailPopupSortOrder === 'asc' ? 1 : -1;
        }
        return 0;
    });
  }

  /**
   * Handles sorting for the detail popup table.
   * @param {string} sortBy - The key to sort by.
   * @private
   */
  _handleDetailPopupSort(sortBy) {
      if (this._detailPopupSortBy === sortBy) {
          this._detailPopupSortOrder = (this._detailPopupSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          this._detailPopupSortBy = sortBy;
          this._detailPopupSortOrder = 'asc';
      }
      // Re-sort current detailed products and re-render
      this._currentDetailedExpiringProducts = this._sortDetailedProductsForPopup(this._currentDetailedExpiringProducts);
      this._render(); 
  }

  /**
   * Renders the detail popup HTML.
   * @private
   */
  _renderDetailExpiringPopup() {
      if (!this._detailPopupVisible) return '';
      
      const sortedDetailedProducts = this._sortDetailedProductsForPopup(this._currentDetailedExpiringProducts);

      const tableRows = sortedDetailedProducts.map(product => `
            <tr>
                <td>${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}</td>
                <td>${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}</td>
                <td>${product.powerAX !== null ? product.powerAX : 'N/A'}</td>
                <td>${product.quantity}</td>
                <td>${product.expirationDate}</td>
            </tr>
      `).join('');

      return `
          <div class="detail-popup">
              <h4>${this._currentDetailedExpiringProducts[0]?.model} 상세 정보</h4>
              <table class="detail-table">
                  <thead>
                      <tr>
                          <th data-sort-by="powerS">S</th>
                          <th data-sort-by="powerC">C</th>
                          <th data-sort-by="powerAX">AX</th>
                          <th data-sort-by="quantity">수량</th>
                          <th data-sort-by="expirationDate">유통기한</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${tableRows}
                  </tbody>
              </table>
              <button class="close-popup-btn">닫기</button>
          </div>
      `;
  }

  /**
   * Attaches event listeners to dynamically created elements for the expiring products table.
   * @private
   */
  _attachExpiringEventListeners() {
      const tableHeaders = this.shadowRoot.querySelectorAll('.expiration-table th[data-sort-by]');
      tableHeaders.forEach(header => {
          header.removeEventListener('click', this._handleSortExpiring); // Remove existing to prevent duplicates
          header.addEventListener('click', () => this._handleSortExpiring(header.dataset.sortBy));
      });

      const groupedRows = this.shadowRoot.querySelectorAll('.grouped-expiring-product-row');
      groupedRows.forEach(row => {
          row.removeEventListener('dblclick', this._handleExpiringRowDoubleClick); // Remove existing
          row.addEventListener('dblclick', this._handleExpiringRowDoubleClick);
      });

      const closeButton = this.shadowRoot.querySelector('.detail-popup .close-popup-btn');
      if (closeButton) {
          closeButton.removeEventListener('click', this._closeDetailExpiringPopup); // Remove existing
          closeButton.addEventListener('click', this._closeDetailExpiringPopup);
      }

      // Attach event listeners for detail popup table headers
      const detailTableHeaders = this.shadowRoot.querySelectorAll('.detail-popup .detail-table th[data-sort-by]');
      detailTableHeaders.forEach(header => {
          header.removeEventListener('click', this._handleDetailPopupSort); // Remove existing
          header.addEventListener('click', () => this._handleDetailPopupSort(header.dataset.sortBy));
      });
  }

}
customElements.define('product-list', ProductList);
