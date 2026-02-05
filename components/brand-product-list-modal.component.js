import { ProductService } from '../services/product.service.js';

export default class BrandProductListModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._currentBrand = null;
    }

    setBrand(brand) {
        this._currentBrand = brand;
        this._render();
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._selectedBrand = null;
        this._selectedLensType = null;
        this._selectedModel = null;
        this._currentView = 'brands'; // 'brands', 'lensTypes', 'models', 'details'

        this._goBack = this._goBack.bind(this);
    }

    setBrand(brand) {
        if (brand === null) {
            this._selectedBrand = null;
            this._selectedLensType = null;
            this._selectedModel = null;
            this._currentView = 'brands';
        } else {
            this._selectedBrand = brand;
            this._selectedLensType = null;
            this._selectedModel = null;
            this._currentView = 'lensTypes'; // Start directly at lens types for a selected brand
        }
        this._render();
    }

    _getProductsData() {
        let products = ProductService.getProducts();
        if (this._currentBrand === 'brands' && this._selectedBrand) {
            products = products.filter(p => p.brand === this._selectedBrand);
        } else if (this._selectedBrand) {
            products = products.filter(p => p.brand === this._selectedBrand);
            if (this._selectedLensType) {
                products = products.filter(p => p.lensType === this._selectedLensType);
                if (this._selectedModel) {
                    products = products.filter(p => p.model === this._selectedModel);
                }
            }
        }
        return products;
    }

    _getUniqueBrands() {
        const products = ProductService.getProducts();
        const brands = new Set(products.map(p => p.brand));
        return Array.from(brands);
    }

    _getUniqueLensTypes() {
        const products = this._getProductsData();
        const lensTypes = new Set(products.map(p => p.lensType || 'N/A'));
        return Array.from(lensTypes);
    }

    _getUniqueModels() {
        const products = this._getProductsData();
        const models = new Set(products.map(p => p.model));
        return Array.from(models);
    }

    _getDetailedProducts() {
        return this._getProductsData();
    }

    _selectBrand(brand) {
        this._selectedBrand = brand;
        this._selectedLensType = null;
        this._selectedModel = null;
        this._currentView = 'lensTypes';
        this._render();
    }

    _selectLensType(lensType) {
        this._selectedLensType = lensType;
        this._selectedModel = null;
        this._currentView = 'models';
        this._render();
    }

    _selectModel(model) {
        this._selectedModel = model;
        this._currentView = 'details';
        this._render();
    }

    _goBack() {
        if (this._currentView === 'details') {
            this._selectedModel = null;
            this._currentView = 'models';
        } else if (this._currentView === 'models') {
            this._selectedLensType = null;
            this._currentView = 'lensTypes';
        } else if (this._currentView === 'lensTypes') {
            this._selectedBrand = null;
            this._currentView = 'brands';
        }
        this._render();
    }

    _renderBrands() {
        const brands = this._getUniqueBrands();
        if (brands.length === 0) {
            return '<p class="message">등록된 브랜드가 없습니다.</p>';
        }
        return `
            <ul class="selection-list">
                ${brands.map(brand => `
                    <li data-value="${brand}" class="list-item brand-item">${brand}</li>
                `).join('')}
            </ul>
        `;
    }

    _renderLensTypes() {
        const lensTypes = this._getUniqueLensTypes();
        if (lensTypes.length === 0) {
            return '<p class="message">해당 브랜드의 렌즈 유형이 없습니다.</p>';
        }
        return `
            <ul class="selection-list">
                ${lensTypes.map(lensType => `
                    <li data-value="${lensType}" class="list-item lensType-item">${lensType}</li>
                `).join('')}
            </ul>
        `;
    }

    _renderModels() {
        const models = this._getUniqueModels();
        if (models.length === 0) {
            return '<p class="message">해당 유형의 제품 모델이 없습니다.</p>';
        }
        return `
            <ul class="selection-list">
                ${models.map(model => `
                    <li data-value="${model}" class="list-item model-item">${model}</li>
                `).join('')}
            </ul>
        `;
    }

    _renderDetails() {
        const products = this._getDetailedProducts();
        if (products.length === 0) {
            return '<p class="message">선택된 제품의 세부 정보가 없습니다.</p>';
        }

        const tableBodyHtml = products.map(product => `
            <tr>
                <td>
                    S:${(product.powerS !== null && product.powerS !== undefined) ? (product.powerS > 0 ? '+' : '') + product.powerS.toFixed(2) : 'N/A'}
                    C:${(product.powerC !== null && product.powerC !== undefined) ? (product.powerC > 0 ? '+' : '') + product.powerC.toFixed(2) : 'N/A'}
                    ${product.powerAX !== null ? `AX:${product.powerAX}` : ''}
                </td>
                <td>${product.quantity}</td>
                <td>${product.expirationDate}</td>
            </tr>
        `).join('');

        return `
            <table class="details-table">
                <thead>
                    <tr>
                        <th>도수 (S/C/AX)</th>
                        <th>수량</th>
                        <th>유통기한</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableBodyHtml}
                </tbody>
            </table>
        `;
    }

    _render() {
        let contentHtml = '';
        let title = '제품 재고 조회';
        let showBackButton = false;

        if (this._currentView === 'brands') {
            title = '브랜드 선택';
            contentHtml = this._renderBrands();
            showBackButton = false;
        } else if (this._currentView === 'lensTypes') {
            title = `${this._selectedBrand} - 유형 선택`;
            contentHtml = this._renderLensTypes();
            showBackButton = true;
        } else if (this._currentView === 'models') {
            title = `${this._selectedBrand} - ${this._selectedLensType} - 모델 선택`;
            contentHtml = this._renderModels();
            showBackButton = true;
        } else if (this._currentView === 'details') {
            title = `${this._selectedBrand} - ${this._selectedLensType} - ${this._selectedModel} 세부 정보`;
            contentHtml = this._renderDetails();
            showBackButton = true;
        }

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                h3 {
                    margin-top: 0;
                    color: #333;
                    text-align: center;
                }
                .message {
                    text-align: center;
                    padding: 20px;
                    color: #555;
                }
                .selection-list {
                    list-style: none;
                    padding: 0;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 10px;
                }
                .list-item {
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    text-align: center;
                    transition: background-color 0.2s, border-color 0.2s;
                }
                .list-item:hover {
                    background-color: #e0e0e0;
                }
                .back-button {
                    background-color: #6c757d;
                    color: white;
                    padding: 8px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-bottom: 15px;
                    display: block;
                    width: fit-content;
                }
                .back-button:hover {
                    background-color: #5a6268;
                }
                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                .details-table th, .details-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .details-table th {
                    background-color: #f2f2f2;
                }
                .details-table tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
            </style>
            <div>
                ${showBackButton ? '<button class="back-button">뒤로가기</button>' : ''}
                <h3>${title}</h3>
                ${contentHtml}
            </div>
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Attach event listeners for selection and back button
        if (this._currentView === 'brands') {
            this.shadowRoot.querySelectorAll('.brand-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectBrand(e.target.dataset.value));
            });
        } else if (this._currentView === 'lensTypes') {
            this.shadowRoot.querySelectorAll('.lensType-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectLensType(e.target.dataset.value));
            });
        } else if (this._currentView === 'models') {
            this.shadowRoot.querySelectorAll('.model-item').forEach(item => {
                item.addEventListener('click', (e) => this._selectModel(e.target.dataset.value));
            });
        }

        if (showBackButton) {
            this.shadowRoot.querySelector('.back-button').addEventListener('click', this._goBack);
        }
    }
}

customElements.define('brand-product-list-modal', BrandProductListModal);