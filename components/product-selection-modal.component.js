import { ProductService } from '../services/product.service.js';

/**
 * Utility to group products by brand and model.
 * This helps in the multi-step selection process.
 */
function groupProducts(products) {
    const brands = {};
    products.forEach(p => {
        if (!brands[p.brand]) brands[p.brand] = {};
        if (!brands[p.brand][p.model]) brands[p.brand][p.model] = [];
        brands[p.brand][p.model].push(p);
    });
    return brands;
}

const MODAL_STYLES = `
    :host {
        display: block;
        --row-height: 48px; /* 도수 테이블 행 높이 고정 */
    }
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .modal-overlay.open {
        opacity: 1;
        visibility: visible;
    }
    .modal-content {
        background: white;
        padding: 24px;
        border-radius: 12px;
        width: 95%;
        max-width: 900px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 16px;
        margin-bottom: 20px;
    }
    .modal-header h3 {
        margin: 0;
        font-size: 1.4rem;
        color: #1a1a1a;
    }
    .close-button {
        background: #f0f0f0;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #666;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }
    .close-button:hover {
        background: #e0e0e0;
        color: #333;
    }
    .modal-body {
        flex-grow: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }
    
    /* Step 1: Brand Grid */
    .brand-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 16px;
        margin-top: 12px;
    }
    .brand-card {
        background: #fff;
        border: 1px solid #e0e0e0;
        padding: 24px 16px;
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .brand-card:hover {
        border-color: #007bff;
        color: #007bff;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,123,255,0.1);
    }

    /* Step 2: Product List */
    .product-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
    }
    .product-card {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        padding: 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .product-card:hover {
        background: #fff;
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .product-card .model-name {
        display: block;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 4px;
    }
    .product-card .brand-name {
        font-size: 0.85rem;
        color: #6c757d;
    }

    /* Step 3: Power Option Table */
    .table-wrapper {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    .power-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }
    .power-table thead {
        background: #f8f9fa;
        border-bottom: 2px solid #dee2e6;
    }
    .power-table th, .power-table td {
        padding: 0 12px;
        height: var(--row-height);
        text-align: center;
        border-right: 1px solid #eee;
        box-sizing: border-box;
    }
    .power-table th {
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        user-select: none;
        position: relative;
    }
    .power-table th:hover {
        background: #e9ecef;
    }
    .power-table th.sort-active {
        color: #007bff;
        background: #e7f1ff;
    }
    .power-table tbody {
        display: block;
        height: calc(var(--row-height) * 10);
        overflow-y: scroll;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .power-table tbody::-webkit-scrollbar {
        display: none;
    }
    .power-table thead, .power-table tbody tr {
        display: table;
        width: 100%;
        table-layout: fixed;
    }
    .power-table tbody tr {
        border-bottom: 1px solid #eee;
        cursor: pointer;
    }
    .power-table tbody tr:hover {
        background: #f1f3f5;
    }
    .power-table tbody tr.selected {
        background: #e7f1ff;
        border-left: 4px solid #007bff;
    }
    .power-table td input {
        width: 60px;
        padding: 4px 8px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        text-align: center;
    }

    .back-nav {
        margin-bottom: 16px;
    }
    .btn-back {
        background: none;
        border: none;
        color: #007bff;
        cursor: pointer;
        font-weight: 600;
        padding: 0;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .btn-back:hover {
        text-decoration: underline;
    }

    .modal-actions {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }
    .btn-primary {
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
    }
    .btn-primary:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
`;

