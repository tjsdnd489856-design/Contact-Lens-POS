/**
 * Utility module for centralizing access to key DOM elements.
 * This helps reduce repetitive DOM queries and makes element access more consistent.
 */

// Tab Elements
export const tabButtons = document.querySelectorAll('.tabs-nav .tab-button');
export const tabContents = document.querySelectorAll('main .tab-content');

// Customer Modal Elements
export const customerModal = document.getElementById('customer-modal');
export const closeCustomerButton = customerModal ? customerModal.querySelector('.close-button') : null;
export const addCustomerBtn = document.getElementById('add-customer-btn');
export const customerSearchInput = document.getElementById('customer-search-input');

// Product Modal Elements
export const productModal = document.getElementById('product-modal');
export const closeProductButton = productModal ? productModal.querySelector('.close-button') : null;
export const addProductBtn = document.getElementById('add-product-btn');
export const productModalLayout = document.getElementById('product-modal-layout');
export const saveAllProductsBtn = document.getElementById('save-all-products-btn');
export const tempProductListDiv = document.getElementById('temp-product-list');
export const tempProductListContainer = document.getElementById('temp-product-list-container'); // Added for consistency

// Brand Product List Modal Elements
export const brandProductListModal = document.getElementById('brand-product-list-modal');
export const closeBrandProductListModalElement = document.getElementById('close-brand-product-list-modal');

/**
 * Validates if all essential DOM elements are present.
 * Logs an error for any missing critical elements.
 */
export function validateDOMElements() {
    if (!customerModal) console.error('Error: customer-modal element not found.');
    if (!closeCustomerButton) console.error('Error: close-button element not found within customer-modal.');
    if (!addCustomerBtn) console.error('Error: add-customer-btn element not found.');
    if (!customerSearchInput) console.error('Error: customer-search-input element not found.');
    
    if (!productModal) console.error('Error: product-modal element not found.');
    if (!closeProductButton) console.error('Error: close-button element not found within product-modal.');
    if (!addProductBtn) console.error('Error: add-product-btn element not found.');
    if (!saveAllProductsBtn) console.error('Error: save-all-products-btn element not found.');
    if (!brandProductListModal) console.error('Error: brand-product-list-modal element not found.');
    if (!closeBrandProductListModalElement) console.error('Error: close-brand-product-list-modal element not found.');
    if (!tempProductListContainer) console.error('Error: temp-product-list-container element not found.');
    if (!tempProductListDiv) console.error('Error: temp-product-list element not found.');
}
