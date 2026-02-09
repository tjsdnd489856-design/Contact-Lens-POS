import { ProductService } from '../services/product.service.js';

// --- Constants ---
const FORM_MESSAGES = {
    PRODUCT_NOT_FOUND: '바코드와 일치하는 제품을 찾을 수 없습니다. 수동으로 정보를 입력해 주세요.',
    ADD_PRODUCT_TITLE: '제품 추가',
    EDIT_PRODUCT_TITLE: '제품 수정',
    ADD_BUTTON_TEXT: '제품 추가',
    EDIT_BUTTON_TEXT: '제품 수정',
};

const PRODUCT_FORM_STYLES = `
    /* Remove spinner buttons from number inputs within Shadow DOM */
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type="number"] {
      -moz-appearance: textfield; /* Firefox */
    }

    form { 
      background: #fdfdfd; 
      padding: 1rem; 
      border-radius: 8px; 
      box-shadow: none; 
      margin-bottom: 1rem;
    }
    .form-title { 
      margin-top: 0; 
      margin-bottom: 1.5rem; 
      font-weight: 400; 
      font-size: 1.2rem;
    }
    .form-group { margin-bottom: 0.8rem; }
    .power-fields { display: flex; gap: 10px; }
    .power-fields .form-group { flex: 1; }
    label { 
      display: block; 
      margin-bottom: 0.3rem; 
      font-weight: 500; 
      color: #555; 
      font-size: 0.9rem;
    }
    input { 
      width: 100%; 
      padding: 0.6rem; 
      border: 1px solid #ccc; 
      border-radius: 4px; 
      box-sizing: border-box; 
    }
    button { 
      cursor: pointer; 
      padding: 0.7rem 1.5rem; 
      border: none; 
      border-radius: 4px; 
      color: white; 
      background-color: #3498db; 
      font-size: 1rem; 
      width: 100%;
      margin-top: 1rem;
    }
`;

