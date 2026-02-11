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
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 90%;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 15px;
    }
    .modal-header h3 {
        margin: 0;
        font-size: 1.5em;
        color: #333;
    }
    .close-button {
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        color: #666;
    }
    .close-button:hover {
        color: #333;
    }
    .udi-scanner-container { /* Original container */
        padding: 0; /* Remove padding as it's now in modal-content */
        text-align: center;
        flex-grow: 1; /* Allow to grow within modal-content */
        display: flex; /* Make it flex to organize its children */
        flex-direction: column;
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
        this.isOpen = false; // Track modal open state
        this._productData = null; // Stores fetched product data for adding
        // Bind handlers
        this.openModal = this.openModal.bind(this); // Public open method
        this.closeModal = this.closeModal.bind(this); // Public close method
        this._handleLookupUdi = this._handleLookupUdi.bind(this);
        this._handleAddUdiProduct = this._handleAddUdiProduct.bind(this);
        this._handleUdiInputKeydown = this._handleUdiInputKeydown.bind(this);
        this._handleUdiInput = this._handleUdiInput.bind(this); // New binding
    }

    connectedCallback() {
        this._render();
        this._attachEventListeners();
        // Event listeners for document-level events are now handled by main.js calling public methods
    }

    disconnectedCallback() {
        this._detachEventListeners();
        // Event listeners for document-level events are now handled by main.js calling public methods
    }

    // Public method to open the modal
    openModal() {
        this.isOpen = true;
        this._render(); // Re-render to apply 'open' class
        this._clearUdiProductDetails(); // Clear fields on open
        const udiInput = this.shadowRoot.querySelector('#udi-input');
        if (udiInput) udiInput.focus();
    }

    // Public method to close the modal
    closeModal() {
        this.isOpen = false;
        this._render(); // Re-render to remove 'open' class
        this._clearUdiProductDetails(); // Clear fields on close
        document.dispatchEvent(new CustomEvent('closeUdiScannerModal')); // Signal main.js to hide outer container
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>${UDI_SCANNER_MODAL_STYLES}</style>
            <div class="modal-overlay ${this.isOpen ? 'open' : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>UDI 바코드 스캔</h3>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="udi-scanner-container">
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
                </div>
            </div>
        `;
        this._attachEventListeners(); // Re-attach listeners after _render
        this.shadowRoot.querySelector('.close-button').addEventListener('click', this.closeModal);
        this.shadowRoot.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }

    _attachEventListeners() {
        // Only re-attach if elements are present, as _render rewrites innerHTML
        const lookupBtn = this.shadowRoot.querySelector('#lookup-udi-btn');
        if (lookupBtn) lookupBtn.removeEventListener('click', this._handleLookupUdi); // Remove old listener
        if (lookupBtn) lookupBtn.addEventListener('click', this._handleLookupUdi);

        const addBtn = this.shadowRoot.querySelector('#add-udi-product-btn');
        if (addBtn) addBtn.removeEventListener('click', this._handleAddUdiProduct);
        if (addBtn) addBtn.addEventListener('click', this._handleAddUdiProduct);

        const udiInput = this.shadowRoot.querySelector('#udi-input');
        if (udiInput) {
            udiInput.removeEventListener('keydown', this._handleUdiInputKeydown);
            udiInput.removeEventListener('input', this._handleUdiInput);
        }
        if (udiInput) {
            udiInput.addEventListener('keydown', this._handleUdiInputKeydown);
            udiInput.addEventListener('input', this._handleUdiInput);
        }
    }

    _detachEventListeners() {
        const lookupBtn = this.shadowRoot.querySelector('#lookup-udi-btn');
        if(lookupBtn) lookupBtn.removeEventListener('click', this._handleLookupUdi);
        
        const addBtn = this.shadowRoot.querySelector('#add-udi-product-btn');
        if(addBtn) addBtn.removeEventListener('click', this._handleAddUdiProduct);

        const udiInput = this.shadowRoot.querySelector('#udi-input');
        if(udiInput) {
            udiInput.removeEventListener('keydown', this._handleUdiInputKeydown);
            udiInput.removeEventListener('input', this._handleUdiInput);
        }
        const closeBtn = this.shadowRoot.querySelector('.close-button');
        if(closeBtn) closeBtn.removeEventListener('click', this.closeModal);
        const modalOverlay = this.shadowRoot.querySelector('.modal-overlay');
        if(modalOverlay) modalOverlay.removeEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });
    }

    _handleUdiInput(e) {
        let input = e.target.value;
        input = input.replace(/[^A-Za-z0-9]/g, ''); // Remove non-alphanumeric
        e.target.value = input.toUpperCase();
    }

    _clearUdiProductDetails() {
        this._productData = null;
        const udiInput = this.shadowRoot.querySelector('#udi-input');
        if (udiInput) udiInput.value = '';
        const udiBrand = this.shadowRoot.querySelector('#udi-brand');
        if (udiBrand) udiBrand.textContent = '';
        const udiModel = this.shadowRoot.querySelector('#udi-model');
        if (udiModel) udiModel.textContent = '';
        const udiGtin = this.shadowRoot.querySelector('#udi-gtin');
        if (udiGtin) udiGtin.textContent = '';
        const udiExpirationDate = this.shadowRoot.querySelector('#udi-expiration-date');
        if (udiExpirationDate) udiExpirationDate.textContent = '';
        const udiLotNumber = this.shadowRoot.querySelector('#udi-lot-number');
        if (udiLotNumber) udiLotNumber.textContent = '';
        const udiSerialNumber = this.shadowRoot.querySelector('#udi-serial-number');
        if (udiSerialNumber) udiSerialNumber.textContent = '';
        const udiLensType = this.shadowRoot.querySelector('#udi-lens-type');
        if (udiLensType) udiLensType.textContent = '';
        const udiWearType = this.shadowRoot.querySelector('#udi-wear-type');
        if (udiWearType) udiWearType.textContent = '';
        const udiQuantity = this.shadowRoot.querySelector('#udi-quantity');
        if (udiQuantity) udiQuantity.value = '1';
        const udiPrice = this.shadowRoot.querySelector('#udi-price');
        if (udiPrice) udiPrice.value = '0.00';
        const udiStatusMessage = this.shadowRoot.querySelector('#udi-status-message');
        if (udiStatusMessage) udiStatusMessage.textContent = '';
        const udiProductDetails = this.shadowRoot.querySelector('#udi-product-details');
        if (udiProductDetails) udiProductDetails.style.display = 'none';
        const addUdiProductBtn = this.shadowRoot.querySelector('#add-udi-product-btn');
        if (addUdiProductBtn) addUdiProductBtn.disabled = true;
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
        this.closeModal(); // Call public close method
    }
}

customElements.define('udi-scanner-modal', UdiScannerModal);