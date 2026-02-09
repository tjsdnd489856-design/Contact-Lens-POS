import { customerModal, closeCustomerButton, addCustomerBtn, customerSearchInput } from '../utils/dom-elements.js';

/**
 * Opens the customer modal.
 */
function openCustomerModal() {
    if (customerModal) {
        customerModal.style.display = 'block';
        console.log('Customer modal opened.');
        document.dispatchEvent(new CustomEvent('clearCustomerForm')); // Ensure form is cleared
    } else {
        console.error('Attempted to open customer modal but element not found.');
    }
}

/**
 * Closes the customer modal.
 */
function closeCustomerModal() {
    if (customerModal) {
        customerModal.style.display = 'none';
        document.dispatchEvent(new CustomEvent('clearCustomerForm')); // Clear form on close
        console.log('Customer modal closed.');
    } else {
        console.error('Attempted to close customer modal but element not found.');
    }
}

/**
 * Initializes the customer modal's event listeners.
 */
export function initCustomerModalHandler() {
    // Event listeners for customer modal
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', () => {
            console.log('Add Customer button clicked.');
            openCustomerModal();
        });
    }
    if (closeCustomerButton) {
        closeCustomerButton.addEventListener('click', closeCustomerModal);
    }
    // Listen for custom events to open/close
    document.addEventListener('closeCustomerModal', closeCustomerModal);
    document.addEventListener('openCustomerModal', openCustomerModal);

    // Event listener for customer search input
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', (event) => {
            const query = event.target.value;
            console.log(`Customer search input: "${query}"`);
            // This event should be handled by a customer-list component or similar
            document.dispatchEvent(new CustomEvent('searchCustomers', { detail: query }));
        });
    }
}

// Export open/close functions if they need to be called externally
export { openCustomerModal, closeCustomerModal };