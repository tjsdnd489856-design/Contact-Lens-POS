import { ProductService } from '../services/product.service.js';
import { parseUdiBarcode } from '../utils/udi-parser.js';

// --- Constants ---
const MESSAGES = {
    ENTER_UDI: 'UDI 바코드를 입력해주세요.',
    INVALID_GTIN: '유효한 GTIN (UDI-DI)을 UDI 바코드에서 찾을 수 없습니다.',
    LOOKUP_IN_PROGRESS: '제품 정보를 조회 중입니다...',
    PRODUCT_NOT_FOUND: 'UDI-DI에 해당하는 제품 정보를 찾을 수 없습니다.',
    LOOKUP_ERROR: (msg) => `UDI 조회 중 오류 발생: ${msg}`,
    ADD_PRODUCT_SUCCESS: '제품이 재고에 추가되었습니다!',
};

const UDI_SCANNER_MODAL_STYLES = `
    .udi-scanner-container {
        padding: 20px;
        text-align: center;
    }
    h3 {
        margin-top: 0;
        color: #333;
        margin-bottom: 20px;
    }
    #udi-input-section {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
    }
    #udi-input {
        flex-grow: 1;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    #lookup-udi-btn {
        padding: 10px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    #lookup-udi-btn:hover {
        background-color: #0056b3;
    }
    #udi-product-details {
        text-align: left;
        border: 1px solid #eee;
        padding: 15px;
        border-radius: 8px;
        background-color: #f9f9f9;
        margin-bottom: 20px;
        display: none; /* Hidden by default */
    }
    #udi-product-details p {
        margin: 5px 0;
    }
    #udi-product-details strong {
        display: inline-block;
        width: 100px;
    }
    #udi-quantity, #udi-price {
        width: 100px;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
        text-align: center;
    }
    #udi-status-message {
        color: red;
        margin-top: 10px;
    }
    #add-udi-product-btn {
        padding: 10px 20px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
    }
    #add-udi-product-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
    #scanner-viewport { /* This is from html5-qrcode, kept for reference but hidden */
        width: 100%; height: 0px; overflow: hidden; 
    }
`;

