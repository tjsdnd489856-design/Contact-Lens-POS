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
        padding: 24px;
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 90%;
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
    .udi-scanner-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    #udi-input-section {
        display: flex;
        gap: 12px;
    }
    #udi-input {
        flex-grow: 1;
        padding: 12px 16px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
    }
    #lookup-udi-btn {
        padding: 12px 24px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background-color 0.2s;
    }
    #lookup-udi-btn:hover {
        background-color: #0056b3;
    }
    #udi-product-details {
        text-align: left;
        border: 1px solid #e9ecef;
        padding: 20px;
        border-radius: 10px;
        background-color: #f8f9fa;
        display: none;
    }
    #udi-product-details h4 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
        font-size: 1.1rem;
    }
    #udi-product-details p {
        margin: 8px 0;
        display: flex;
        align-items: center;
    }
    #udi-product-details strong {
        width: 120px;
        color: #666;
        font-size: 0.9rem;
    }
    #udi-product-details span {
        font-weight: 600;
        color: #1a1a1a;
    }
    #udi-quantity, #udi-price {
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
    }
    #udi-status-message {
        color: #d9534f;
        font-weight: 500;
        text-align: center;
        min-height: 20px;
    }
    #add-udi-product-btn {
        padding: 14px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        font-size: 1.1rem;
        font-weight: 700;
        transition: all 0.2s;
    }
    #add-udi-product-btn:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
    #add-udi-product-btn:not(:disabled):hover {
        background-color: #218838;
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(40, 167, 69, 0.2);
    }
