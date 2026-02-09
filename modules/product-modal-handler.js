import { productModal, closeProductButton, addProductBtn, productModalLayout, saveAllProductsBtn } from '../utils/dom-elements.js';
import { toggleProductTempListVisibility } from './product-temp-list-manager.js';

let isEditMode = false; // Internal state for the modal mode

/**
 * Opens the product modal in either add or edit mode.
 * @param {boolean} editMode - True for edit mode, false for add mode.
 */
function openProductModal(editMode = false) {
    isEditMode = editMode;
    if (productModal) {
        toggleProductTempListVisibility(isEditMode); // Control temp list visibility
        
        // Adjust product modal layout based on mode
        if (isEditMode) {
            productModalLayout.style.display = 'block'; // Or 'flex', depending on desired layout for edit
        } else {
            productModalLayout.style.display = 'flex'; // Default for add mode
        }

        productModal.style.display = 'block';
        console.log('Product modal opened in ' + (isEditMode ? 'edit' : 'add') + ' mode.');
        document.dispatchEvent(new CustomEvent('clearProductForm')); // Clear form on open
    } else {
        console.error('Attempted to open product modal but element not found.');
    }
}

/**
 * Closes the product modal.
 */
function closeProductModal() {
    if (productModal) {
        productModal.style.display = 'none';
        console.log('Product modal closed.');
        document.dispatchEvent(new CustomEvent('clearProductForm')); // Clear form on close
    } else {
        console.error('Attempted to close product modal but element not found.');
    }
}

/**
 * Initializes the product modal's event listeners.
 * @param {Function} closeProductModalCallback - A callback function to close the modal.
 */
export function initProductModalHandler() {
    // Event listeners for product modal
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            openProductModal(false); // Open in add mode
        });
    }

    if (closeProductButton) {
        closeProductButton.addEventListener('click', closeProductModal);
    }

    // Listen for custom events to open/close
    document.addEventListener('openProductModal', (e) => {
        openProductModal(true); // Open in edit mode
        // Potentially dispatch event to load product data into form if e.detail contains product ID
    });
    document.addEventListener('closeProductModal', closeProductModal);
}

// Export open/close functions if they need to be called externally
export { openProductModal, closeProductModal };