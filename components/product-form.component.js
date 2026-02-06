import { ProductService } from '../services/product.service.js';

// Add a helper function to format power values
function formatPowerValue(inputElement) {
    let value = inputElement.value.trim();

    if (!value) {
        return;
    }

    // Remove any non-numeric characters except for '+' or '-' at the beginning
    let cleanValue = value.replace(/[^0-9+\-.]/g, '');

    // Check if it starts with '+'
    const startsWithPlus = cleanValue.startsWith('+');
    if (startsWithPlus) {
        cleanValue = cleanValue.substring(1); // Remove '+' for parsing
    } else if (cleanValue.startsWith('-')) {
        cleanValue = cleanValue.substring(1); // Remove '-' for parsing
    }

    let num = parseFloat(cleanValue);

    if (isNaN(num)) {
        inputElement.value = ''; // Clear if not a valid number
        return;
    }

    // Apply the formatting: x / 100
    let formattedValue = (num / 100).toFixed(2); // Keep two decimal places

    if (startsWithPlus) {
        inputElement.value = `+${formattedValue}`;
    } else {
        // Automatically add '-' if no sign was given for negative power, or keep existing '-'
        inputElement.value = formattedValue.startsWith('-') ? formattedValue : `-${formattedValue}`;
    }
}

// --- ProductForm Component ---
export default class ProductForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.populateForm = this.populateForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.clearForm = this.clearForm.bind(this);
        this.handleBarcodeScan = this.handleBarcodeScan.bind(this);
    }

    connectedCallback() {
        this._render();
        this._form = this.shadowRoot.querySelector('form');
        document.addEventListener('editProduct', this.populateForm);
        this._form.addEventListener('submit', this.handleSubmit);
        document.addEventListener('clearProductForm', this.clearForm);
        this._form.barcode.addEventListener('change', this.handleBarcodeScan); // Use 'change' event for barcode

        // Add event listeners for power input formatting
        this._form.powerS.addEventListener('input', (e) => formatPowerValue(e.target));
        this._form.powerC.addEventListener('input', (e) => formatPowerValue(e.target));
    }

    disconnectedCallback() {
        document.removeEventListener('editProduct', this.populateForm);
        this._form.removeEventListener('submit', this.handleSubmit);
        document.removeEventListener('clearProductForm', this.clearForm);
        this._form.barcode.removeEventListener('change', this.handleBarcodeScan);

        // Remove event listeners for power input formatting
        this._form.powerS.removeEventListener('input', (e) => formatPowerValue(e.target));
        this._form.powerC.removeEventListener('input', (e) => formatPowerValue(e.target));
    }

    _render() {
        const template = document.createElement('template');
        template.innerHTML = `
          <style>
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
          </style>
          <form>
            <h3 class="form-title">제품 추가</h3>
            <input type="hidden" name="id">
            <div class="form-group">
              <label for="barcode">바코드</label>
              <input type="text" id="barcode" name="barcode" placeholder="바코드 스캔" required>
            </div>
            <div class="form-group">
              <label for="brand">브랜드</label>
              <input type="text" id="brand" name="brand" required>
            </div>
            <div class="form-group">
              <label for="model">모델명</label>
              <input type="text" id="model" name="model" required>
            </div>
            <div class="power-fields">
              <div class="form-group">
                <label for="powerS">S</label>
                <input type="number" id="powerS" name="powerS" step="0.25" required>
              </div>
              <div class="form-group">
                <label for="powerC">C</label>
                <input type="number" id="powerC" name="powerC" step="0.25" required>
              </div>
              <div class="form-group">
                <label for="powerAX">AX</label>
                <input type="number" id="powerAX" name="powerAX" step="1" required>
              </div>
            </div>
            <div class="form-group">
              <label for="quantity">수량</label>
              <input type="number" id="quantity" name="quantity" min="0" required>
            </div>
            <div class="form-group">
              <label for="expirationDate">유통기한</label>
              <input type="date" id="expirationDate" name="expirationDate" required>
            </div>
            <div class="form-group">
              <label for="price">가격</label>
              <input type="number" id="price" name="price" step="0.01" min="0" required>
            </div>
            <button type="submit">제품 추가</button>
          </form>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    fillFormWithProductData(product) {
        this._form.brand.value = product.brand;
        this._form.model.value = product.model;
        this._form.powerS.value = product.powerS;
        this._form.powerC.value = product.powerC;
        this._form.powerAX.value = product.powerAX;
        this._form.quantity.value = product.quantity;
        this._form.expirationDate.value = product.expirationDate;
        this._form.price.value = product.price;
    }

    handleBarcodeScan(e) {
        const barcode = e.target.value;
        if (barcode) {
            const product = ProductService.getProductByBarcode(barcode);
            if (product) {
                this.fillFormWithProductData(product);
                // Automatically add to temp list after filling form
                document.dispatchEvent(new CustomEvent('addProductToModalList', { detail: { ...product, tempId: Date.now() } }));
                this._form.barcode.value = ''; // Clear barcode input
            } else {
                // If barcode not found, clear other fields but keep barcode for manual entry
                alert('바코드와 일치하는 제품을 찾을 수 없습니다. 수동으로 정보를 입력해 주세요.');
                this.clearForm();
                this._form.barcode.value = barcode; // Keep barcode for user to potentially modify or re-enter
            }
        }
    }

    populateForm(e) {
        this.clearForm();
        const product = e.detail;
        this.shadowRoot.querySelector('.form-title').textContent = '제품 수정';
        this._form.id.value = product.id;
        this._form.barcode.value = product.barcode;
        this._form.brand.value = product.brand;
        this._form.model.value = product.model;
        this._form.powerS.value = product.powerS;
        this._form.powerC.value = product.powerC;
        this._form.powerAX.value = product.powerAX;
        this._form.quantity.value = product.quantity;
        this._form.expirationDate.value = product.expirationDate;
        this._form.price.value = product.price;
        this._form.querySelector('button').textContent = '제품 수정';
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this._form);
        const id = parseInt(formData.get('id'), 10) || null;
        
        const product = {
            barcode: formData.get('barcode'),
            brand: formData.get('brand'),
            model: formData.get('model'),
            powerS: parseFloat(formData.get('powerS')),
            powerC: parseFloat(formData.get('powerC')),
            powerAX: parseInt(formData.get('powerAX'), 10),
            quantity: parseInt(formData.get('quantity'), 10),
            expirationDate: formData.get('expirationDate'),
            price: parseFloat(formData.get('price')),
        };

        if (id) {
             product.id = id;
             ProductService.updateProduct(product);
             document.dispatchEvent(new CustomEvent('closeProductModal'));
        } else {
            product.tempId = Date.now();
            document.dispatchEvent(new CustomEvent('addProductToModalList', { detail: product }));
            this.clearForm();
        }
    }

    clearForm() {
        this._form.reset();
        this._form.id.value = '';
        this.shadowRoot.querySelector('.form-title').textContent = '제품 추가';
        this._form.querySelector('button').textContent = '제품 추가';
    }
}
customElements.define('product-form', ProductForm);