export default class UdiScannerModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._productData = null; // Stores fetched product data for adding
        // Bind handlers
        this._handleLookupUdi = this._handleLookupUdi.bind(this);
        this._handleAddUdiProduct = this._handleAddUdiProduct.bind(this);
        this._handleUdiInputKeydown = this._handleUdiInputKeydown.bind(this);
        this._handleUdiInput = this._handleUdiInput.bind(this); // New binding
    }

    connectedCallback() {
        this._render();
        this._attachEventListeners();
        document.addEventListener('openUdiScannerModal', this._openUdiScannerModal.bind(this));
        document.addEventListener('closeUdiScannerModal', this._closeUdiScannerModal.bind(this));
    }

    disconnectedCallback() {
        this._detachEventListeners();
        document.removeEventListener('openUdiScannerModal', this._openUdiScannerModal);
        document.removeEventListener('closeUdiScannerModal', this._closeUdiScannerModal);
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>${UDI_SCANNER_MODAL_STYLES}</style>
            <div class="udi-scanner-container">
                <h3>UDI 바코드 스캔</h3>
                <div id="udi-input-section">
                    <input type="text" id="udi-input" placeholder="UDI 바코드를 스캔하거나 입력하세요" inputmode="latin" lang="en" pattern="[A-Za-z0-9]*">
                    <button id="lookup-udi-btn">제품 정보 조회</button>
                </div>
                <div id="udi-product-details">
                    <h4>조회된 제품 정보:</h4>
                    <p><strong>브랜드:</strong> <span id="udi-brand"></span></p>
                    <p><strong>모델명:</strong> <span id="udi-model"></span></p>
                    <p><strong>UDI-DI:</strong> <span id="udi-gtin"></span></p>
                    <p><strong>유통기한:</strong> <span id="udi-expiration-date"></span></p>
                    <p><strong>로트 번호:</strong> <span id="udi-lot-number"></span></p>
                    <p><strong>일련 번호:</strong> <span id="udi-serial-number"></span></p>
                    <p><strong>렌즈 타입:</strong> <span id="udi-lens-type"></span></p>
                    <p><strong>착용 주기:</strong> <span id="udi-wear-type"></span></p>
                    <p><strong>수량:</strong> <input type="number" id="udi-quantity" value="1" min="1"></p>
                    <p><strong>가격:</strong> <input type="number" id="udi-price" value="0.00" min="0"></p>
                </div>
                <p id="udi-status-message"></p>
                <button id="add-udi-product-btn" disabled>재고에 추가</button>
                <div id="scanner-viewport"></div>
            </div>
        `;
    }

    _attachEventListeners() {
        this.shadowRoot.querySelector('#lookup-udi-btn').addEventListener('click', this._handleLookupUdi);
        this.shadowRoot.querySelector('#add-udi-product-btn').addEventListener('click', this._handleAddUdiProduct);
        this.shadowRoot.querySelector('#udi-input').addEventListener('keydown', this._handleUdiInputKeydown);
        this.shadowRoot.querySelector('#udi-input').addEventListener('input', this._handleUdiInput); // New listener
    }

    _detachEventListeners() {
        this.shadowRoot.querySelector('#lookup-udi-btn').removeEventListener('click', this._handleLookupUdi);
        this.shadowRoot.querySelector('#add-udi-product-btn').removeEventListener('click', this._handleAddUdiProduct);
        this.shadowRoot.querySelector('#udi-input').removeEventListener('keydown', this._handleUdiInputKeydown);
        this.shadowRoot.querySelector('#udi-input').removeEventListener('input', this._handleUdiInput); // New listener
    }

    _handleUdiInput(e) {
        let input = e.target.value;
        input = input.replace(/[^A-Za-z0-9]/g, ''); // Remove non-alphanumeric
        e.target.value = input.toUpperCase();
    }

    _openUdiScannerModal() {
        this.shadowRoot.host.style.display = 'block';
        this._clearUdiProductDetails();
        const udiInput = this.shadowRoot.querySelector('#udi-input');
        if (udiInput) udiInput.focus();
    }

    _closeUdiScannerModal() {
        this.shadowRoot.host.style.display = 'none';
        this._clearUdiProductDetails();
    }

    _clearUdiProductDetails() {
        this._productData = null;
        this.shadowRoot.querySelector('#udi-input').value = '';
        this.shadowRoot.querySelector('#udi-brand').textContent = '';
        this.shadowRoot.querySelector('#udi-model').textContent = '';
        this.shadowRoot.querySelector('#udi-gtin').textContent = '';
        this.shadowRoot.querySelector('#udi-expiration-date').textContent = '';
        this.shadowRoot.querySelector('#udi-lot-number').textContent = '';
        this.shadowRoot.querySelector('#udi-serial-number').textContent = '';
        this.shadowRoot.querySelector('#udi-lens-type').textContent = '';
        this.shadowRoot.querySelector('#udi-wear-type').textContent = '';
        this.shadowRoot.querySelector('#udi-quantity').value = '1';
        this.shadowRoot.querySelector('#udi-price').value = '0.00';
        this.shadowRoot.querySelector('#udi-status-message').textContent = '';
        this.shadowRoot.querySelector('#udi-product-details').style.display = 'none';
        this.shadowRoot.querySelector('#add-udi-product-btn').disabled = true;
    }

    _showProductDetails(product) {
        this._productData = product; // Store the product data
        this.shadowRoot.querySelector('#udi-brand').textContent = product.brand || 'N/A';
        this.shadowRoot.querySelector('#udi-model').textContent = product.model || 'N/A';
        this.shadowRoot.querySelector('#udi-gtin').textContent = product.udiDi || 'N/A';
        this.shadowRoot.querySelector('#udi-expiration-date').textContent = product.expirationDate || 'N/A';
        this.shadowRoot.querySelector('#udi-lot-number').textContent = product.lotNumber || 'N/A';
        this.shadowRoot.querySelector('#udi-serial-number').textContent = product.serialNumber || 'N/A';
        this.shadowRoot.querySelector('#udi-lens-type').textContent = product.lensType || 'N/A';
        this.shadowRoot.querySelector('#udi-wear-type').textContent = product.wearType || 'N/A';
        this.shadowRoot.querySelector('#udi-quantity').value = product.quantity || 1;
        this.shadowRoot.querySelector('#udi-price').value = product.price || 0.00;
        this.shadowRoot.querySelector('#udi-status-message').textContent = '';
        this.shadowRoot.querySelector('#udi-product-details').style.display = 'block';
        this.shadowRoot.querySelector('#add-udi-product-btn').disabled = false;
    }

    _handleUdiInputKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this._handleLookupUdi();
        }
    }

    async _handleLookupUdi() {
        const udiInput = this.shadowRoot.querySelector('#udi-input');
        const udiStatusMessage = this.shadowRoot.querySelector('#udi-status-message');
        const addUdiProductBtn = this.shadowRoot.querySelector('#add-udi-product-btn');

        udiStatusMessage.textContent = '';
        addUdiProductBtn.disabled = true;
        this._clearUdiProductDetails(); // Clear previous details before new lookup

        const udiString = udiInput.value.trim();
        if (!udiString) {
            udiStatusMessage.textContent = MESSAGES.ENTER_UDI;
            return;
        }

        try {
            const parsedUdi = parseUdiBarcode(udiString);
            console.log('Parsed UDI:', parsedUdi);

            const gtin = parsedUdi.gtin;
            if (!gtin) {
                udiStatusMessage.textContent = MESSAGES.INVALID_GTIN;
                return;
            }

            udiStatusMessage.textContent = MESSAGES.LOOKUP_IN_PROGRESS;
            const externalProduct = await ProductService.fetchProductDetailsFromExternalApi(gtin);
            console.log('External Product:', externalProduct);

            if (externalProduct && externalProduct.productFound) {
                // Combine parsed UDI data with external product data, prioritizing parsed UDI for specific fields
                const productToDisplay = {
                    ...externalProduct,
                    gtin: gtin, // Ensure GTIN is passed through
                    udiDi: gtin, // Assuming udiDi is GTIN from UDI-DI
                    // Override with parsed UDI data if available
                    expirationDate: parsedUdi.expirationDate || externalProduct.expirationDate,
                    lotNumber: parsedUdi.lotNumber || externalProduct.lotNumber,
                    serialNumber: parsedUdi.serialNumber || externalProduct.serialNumber,
                };
                this._showProductDetails(productToDisplay);
            } else {
                udiStatusMessage.textContent = externalProduct?.message || MESSAGES.PRODUCT_NOT_FOUND;
                this.shadowRoot.querySelector('#udi-product-details').style.display = 'none';
            }
        } catch (error) {
            console.error('UDI 조회 중 오류 발생:', error);
            udiStatusMessage.textContent = MESSAGES.LOOKUP_ERROR(error.message);
        }
    }

    _handleAddUdiProduct() {
        if (!this._productData) {
            alert(MESSAGES.PRODUCT_NOT_FOUND);
            return;
        }

        const udiQuantityInput = this.shadowRoot.querySelector('#udi-quantity');
        const udiPriceInput = this.shadowRoot.querySelector('#udi-price');

        const newProduct = {
            ...this._productData, // Start with fetched data
            quantity: parseInt(udiQuantityInput.value, 10),
            price: parseFloat(udiPriceInput.value),
        };

        // Add to local inventory
        ProductService.addProduct(newProduct);
        alert(MESSAGES.ADD_PRODUCT_SUCCESS);
        
        // Close modal and clear details
        document.dispatchEvent(new CustomEvent('closeUdiScannerModal'));
    }
}

customElements.define('udi-scanner-modal', UdiScannerModal);