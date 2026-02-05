import { CustomerService } from '../services/customer.service.js';

// --- CustomerForm Component ---
export default class CustomerForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.populateForm = this.populateForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.clearForm = this.clearForm.bind(this);
        this.formatPhoneNumber = this.formatPhoneNumber.bind(this);
        this.formatDose = this.formatDose.bind(this);
        this.formatAX = this.formatAX.bind(this); // New AX formatter
        this.handleDeleteClick = this.handleDeleteClick.bind(this); // Bind new delete handler
        this.handleVipCautionChange = this.handleVipCautionChange.bind(this);
    }
    
    connectedCallback() {
        this._render();
        this._form = this.shadowRoot.querySelector('form');
        this._form.phone.addEventListener('input', this.formatPhoneNumber); // Add event listener for phone formatting
        // Attaching formatDose to blur event for cleaner input
        this._form.rightS.addEventListener('blur', this.formatDose);
        this._form.rightC.addEventListener('blur', this.formatDose);
        this._form.leftS.addEventListener('blur', this.formatDose);
        this._form.leftC.addEventListener('blur', this.formatDose);
        // On input, allow user to type freely
        this._form.rightS.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); });
        this._form.rightC.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); });
        this._form.leftS.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); });
        this._form.leftC.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9.-]/g, ''); });

        // AX fields
        this._form.rightAX.addEventListener('blur', this.formatAX);
        this._form.leftAX.addEventListener('blur', this.formatAX);
        this._form.rightAX.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }); // Only digits
        this._form.leftAX.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }); // Only digits


        this._form.isVIP.addEventListener('change', this.handleVipCautionChange);
        this._form.isCaution.addEventListener('change', this.handleVipCautionChange);

        document.addEventListener('editCustomer', this.populateForm);
        document.addEventListener('clearCustomerForm', this.clearForm); // Listen for clear event
        this._form.addEventListener('submit', this.handleSubmit);
        this.shadowRoot.querySelector('#delete-customer-from-form-btn')?.addEventListener('click', this.handleDeleteClick);
        this.handleVipCautionChange(); // Set initial state
    }
    
    disconnectedCallback() {
        this._form.phone.removeEventListener('input', this.formatPhoneNumber); // Remove event listener
        this._form.rightS.removeEventListener('blur', this.formatDose);
        this._form.rightC.removeEventListener('blur', this.formatDose);
        this._form.leftS.removeEventListener('blur', this.formatDose);
        this._form.leftC.removeEventListener('blur', this.formatDose);
        // Need to remove listeners for anonymous functions using a stored reference or re-create the listeners
        // For simplicity, re-assigning null or empty function if original anonymous function reference is not stored
        // A better approach would be to store the anonymous function reference if needed for removal.
        // For now, these anonymous listeners might remain if the element is re-attached without full DOM refresh.
        // Given the Web Component lifecycle, a full render often replaces innerHTML, effectively cleaning listeners.
        
        this._form.isVIP.removeEventListener('change', this.handleVipCautionChange);
        this._form.isCaution.removeEventListener('change', this.handleVipCautionChange);

        document.removeEventListener('editCustomer', this.populateForm);
        document.removeEventListener('clearCustomerForm', this.clearForm);
        this.shadowRoot.querySelector('#delete-customer-from-form-btn')?.removeEventListener('click', this.handleDeleteClick);
    }

    formatPhoneNumber(event) {
        let input = event.target.value.replace(/\D/g, ''); // Remove all non-digit characters
        let formattedInput = '';

        if (input.length > 10) { // 000-0000-0000 format
            formattedInput = input.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (input.length > 7) { // 000-0000-000 format (older phone numbers)
            formattedInput = input.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3');
        } else {
            formattedInput = input;
        }
        event.target.value = formattedInput;
    }

    formatDose(event) {
        let input = event.target.value;
        if (input === '' || input === null) {
            event.target.value = '';
            return;
        }
        // Remove non-numeric characters except for '-' and '.'
        input = input.replace(/[^0-9.-]/g, ''); 
        let floatValue = parseFloat(input);

        if (isNaN(floatValue)) {
            event.target.value = '';
            return;
        }
        
        if (floatValue === 0) {
            event.target.value = '0.00';
        } else if (floatValue < 0) {
            event.target.value = floatValue.toFixed(2);
        } else {
            event.target.value = '+' + floatValue.toFixed(2);
        }
    }

    formatAX(event) {
        let input = event.target.value;
        if (input === '' || input === null) {
            event.target.value = '';
            return;
        }
        let intValue = parseInt(input.replace(/[^0-9]/g, ''), 10);
        if (isNaN(intValue)) {
            event.target.value = '';
            return;
        }
        event.target.value = intValue.toString(); // Store as plain number string, will parse as int for saving.
    }

    handleVipCautionChange(event) {
        const isVIPChecked = this._form.isVIP.checked;
        const isCautionChecked = this._form.isCaution.checked;

        if (event && event.target.id === 'isVIP') {
            if (isVIPChecked) {
                this._form.isCaution.checked = false;
                this._form.isCaution.disabled = true;
            } else {
                this._form.isCaution.disabled = false;
            }
        } else if (event && event.target.id === 'isCaution') {
            if (isCautionChecked) {
                this._form.isVIP.checked = false;
                this._form.isVIP.disabled = true;
            } else {
                this._form.isVIP.disabled = false;
            }
        } else { // Initial load or clear form
            if (isVIPChecked) {
                this._form.isCaution.disabled = true;
            } else if (isCautionChecked) {
                this._form.isVIP.disabled = true;
            } else {
                this._form.isVIP.disabled = false;
                this._form.isCaution.disabled = false;
            }
        }
    }

    handleDeleteClick() {
        const customerId = parseInt(this._form.id.value, 10);
        if (customerId && confirm('이 고객 정보를 삭제하시겠습니까?')) {
            CustomerService.deleteCustomer(customerId);
            document.dispatchEvent(new CustomEvent('closeCustomerModal'));
        }
    }

    _render() {
        const template = document.createElement('template');
        template.innerHTML = `
          <style>
            form { background: #fdfdfd; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 2rem; }
            .form-title { margin-top: 0; margin-bottom: 1.5rem; font-weight: 400; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555; }
            input[type="text"], input[type="tel"], textarea {
                padding: 0.8rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
                width: 100%; /* Default to 100% width for general inputs */
            }

            .checkbox-group { display: flex; align-items: center; margin-bottom: 1rem; gap: 15px; }
            .checkbox-group label { margin-bottom: 0; display: flex; align-items: center; }
            .checkbox-group input[type="checkbox"] { width: auto; margin-right: 5px; }
            button { cursor: pointer; padding: 0.8rem 1.5rem; border: none; border-radius: 4px; color: white; background-color: #3498db; font-size: 1rem; }

            .power-fields-container {
                display: flex;
                flex-direction: row; /* Changed to row for side-by-side */
                justify-content: space-between; /* Distribute space between eye sections */
                gap: 10px;
                margin-bottom: 1rem;
            }
            .eye-section-wrapper { /* New wrapper for each eye to control width */
                flex: 1; /* Allow each eye section to take equal space */
                min-width: 250px; /* Ensure minimum width to prevent squishing */
                padding: 10px;
                border: 1px solid #eee;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            .eye-section-divider {
                width: 1px;
                background-color: #ccc;
                margin: 0 10px; /* Space around the divider */
            }
            h4 {
                margin: 0 0 0.5rem 0; /* Adjusted margin */
                font-size: 1em;
                color: #34495e;
                text-align: center; /* Center the eye titles */
            }
            .power-eye-section {
                display: flex;
                flex-wrap: nowrap; /* Prevent wrapping */
                justify-content: center; /* Center align fields within section */
                gap: 5px; /* Reduced space between S, C, AX fields */
                align-items: flex-end; /* Align inputs at the bottom */
            }
            .power-eye-section .power-field-group {
                display: flex;
                flex-direction: column; /* Stack label and input vertically */
                align-items: center; /* Center items in column */
                gap: 3px; /* Further reduced space between label and input */
                flex-grow: 0; /* Prevent growth to maintain size */
                flex-shrink: 0; /* Allow shrinking */
            }
            .power-eye-section .power-field-group label {
                margin-bottom: 0; /* Remove default label margin */
                white-space: nowrap; /* Prevent label wrapping */
                font-size: 0.8em; /* Smaller label font size */
            }
            .power-eye-section .power-field-group input[type="text"] {
                width: 55px; /* Slightly larger fixed width for dose inputs */
                padding: 0.4rem; /* Reduced padding */
                text-align: center; /* Center align text in dose inputs */
                font-size: 0.9em;
            }

            .form-group-inline {
                display: flex;
                align-items: flex-end; /* Align items to the bottom */
                gap: 20px; /* Space between name input and checkboxes */
                margin-bottom: 1rem;
            }

            #delete-customer-from-form-btn {
                background-color: #c0392b; /* Ensure delete button is red */
            }
            .form-buttons {
                display: flex;
                justify-content: flex-end; /* 모든 버튼을 오른쪽으로 정렬 */
                margin-top: 2rem;
            }
            #delete-customer-from-form-btn {
                background-color: #c0392b; /* 붉은색으로 설정 */
                margin-right: auto; /* 삭제 버튼을 왼쪽으로 밀어냅니다. */
            }
          </style>
          <form>
            <h3 class="form-title">고객 추가 / 수정</h3>
            <input type="hidden" name="id">
            <div class="form-group-inline">
                <div class="form-group" style="flex-grow: 1;">
                    <label for="name">이름</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="checkbox-group" style="margin-top: auto; padding-bottom: 0.5rem;">
                    <label>
                        <input type="checkbox" id="isVIP" name="isVIP"> VIP
                    </label>
                    <label>
                        <input type="checkbox" id="isCaution" name="isCaution"> 주의
                    </label>
                </div>
            </div>
            <div class="form-group">
              <label for="phone">연락처</label>
              <input type="tel" id="phone" name="phone" required>
            </div>

            <div class="power-fields-container">
                <div class="eye-section-wrapper">
                    <h4>오른쪽 눈</h4>
                    <div class="power-eye-section">
                        <div class="form-group power-field-group">
                          <label for="rightS">S</label>
                          <input type="text" id="rightS" name="rightS" step="0.25">
                        </div>
                        <div class="form-group power-field-group">
                          <label for="rightC">C</label>
                          <input type="text" id="rightC" name="rightC" step="0.25">
                        </div>
                        <div class="form-group power-field-group">
                          <label for="rightAX">AX</label>
                          <input type="text" id="rightAX" name="rightAX">
                        </div>
                    </div>
                </div>
                <div class="eye-section-divider"></div> <!-- Divider -->
                <div class="eye-section-wrapper">
                    <h4>왼쪽 눈</h4>
                    <div class="power-eye-section">
                        <div class="form-group power-field-group">
                          <label for="leftS">S</label>
                          <input type="text" id="leftS" name="leftS" step="0.25">
                        </div>
                        <div class="form-group power-field-group">
                          <label for="leftC">C</label>
                          <input type="text" id="leftC" name="leftC" step="0.25">
                        </div>
                        <div class="form-group power-field-group">
                          <label for="leftAX">AX</label>
                          <input type="text" id="leftAX" name="leftAX">
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-group">
              <label for="notes">비고</label>
              <textarea id="notes" name="notes" rows="3"></textarea>
            </div>
            <div class="form-buttons">
                <button type="button" id="delete-customer-from-form-btn">고객 삭제</button>
                <button type="submit">고객 추가</button>
            </div>
          </form>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    clearForm() {
        this._form.reset();
        this._form.id.value = '';
        this._form.querySelector('button[type="submit"]').textContent = '고객 추가';
        this.shadowRoot.querySelector('#delete-customer-from-form-btn').style.display = 'none'; // Hide delete button for new customer
        this.handleVipCautionChange(); // Reset checkbox states
    }

    populateForm(e) {
        const customer = e.detail;
        this._form.id.value = customer.id;
        this._form.name.value = customer.name;
        this._form.isVIP.checked = customer.isVIP;
        this._form.isCaution.checked = customer.isCaution;
        this._form.phone.value = customer.phone;
        // Populate new dose fields, applying formatting for display
        this._form.rightS.value = customer.rightS ? (customer.rightS > 0 ? '+' : '') + customer.rightS.toFixed(2) : '';
        this._form.rightC.value = customer.rightC ? (customer.rightC > 0 ? '+' : '') + customer.rightC.toFixed(2) : '';
        this._form.rightAX.value = customer.rightAX !== null ? customer.rightAX.toString() : '';
        this._form.leftS.value = customer.leftS ? (customer.leftS > 0 ? '+' : '') + customer.leftS.toFixed(2) : '';
        this._form.leftC.value = customer.leftC ? (customer.leftC > 0 ? '+' : '') + customer.leftC.toFixed(2) : '';
        this._form.leftAX.value = customer.leftAX !== null ? customer.leftAX.toString() : '';
        
        this._form.notes.value = customer.notes;
        this.scrollIntoView({ behavior: 'smooth' });
        this._form.querySelector('button[type="submit"]').textContent = '고객 수정';
        this.shadowRoot.querySelector('#delete-customer-from-form-btn').style.display = 'inline-block'; // Show delete button for existing customer
        this.handleVipCautionChange(); // Set checkbox states
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this._form);
        const customer = {
            id: parseInt(formData.get('id'), 10) || null,
            name: formData.get('name'),
            phone: formData.get('phone'),
            // Parse formatted dose string back to float
            rightS: parseFloat(formData.get('rightS')) || null,
            rightC: parseFloat(formData.get('rightC')) || null,
            rightAX: parseInt(formData.get('rightAX'), 10) || 0, // AX is integer, default 0
            leftS: parseFloat(formData.get('leftS')) || null,
            leftC: parseFloat(formData.get('leftC')) || null,
            leftAX: parseInt(formData.get('leftAX'), 10) || 0, // AX is integer, default 0
            notes: formData.get('notes'),
            isVIP: formData.get('isVIP') === 'on',
            isCaution: formData.get('isCaution') === 'on',
        };

        let success = false;
        if (customer.id) {
            success = CustomerService.updateCustomer(customer);
        } else {
            delete customer.id;
            success = CustomerService.addCustomer(customer);
        }

        if (success) {
            document.dispatchEvent(new CustomEvent('closeCustomerModal')); // Close modal on success
            this.clearForm(); // Clear form after successful save
        }
    }
}
customElements.define('customer-form', CustomerForm);