// --- ProductForm Component ---
export default class ProductForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._product = null; // Store the product being edited
    }

    connectedCallback() {
        this._render();
        this._form = this.shadowRoot.querySelector('form');
        this._attachEventListeners();
        document.addEventListener('editProduct', this._populateForm);
        document.addEventListener('clearProductForm', this._clearForm);
        this._updateFormDisplay(); // Set initial state of form title and button
    }

    disconnectedCallback() {
        this._detachEventListeners();
        document.removeEventListener('editProduct', this._populateForm);
        document.removeEventListener('clearProductForm', this._clearForm);
    }

    /**
     * Attaches event listeners to form elements.
     * @private
     */
    _attachEventListeners() {
        if (!this._form) return;
        this._form.barcode.addEventListener('change', this._handleBarcodeScan);

        // Power input formatting
        ['powerS', 'powerC'].forEach(field => {
            this._form[field].addEventListener('change', (e) => this._formatPowerValue(e.target));
        });

        this._form.addEventListener('submit', this._handleSubmit);
    }

    /**
     * Detaches event listeners from form elements.
     * @private
     */
    _detachEventListeners() {
        if (!this._form) return;
        this._form.barcode.removeEventListener('change', this._handleBarcodeScan);

        ['powerS', 'powerC'].forEach(field => {
            this._form[field].removeEventListener('change', (e) => this._formatPowerValue(e.target));
        });

        this._form.removeEventListener('submit', this._handleSubmit);
    }

    /**
     * Formats power values (S, C) for display and internal storage (x/100).
     * @param {HTMLInputElement} inputElement - The input element to format.
     * @private
     */
    _formatPowerValue(inputElement) {
        let value = inputElement.value.trim();
        if (!value) {
            inputElement.value = '';
            return;
        }

        let cleanValue = value.replace(/[^0-9+\-.]/g, '');
        const startsWithPlus = cleanValue.startsWith('+');
        const startsWithMinus = cleanValue.startsWith('-');

        if (startsWithPlus || startsWithMinus) {
            cleanValue = cleanValue.substring(1); 
        }

        let num = parseFloat(cleanValue);
        if (isNaN(num)) {
            inputElement.value = '';
            return;
        }

        let formattedValue = (num / 100).toFixed(2);
        if (floatValue === 0) {
            inputElement.value = '0.00';
        } else if (startsWithPlus || (!startsWithMinus && floatValue > 0)) {
            inputElement.value = `+${formattedValue}`;
        } else {
            inputElement.value = `-${formattedValue}`;
        }
    }

    /**
     * Handles barcode scan input, attempting to fill form with product data.
     * @param {Event} e - The change event from the barcode input.
     * @private
     */
    _handleBarcodeScan(e) {
        const barcode = e.target.value;
        if (!barcode) return;

        const product = ProductService.getProductByLegacyBarcode(barcode);
        if (product) {
            this._fillFormWithProductData(product);
            document.dispatchEvent(new CustomEvent('addProductToModalList', { detail: { ...product, tempId: Date.now() } }));
            this._form.barcode.value = ''; // Clear barcode input
        } else {
            alert(FORM_MESSAGES.PRODUCT_NOT_FOUND);
            this._clearForm(true); // Clear all fields except barcode
            this._form.barcode.value = barcode;
        }
    }

    /**
     * Fills the form fields with provided product data.
     * @param {Object} product - The product object to display.
     * @private
     */
    _fillFormWithProductData(product) {
        this._form.id.value = product.id || '';
        this._form.barcode.value = product.barcode || '';
        this._form.gtin.value = product.gtin || '';
        this._form.brand.value = product.brand || '';
        this._form.model.value = product.model || '';
        this._form.powerS.value = (product.powerS !== null && product.powerS !== undefined) ? this._formatPowerValueDisplay(product.powerS) : '';
        this._form.powerC.value = (product.powerC !== null && product.powerC !== undefined) ? this._formatPowerValueDisplay(product.powerC) : '';
        this._form.powerAX.value = (product.powerAX !== null && product.powerAX !== undefined) ? product.powerAX.toString() : '';
        this._form.quantity.value = product.quantity || 1;
        this._form.expirationDate.value = product.expirationDate || '';
        this._form.price.value = product.price || 0;
    }

    /**
     * Helper to format power values for display in the form (e.g., +1.25).
     * @param {number|null} value - The power value.
     * @returns {string} Formatted string.
     * @private
     */
    _formatPowerValueDisplay(value) {
        if (value === null || value === undefined) return '';
        return (value >= 0 ? '+' : '') + value.toFixed(2);
    }

    /**
     * Populates the form with existing product data for editing.
     * @param {CustomEvent} e - The event containing product data.
     * @private
     */
    _populateForm(e) {
        this._product = e.detail;
        this._render(); // Re-render to populate form fields
        this._fillFormWithProductData(this._product); // Fill form with data
        this._updateFormDisplay(); // Update title and button
        this.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Clears the form and resets to 'add' mode.
     * @param {boolean} keepBarcode - If true, keeps the barcode input value.
     * @private
     */
    _clearForm(keepBarcode = false) {
        this._product = null;
        this._form.reset();
        this._form.id.value = '';
        this._form.gtin.value = '';
        if (keepBarcode) {
            const currentBarcode = this._form.barcode.value;
            this._form.barcode.value = currentBarcode;
        }
        this._updateFormDisplay(); // Update title and button
    }

    /**
     * Updates the form title and submit button text based on whether a product is being edited.
     * @private
     */
    _updateFormDisplay() {
        const formTitle = this.shadowRoot.querySelector('.form-title');
        const submitBtn = this.shadowRoot.querySelector('button[type="submit"]');

        if (this._product) {
            formTitle.textContent = FORM_MESSAGES.EDIT_PRODUCT_TITLE;
            submitBtn.textContent = FORM_MESSAGES.EDIT_BUTTON_TEXT;
        } else {
            formTitle.textContent = FORM_MESSAGES.ADD_PRODUCT_TITLE;
            submitBtn.textContent = FORM_MESSAGES.ADD_BUTTON_TEXT;
        }
    }

    /**
     * Handles form submission for adding or updating a product.
     * @param {Event} e - The submit event.
     * @private
     */
    _handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this._form);
        const id = parseInt(formData.get('id'), 10) || null;
        
        const barcode = formData.get('barcode');
        const gtin = (barcode && barcode.length >= 13 && barcode.length <= 14) ? barcode : ''; // Use barcode as gtin if valid length
        
        const product = {
            barcode: barcode,
            gtin: gtin,
            brand: formData.get('brand'),
            model: formData.get('model'),
            powerS: parseFloat(formData.get('powerS')) || 0,
            powerC: parseFloat(formData.get('powerC')) || 0,
            powerAX: parseInt(formData.get('powerAX'), 10) || 0,
            quantity: parseInt(formData.get('quantity'), 10) || 0,
            expirationDate: formData.get('expirationDate'),
            price: parseFloat(formData.get('price')) || 0,
            // Assuming lensType and wearType are '투명' and 'N/A' by default if not set by the form
            lensType: DEFAULT_LENS_TYPE, 
            wearType: DEFAULT_WEAR_TYPE,
        };

        if (id) {
             product.id = id;
             ProductService.updateProduct(product);
             document.dispatchEvent(new CustomEvent('closeProductModal'));
        } else {
            // For new products, add to the temporary list in the modal, not directly to ProductService
            document.dispatchEvent(new CustomEvent('addProductToModalList', { detail: product }));
            this._clearForm(); // Clear form after adding to temp list
            this.focusBarcodeInput(); // Focus barcode after adding product
        }
    }

    /**
     * Sets focus to the barcode input field.
     * @private
     */
    focusBarcodeInput() {
        setTimeout(() => {
            this._form.barcode.focus();
        }, 0); 
    }

    /**
     * Renders the component's HTML structure.
     * @private
     */
    _render() {
        this.shadowRoot.innerHTML = `
          <style>${PRODUCT_FORM_STYLES}</style>
          <form>
            <h3 class="form-title">${this._product ? FORM_MESSAGES.EDIT_PRODUCT_TITLE : FORM_MESSAGES.ADD_PRODUCT_TITLE}</h3>
            <input type="hidden" name="id" value="${this._product ? this._product.id : ''}">
            <input type="hidden" name="gtin" value="${this._product ? this._product.gtin : ''}">
            <div class="form-group">
              <label for="barcode">바코드</label>
              <input type="text" id="barcode" name="barcode" placeholder="바코드 스캔" value="${this._product ? this._product.barcode : ''}">
            </div>
            <div class="form-group">
              <label for="brand">브랜드</label>
              <input type="text" id="brand" name="brand" required value="${this._product ? this._product.brand : ''}">
            </div>
            <div class="form-group">
              <label for="model">모델명</label>
              <input type="text" id="model" name="model" required value="${this._product ? this._product.model : ''}">
            </div>
            <div class="power-fields">
              <div class="form-group">
                <label for="powerS">S</label>
                <input type="number" id="powerS" name="powerS" step="0.25" value="${this._product && this._product.powerS !== null ? this._product.powerS : ''}">
              </div>
              <div class="form-group">
                <label for="powerC">C</label>
                <input type="number" id="powerC" name="powerC" step="0.25" value="${this._product && this._product.powerC !== null ? this._product.powerC : ''}">
              </div>
              <div class="form-group">
                <label for="powerAX">AX</label>
                <input type="number" id="powerAX" name="powerAX" step="1" value="${this._product && this._product.powerAX !== null ? this._product.powerAX : ''}">
              </div>
            </div>
            <div class="form-group">
              <label for="quantity">수량</label>
              <input type="number" id="quantity" name="quantity" min="0" required value="${this._product ? this._product.quantity : ''}">
            </div>
            <div class="form-group">
              <label for="expirationDate">유통기한</label>
              <input type="date" id="expirationDate" name="expirationDate" required value="${this._product ? this._product.expirationDate : ''}">
            </div>
            <div class="form-group">
              <label for="price">가격</label>
              <input type="number" id="price" name="price" step="0.01" min="0" required value="${this._product ? this._product.price : ''}">
            </div>
            <button type="submit">${this._product ? FORM_MESSAGES.EDIT_BUTTON_TEXT : FORM_MESSAGES.ADD_BUTTON_TEXT}</button>
          </form>
        `;
        this._updateFormDisplay(); // Ensure buttons reflect current mode after initial render
    }
}
customElements.define('product-form', ProductForm);