`;

export default class UdiScannerModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this._productData = null;
        
        // Bind handlers
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this._handleLookupUdi = this._handleLookupUdi.bind(this);
        this._handleAddUdiProduct = this._handleAddUdiProduct.bind(this);
        this._handleUdiInputKeydown = this._handleUdiInputKeydown.bind(this);
        this._handleUdiInput = this._handleUdiInput.bind(this);
    }

    connectedCallback() {
        this._render();
    }

    openModal() {
        this.isOpen = true;
        this._render();
        this._productData = null;
        const udiInput = this.shadowRoot.querySelector('#udi-input');
        if (udiInput) {
            udiInput.value = '';
            setTimeout(() => udiInput.focus(), 100);
        }
    }

    closeModal() {
        this.isOpen = false;
        this._render();
        document.dispatchEvent(new CustomEvent('closeUdiScannerModal'));
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>${UDI_SCANNER_MODAL_STYLES}</style>
            <div class="modal-overlay ${this.isOpen ? 'open' : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>UDI 제품 등록</h3>
                        <button class="close-button">&times;</button>
                    </div>
                    <div class="udi-scanner-container">
                        <div id="udi-input-section">
                            <input type="text" id="udi-input" placeholder="UDI 바코드를 스캔하거나 입력하세요" inputmode="latin" lang="en">
                            <button id="lookup-udi-btn">조회</button>
                        </div>
                        <div id="udi-status-message"></div>
                        <div id="udi-product-details">
                            <h4>조회된 제품 정보</h4>
                            <p><strong>브랜드:</strong> <span id="udi-brand"></span></p>
                            <p><strong>모델명:</strong> <span id="udi-model"></span></p>
                            <p><strong>UDI-DI (GTIN):</strong> <span id="udi-gtin"></span></p>
                            <p><strong>유통기한:</strong> <span id="udi-expiration-date"></span></p>
                            <p><strong>로트 번호:</strong> <span id="udi-lot-number"></span></p>
                            <p><strong>일련 번호:</strong> <span id="udi-serial-number"></span></p>
                            <p><strong>수량:</strong> <input type="number" id="udi-quantity" value="1" min="1"></p>
                            <p><strong>가격:</strong> <input type="number" id="udi-price" value="0" min="0" step="100"></p>
                        </div>
                        <button id="add-udi-product-btn" disabled>재고에 추가</button>
                    </div>
                </div>
            </div>
        `;
        this._attachEventListeners();
    }

    _attachEventListeners() {
        const root = this.shadowRoot;
        root.querySelector('.close-button').onclick = this.closeModal;
        root.querySelector('.modal-overlay').onclick = (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        };

        const lookupBtn = root.querySelector('#lookup-udi-btn');
        if (lookupBtn) lookupBtn.onclick = this._handleLookupUdi;

        const addBtn = root.querySelector('#add-udi-product-btn');
        if (addBtn) addBtn.onclick = this._handleAddUdiProduct;

        const udiInput = root.querySelector('#udi-input');
        if (udiInput) {
            udiInput.onkeydown = this._handleUdiInputKeydown;
            udiInput.oninput = this._handleUdiInput;
        }
    }

    _handleUdiInput(e) {
        let input = e.target.value;
        // Keep alphanumeric and some GS1 separators if needed
        input = input.replace(/[^A-Za-z0-9()]/g, '');
        e.target.value = input.toUpperCase();
    }

    /**
     * 입력을 제외한 나머지 정보 영역만 초기화합니다.
     */
    _clearLookupResults() {
        const root = this.shadowRoot;
        this._productData = null;
        
        const fields = ['#udi-brand', '#udi-model', '#udi-gtin', '#udi-expiration-date', '#udi-lot-number', '#udi-serial-number'];
        fields.forEach(f => {
            const el = root.querySelector(f);
            if (el) el.textContent = '';
        });

        const detailBox = root.querySelector('#udi-product-details');
        if (detailBox) detailBox.style.display = 'none';

        const addBtn = root.querySelector('#add-udi-product-btn');
        if (addBtn) addBtn.disabled = true;

        const msg = root.querySelector('#udi-status-message');
        if (msg) msg.textContent = '';
    }

    _showProductDetails(product) {
        const root = this.shadowRoot;
        this._productData = product;
        
        root.querySelector('#udi-brand').textContent = product.brand || 'N/A';
        root.querySelector('#udi-model').textContent = product.model || 'N/A';
        root.querySelector('#udi-gtin').textContent = product.gtin || 'N/A';
        root.querySelector('#udi-expiration-date').textContent = product.expirationDate || 'N/A';
        root.querySelector('#udi-lot-number').textContent = product.lotNumber || 'N/A';
        root.querySelector('#udi-serial-number').textContent = product.serialNumber || 'N/A';
        
        root.querySelector('#udi-product-details').style.display = 'block';
        root.querySelector('#add-udi-product-btn').disabled = false;
        root.querySelector('#udi-status-message').textContent = '';
    }

    _handleUdiInputKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this._handleLookupUdi();
        }
    }

    async _handleLookupUdi() {
        const root = this.shadowRoot;
        const udiInput = root.querySelector('#udi-input');
        const statusMsg = root.querySelector('#udi-status-message');

        const udiString = udiInput.value.trim();
        
        // 조회를 시작하기 전에 결과 영역만 비움 (입력값 유지)
        this._clearLookupResults();

        if (!udiString) {
            statusMsg.textContent = MESSAGES.ENTER_UDI;
            return;
        }

        try {
            statusMsg.textContent = MESSAGES.LOOKUP_IN_PROGRESS;
            const parsedUdi = parseUdiBarcode(udiString);
            const gtin = parsedUdi.gtin;

            if (!gtin) {
                statusMsg.textContent = MESSAGES.INVALID_GTIN;
                return;
            }

            const externalProduct = await ProductService.fetchProductDetailsFromExternalApi(gtin);

            if (externalProduct) {
                const productToDisplay = {
                    ...externalProduct,
                    gtin: gtin,
                    expirationDate: parsedUdi.expirationDate || externalProduct.expirationDate,
                    lotNumber: parsedUdi.lotNumber || externalProduct.lotNumber,
                    serialNumber: parsedUdi.serialNumber || externalProduct.serialNumber,
                };
                this._showProductDetails(productToDisplay);
            } else {
                statusMsg.textContent = MESSAGES.PRODUCT_NOT_FOUND;
            }
        } catch (error) {
            console.error('UDI Lookup Error:', error);
            statusMsg.textContent = MESSAGES.LOOKUP_ERROR(error.message);
        }
    }

    async _handleAddUdiProduct() {
        if (!this._productData) return;

        const root = this.shadowRoot;
        const qty = parseInt(root.querySelector('#udi-quantity').value, 10);
        const price = parseFloat(root.querySelector('#udi-price').value);

        const newProduct = {
            ...this._productData,
            quantity: qty,
            price: price,
            barcode: this._productData.gtin || this._productData.barcode
        };

        try {
            await ProductService.addProduct(newProduct);
            alert(MESSAGES.ADD_PRODUCT_SUCCESS);
            this.closeModal();
        } catch (error) {
            alert(`제품 추가 실패: ${error.message}`);
        }
    }
}

customElements.define('udi-scanner-modal', UdiScannerModal);
