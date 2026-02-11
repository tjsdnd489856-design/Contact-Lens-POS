import { customerPurchaseHistoryPanel, toggleCustomerPurchaseHistoryPanelBtn } from '../utils/dom-elements.js';

/**
 * Handles the logic for the customer purchase history side panel.
 */
function toggleCustomerPurchaseHistoryPanel() {
    if (!customerPurchaseHistoryPanel) {
        console.error('Customer purchase history panel element not found.');
        return;
    }
    
    customerPurchaseHistoryPanel.classList.toggle('open');
    // No need to update content here, as it's driven by customer selection
}

/**
 * Closes the customer purchase history side panel.
 */
export function closeCustomerPurchaseHistoryPanel() {
    if (customerPurchaseHistoryPanel && customerPurchaseHistoryPanel.classList.contains('open')) {
        customerPurchaseHistoryPanel.classList.remove('open');
    }
}

/**
 * Initializes event listeners for the customer purchase history panel.
 */
export function initCustomerPurchaseHistoryPanelHandler() {
    if (!toggleCustomerPurchaseHistoryPanelBtn || !customerPurchaseHistoryPanel) {
        console.error('Customer purchase history panel or toggle button not found for initialization.');
        return;
    }

    // Ensure the panel is closed on initialization
    closeCustomerPurchaseHistoryPanel();

    // Toggle button click listener
    toggleCustomerPurchaseHistoryPanelBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent this click from immediately closing the panel if clicking inside
        toggleCustomerPurchaseHistoryPanel();
    });

    // Close panel when clicking outside of it
    document.addEventListener('click', (event) => {
        if (customerPurchaseHistoryPanel.classList.contains('open') &&
            !customerPurchaseHistoryPanel.contains(event.target) &&
            !toggleCustomerPurchaseHistoryPanelBtn.contains(event.target)) {
            closeCustomerPurchaseHistoryPanel();
        }
    });

    // Handle visibility based on active tab
    document.addEventListener('showTab', (e) => {
        const customerPurchaseHistoryBookmark = document.getElementById('customer-purchase-history-bookmark');
        if (customerPurchaseHistoryBookmark) {
            if (e.detail.tabId === 'sales') { // Only visible on 'sales' tab
                customerPurchaseHistoryBookmark.style.display = 'block';
            } else {
                customerPurchaseHistoryBookmark.style.display = 'none';
                closeCustomerPurchaseHistoryPanel(); // Close panel if tab changes
            }
        }
    });
}