export default class ProductSelectionModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this._groupedData = {};
        this._currentStep = 1; // 1: Brand, 2: Product, 3: Power
        this._selectedBrand = null;
        this._selectedModel = null;
        this._selectedProduct = null;
        this._selectedQuantity = 0;

        this._sortBy = 'powerS';
        this._sortOrder = 'asc';

        // Bindings
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this._handleProductsUpdated = this._handleProductsUpdated.bind(this);
    }

    connectedCallback() {
        this._render();
        document.addEventListener('productsUpdated', this._handleProductsUpdated);
    }

    disconnectedCallback() {
        document.removeEventListener('productsUpdated', this._handleProductsUpdated);
    }

    _handleProductsUpdated() {
        if (this.isOpen) {
            this._groupedData = groupProducts(ProductService.getProducts());
            this._render();
        }
    }

    openModal() {
        this.isOpen = true;
        this._currentStep = 1;
        this._selectedBrand = null;
        this._selectedModel = null;
        this._selectedProduct = null;
        this._selectedQuantity = 0;
        this._groupedData = groupProducts(ProductService.getProducts());
        this._render();
    }

    closeModal() {
        this.isOpen = false;
        this._render();
        document.dispatchEvent(new CustomEvent('closeProductSelectionModal'));
    }

    /**
     * "카트에 추가" 버튼의 활성화 상태만 수동으로 업데이트합니다.
     */
    _updateAddToCartButtonState() {
        const btn = this.shadowRoot.querySelector('#add-to-cart');
        if (btn) {
            btn.disabled = !this._selectedProduct || this._selectedQuantity <= 0;
        }
    }

    /**
     * 선택된 행의 시각적 피드백과 수량 입력을 수동으로 조절합니다.
     * 전체 렌더링을 피하여 스크롤과 포커스를 유지합니다.
     */
    _updateRowSelectionVisual(selectedId) {
        const root = this.shadowRoot;
        const rows = root.querySelectorAll('.power-table tbody tr');
        
        rows.forEach(tr => {
            const trId = tr.dataset.id;
            const input = tr.querySelector('.qty-input');
            
            if (trId === selectedId) {
                tr.classList.add('selected');
                // 다른 행을 클릭해서 선택된 경우, 기본 수량을 1로 설정
                if (this._selectedQuantity === 0) {
                    this._selectedQuantity = 1;
                    if (input) input.value = 1;
                }
            } else {
                tr.classList.remove('selected');
                // 선택되지 않은 행의 수량 입력창은 0으로 표시 (일관성)
                if (input) input.value = 0;
            }
        });
        
        this._updateAddToCartButtonState();
    }

    _handleSort(field) {
        if (this._sortBy === field) {
            this._sortOrder = this._sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this._sortBy = field;
            this._sortOrder = 'asc';
        }
        this._render();
    }

    _handleAddToCart() {
        if (!this._selectedProduct) return;
        if (this._selectedQuantity <= 0) {
            alert('수량을 1개 이상 입력해주세요.');
            return;
        }

        document.dispatchEvent(new CustomEvent('productSelectedForSale', {
            detail: {
                product: this._selectedProduct,
                quantity: this._selectedQuantity
            }
        }));
        this.closeModal();
    }

    _renderBrandStep() {
        const brands = Object.keys(this._groupedData).sort();
        return `
            <div class="brand-grid">
                ${brands.map(brand => `
                    <div class="brand-card" data-brand="${brand}">${brand}</div>
                `).join('')}
            </div>
        `;
    }

    _renderProductStep() {
        if (!this._selectedBrand || !this._groupedData[this._selectedBrand]) return '';
        const models = Object.keys(this._groupedData[this._selectedBrand]).sort();
        return `
            <div class="back-nav">
                <button class="btn-back" id="back-to-brands">← 브랜드 다시 선택</button>
            </div>
            <div class="product-list">
                ${models.map(model => `
                    <div class="product-card" data-model="${model}">
                        <span class="model-name">${model}</span>
                        <span class="brand-name">${this._selectedBrand}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    _renderPowerStep() {
        if (!this._selectedBrand || !this._selectedModel || !this._groupedData[this._selectedBrand][this._selectedModel]) return '';
        let options = this._groupedData[this._selectedBrand][this._selectedModel];
        
        options.sort((a, b) => {
            const valA = a[this._sortBy] ?? 0;
            const valB = b[this._sortBy] ?? 0;
            return this._sortOrder === 'asc' ? valA - valB : valB - valA;
        });

        const sortIcon = (field) => {
            if (this._sortBy !== field) return '';
            return this._sortOrder === 'asc' ? ' ▲' : ' ▼';
        };

        return `
            <div class="back-nav">
                <button class="btn-back" id="back-to-products">← 제품 다시 선택</button>
            </div>
            <div class="table-wrapper">
                <table class="power-table">
                    <thead>
                        <tr>
                            <th data-sort="powerS" class="${this._sortBy === 'powerS' ? 'sort-active' : ''}">S${sortIcon('powerS')}</th>
                            <th data-sort="powerC" class="${this._sortBy === 'powerC' ? 'sort-active' : ''}">C${sortIcon('powerC')}</th>
                            <th data-sort="powerAX" class="${this._sortBy === 'powerAX' ? 'sort-active' : ''}">AX${sortIcon('powerAX')}</th>
                            <th data-sort="quantity" class="${this._sortBy === 'quantity' ? 'sort-active' : ''}">재고${sortIcon('quantity')}</th>
                            <th>수량</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${options.map(opt => `
                            <tr class="${this._selectedProduct?.id === opt.id ? 'selected' : ''}" data-id="${opt.id}">
                                <td>${opt.powerS > 0 ? '+' : ''}${opt.powerS.toFixed(2)}</td>
                                <td>${opt.powerC > 0 ? '+' : ''}${opt.powerC.toFixed(2)}</td>
                                <td>${opt.powerAX || '0'}</td>
                                <td>${opt.quantity}</td>
                                <td onclick="event.stopPropagation()">
                                    <input type="number" value="${this._selectedProduct?.id === opt.id ? this._selectedQuantity : 0}" 
                                           min="0" max="${opt.quantity}" class="qty-input" data-id="${opt.id}">
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    _render() {
        let content = '';
        let title = '제품 선택';

        if (this._currentStep === 1) {
            content = this._renderBrandStep();
            title = '제품 선택 - 브랜드';
        } else if (this._currentStep === 2) {
            content = this._renderProductStep();
            title = `제품 선택 - ${this._selectedBrand}`;
        } else if (this._currentStep === 3) {
            content = this._renderPowerStep();
            title = `제품 선택 - ${this._selectedModel}`;
        }

        this.shadowRoot.innerHTML = `
            <style>${MODAL_STYLES}</style>
            <div class="modal-overlay ${this.isOpen ? 'open' : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary" id="add-to-cart" ${!this._selectedProduct || this._selectedQuantity <= 0 ? 'disabled' : ''}>카트에 추가</button>
                    </div>
                </div>
            </div>
        `;

        this._attachEvents();
    }

    _attachEvents() {
        const root = this.shadowRoot;
        
        root.querySelector('.close-button').onclick = this.closeModal;
        root.querySelector('.modal-overlay').onclick = (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        };

        if (this._currentStep === 1) {
            root.querySelectorAll('.brand-card').forEach(card => {
                card.onclick = () => {
                    this._selectedBrand = card.dataset.brand;
                    this._currentStep = 2;
                    this._render();
                };
            });
        } else if (this._currentStep === 2) {
            const backBtn = root.querySelector('#back-to-brands');
            if (backBtn) backBtn.onclick = () => {
                this._currentStep = 1;
                this._selectedBrand = null;
                this._render();
            };
            root.querySelectorAll('.product-card').forEach(card => {
                card.onclick = () => {
                    this._selectedModel = card.dataset.model;
                    this._currentStep = 3;
                    this._render();
                };
            });
        } else if (this._currentStep === 3) {
            const backBtn = root.querySelector('#back-to-products');
            if (backBtn) backBtn.onclick = () => {
                this._currentStep = 2;
                this._selectedModel = null;
                this._selectedProduct = null;
                this._selectedQuantity = 0;
                this._render();
            };
            root.querySelectorAll('.power-table th[data-sort]').forEach(th => {
                th.onclick = () => this._handleSort(th.dataset.sort);
            });
            root.querySelectorAll('.power-table tbody tr').forEach(tr => {
                tr.onclick = () => {
                    const id = tr.dataset.id;
                    const products = this._groupedData[this._selectedBrand][this._selectedModel];
                    this._selectedProduct = products.find(p => p.id === id);
                    this._updateRowSelectionVisual(id);
                };
            });
            root.querySelectorAll('.qty-input').forEach(input => {
                input.oninput = (e) => {
                    const id = e.target.dataset.id;
                    const products = this._groupedData[this._selectedBrand][this._selectedModel];
                    this._selectedProduct = products.find(p => p.id === id);
                    this._selectedQuantity = parseInt(e.target.value, 10) || 0;
                    
                    // 입력 시 즉시 행 선택 상태 업데이트 (리렌더링 없이)
                    this._updateRowSelectionVisual(id);
                };
                input.onchange = (e) => {
                    // onchange 시 리렌더링을 하지 않음으로써 포커스와 스크롤 유지
                    this._selectedQuantity = parseInt(e.target.value, 10) || 0;
                    this._updateAddToCartButtonState();
                };
            });
        }

        const addToCartBtn = root.querySelector('#add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.onclick = this._handleAddToCart.bind(this);
        }
    }
}

customElements.define('product-selection-modal', ProductSelectionModal);
