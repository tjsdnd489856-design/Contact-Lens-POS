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
export const tempProductListContainer = document.getElementById('temp-product-list-container');

// Brand Product List Modal Elements
export const brandProductListModal = document.getElementById('brand-product-list-modal');
export const closeBrandProductListModalElement = document.getElementById('close-brand-product-list-modal');

// Discard Inventory Modal Elements
export const discardInventoryModal = document.getElementById('discard-inventory-modal');
export const closeDiscardInventoryModalBtn = document.getElementById('close-discard-inventory-modal');

// UDI Scanner Modal Elements
export const udiScannerModal = document.getElementById('udi-scanner-modal');
export const openUdiScannerBtn = document.getElementById('open-udi-scanner-btn'); // Added for main.js

// Customer Purchase History Panel Elements
export const customerPurchaseHistoryPanel = document.getElementById('customer-purchase-history-panel');
export const toggleCustomerPurchaseHistoryPanelBtn = document.getElementById('toggle-customer-purchase-history-panel');

// Abnormal Inventory Panel Elements
export const abnormalInventoryPanel = document.getElementById('abnormal-inventory-panel');
export const toggleAbnormalInventoryPanelBtn = document.getElementById('toggle-abnormal-inventory-panel');


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
    if (!discardInventoryModal) console.error('Error: discard-inventory-modal element not found.');
    if (!closeDiscardInventoryModalBtn) console.error('Error: close-discard-inventory-modal button not found.');
    if (!udiScannerModal) console.error('Error: udi-scanner-modal element not found.');
    if (!openUdiScannerBtn) console.error('Error: open-udi-scanner-btn element not found.');
    if (!abnormalInventoryPanel) console.error('Error: abnormal-inventory-panel element not found.');
    if (!toggleAbnormalInventoryPanelBtn) console.error('Error: toggle-abnormal-inventory-panel button not found.');
    if (!customerPurchaseHistoryPanel) console.error('Error: customer-purchase-history-panel element not found.');
    if (!toggleCustomerPurchaseHistoryPanelBtn) console.error('Error: toggle-customer-purchase-history-panel button not found.');
}