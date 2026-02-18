import { ProductService } from '../services/product.service.js';

// --- Constants ---
const MESSAGES = {
    NO_EXPIRING_PRODUCTS: '유통기한이 임박한 제품이 없습니다.',
};

const EXPIRATION_MODAL_STYLES = `
    :host {
        display: block;
        --header-height: 40px; /* Default header height for table */
        --row-height: 36px;    /* Default row height for table body */
    }
    .expiration-container {
        padding: 20px;
    }
    h3 {
        margin-top: 0;
        color: #333;
        text-align: center;
        margin-bottom: 20px;
    }
    .message {
        text-align: center;
        padding: 20px;
        color: #555;
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
        text-align: center; /* Center align all text for this table */
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
    .detail-popup ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .detail-popup ul li {
        padding: 8px 0;
        border-bottom: 1px dashed #eee;
    }
    .detail-popup ul li:last-child {
        border-bottom: none;
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

export default class ExpirationWarningModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._allProducts = []; // 원본 모든 제품 데이터
        this._groupedProducts = new Map(); // 모델명으로 그룹화된 제품 데이터
        this._sortBy = null; // 'brand', 'model', 'expirationDate' 등
        this._sortOrder = 'asc'; // 'asc' 또는 'desc'
        this._detailPopupVisible = false;
        this._currentDetailedProducts = [];

        this._closeDetailPopup = this._closeDetailPopup.bind(this);
        this._handleSort = this._handleSort.bind(this);
    }

    /**
     * Set the raw product data and trigger grouping and rendering.
     * @param {Array<Object>} products - An array of product objects that are expiring soon.
     */
    setProducts(products) {
        this._allProducts = products;
        this._groupAndRenderProducts();
    }

    connectedCallback() {
        this._groupAndRenderProducts();
    }

    /**
     * Groups products by model name and then renders the table.
     * @private
     */
    _groupAndRenderProducts() {
        this._groupedProducts.clear();
        this._allProducts.forEach(product => {
            if (!this._groupedProducts.has(product.model)) {
                this._groupedProducts.set(product.model, []);
            }
            this._groupedProducts.get(product.model).push(product);
        });
        this._render();
    }

    /**
     * Sorts the products based on the current _sortBy and _sortOrder.
     * This will need to sort the grouped keys or apply secondary sort within groups.
     * For now, it will sort the _allProducts (will need adjustment for grouped view).
     * @param {Array<Object>} products - The list of products to sort.
     * @returns {Array<Object>} Sorted products.
     * @private
     */
    _sortProducts(products) {
        if (!this._sortBy) {
            // Default sort by expirationDate if no specific sort is set
            return [...products].sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
        }

        return [...products].sort((a, b) => {
            let valA = a[this._sortBy];
            let valB = b[this._sortBy];

            // Handle date comparison for expirationDate
            if (this._sortBy === 'expirationDate') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) {
                return this._sortOrder === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return this._sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    /**
     * Handles sorting when a sortable column header is clicked.
     * @param {string} sortBy - The key to sort by ('brand', 'model', 'expirationDate', etc.).
     * @private
     */
    _handleSort(sortBy) {
        if (this._sortBy === sortBy) {
            this._sortOrder = (this._sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            this._sortBy = sortBy;
            this._sortOrder = 'asc';
        }
        // Re-group and re-render after sort order changes
        this._groupAndRenderProducts();
    }

    /**
     * Generates the HTML table for displaying grouped expiring products.
     * @returns {string} The HTML string for the table or a message.
     * @private
     */
    _generateGroupedTableHtml() {
        if (this._groupedProducts.size === 0) {
            return `<p class="message">${MESSAGES.NO_EXPIRING_PRODUCTS}</p>`;
        }

        // Sort the grouped products by model name for consistent display, then by expirationDate for summary
        const sortedModels = Array.from(this._groupedProducts.keys()).sort();
        const tableRows = sortedModels.map(modelName => {
            const productsInGroup = this._groupedProducts.get(modelName);
            // Find the product with the earliest expiration date to display as summary
            const earliestExpiringProduct = productsInGroup.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate))[0];
            const totalQuantity = productsInGroup.reduce((sum, p) => sum + p.quantity, 0);

            return `
                <tr data-model="${modelName}" class="grouped-product-row">
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
    _handleRowDoubleClick(event) {
        const row = event.currentTarget;
        const modelName = row.dataset.model;
        this._currentDetailedProducts = this._sortProducts(this._groupedProducts.get(modelName) || []);
        this._detailPopupVisible = true;
        this._render();
    }

    /**
     * Closes the detail popup.
     * @private
     */
    _closeDetailPopup() {
        this._detailPopupVisible = false;
        this._currentDetailedProducts = [];
        this._render();
    }

    /**
     * Renders the detail popup HTML.
     * @private
     */
    _renderDetailPopup() {
        if (!this._detailPopupVisible) return '';

        const detailListItems = this._currentDetailedProducts.map(product => `
            <li>
                <strong>도수:</strong> S ${product.powerS !== null ? product.powerS.toFixed(2) : 'N/A'},
                         C ${product.powerC !== null ? product.powerC.toFixed(2) : 'N/A'},
                         AX ${product.powerAX !== null ? product.powerAX : 'N/A'}<br>
                <strong>수량:</strong> ${product.quantity}<br>
                <strong>유통기한:</strong> ${product.expirationDate}
            </li>
        `).join('');

        return `
            <div class="detail-popup">
                <h4>${this._currentDetailedProducts[0]?.model} 상세 정보</h4>
                <ul>${detailListItems}</ul>
                <button class="close-popup-btn">닫기</button>
            </div>
        `;
    }

    /**
     * Renders the component's HTML structure.
     * @private
     */
    _render() {
        this.shadowRoot.innerHTML = `
            <style>${EXPIRATION_MODAL_STYLES}</style>
            <div class="expiration-container">
                <h3>유통 기한 임박 제품</h3>
                ${this._generateGroupedTableHtml()}
                ${this._renderDetailPopup()}
            </div>
        `;
        this._attachEventListeners();
    }

    /**
     * Attaches event listeners to dynamically created elements.
     * @private
     */
    _attachEventListeners() {
        const tableHeaders = this.shadowRoot.querySelectorAll('.expiration-table th[data-sort-by]');
        tableHeaders.forEach(header => {
            header.removeEventListener('click', this._handleSort); // Remove existing to prevent duplicates
            header.addEventListener('click', () => this._handleSort(header.dataset.sortBy));
        });

        const groupedRows = this.shadowRoot.querySelectorAll('.grouped-product-row');
        groupedRows.forEach(row => {
            row.removeEventListener('dblclick', this._handleRowDoubleClick); // Remove existing
            row.addEventListener('dblclick', this._handleRowDoubleClick);
        });

        const closeButton = this.shadowRoot.querySelector('.detail-popup .close-popup-btn');
        if (closeButton) {
            closeButton.removeEventListener('click', this._closeDetailPopup); // Remove existing
            closeButton.addEventListener('click', this._closeDetailPopup);
        }
    }
}

customElements.define('expiration-warning-modal', ExpirationWarningModal);