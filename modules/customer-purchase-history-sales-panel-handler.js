import { customerPurchaseHistorySalesPanel, toggleCustomerPurchaseHistorySalesPanelBtn } from '../utils/dom-elements.js';

let _customerHistoryComponent = null;
let _lastSelectedCustomerId = null; // To persist the customer selection across tab changes

/**
 * Handles the logic for the customer purchase history side panel in the Sales tab.
 */
function toggleCustomerPurchaseHistorySalesPanel() {
    if (!customerPurchaseHistorySalesPanel) {
        console.error('Customer purchase history sales panel element not found.');
        return;
    }
    
    const isOpen = customerPurchaseHistorySalesPanel.classList.toggle('open');
    if (isOpen && _customerHistoryComponent && _lastSelectedCustomerId !== null) {
        // Ensure the history component displays the last selected customer when panel opens
        _customerHistoryComponent.setCustomerId(_lastSelectedCustomerId);
    }
}

/**
 * Closes the customer purchase history side panel in the Sales tab.
 */
export function closeCustomerPurchaseHistorySalesPanel() {
    if (customerPurchaseHistorySalesPanel && customerPurchaseHistorySalesPanel.classList.contains('open')) {
        customerPurchaseHistorySalesPanel.classList.remove('open');
    }
}

/**
 * Handles the 'salesCustomerSelected' event to update the customer history component.
 * @param {CustomEvent} e - The event containing the customer ID.
 */
function handleSalesCustomerSelected(e) {
    _lastSelectedCustomerId = e.detail; // Store the ID
    if (_customerHistoryComponent) {
        _customerHistoryComponent.setCustomerId(_lastSelectedCustomerId);
    }
}

/**
 * Initializes event listeners for the customer purchase history panel in the Sales tab.
 */
export function initCustomerPurchaseHistorySalesPanelHandler() {
    if (!toggleCustomerPurchaseHistorySalesPanelBtn || !customerPurchaseHistorySalesPanel) {
        console.error('Customer purchase history sales panel or toggle button not found for initialization.');
        return;
    }

    _customerHistoryComponent = customerPurchaseHistorySalesPanel.querySelector('customer-purchase-history');
    if (!_customerHistoryComponent) {
        console.error('Customer purchase history component not found inside sales panel.');
        return;
    }

    // Ensure the panel is closed on initialization
    closeCustomerPurchaseHistorySalesPanel();

    // Toggle button click listener
    toggleCustomerPurchaseHistorySalesPanelBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent this click from immediately closing the panel if clicking inside
        toggleCustomerPurchaseHistorySalesPanel();
    });

    // Close panel when clicking outside of it
    document.addEventListener('click', (event) => {
        if (customerPurchaseHistorySalesPanel.classList.contains('open') &&
            !customerPurchaseHistorySalesPanel.contains(event.target) &&
            !toggleCustomerPurchaseHistorySalesPanelBtn.contains(event.target)) {
            closeCustomerPurchaseHistorySalesPanel();
        }
    });

    // Listen for the new sales-specific customer selection event
    document.addEventListener('salesCustomerSelected', handleSalesCustomerSelected);

    // Handle visibility based on active tab
    document.addEventListener('showTab', (e) => {
        const customerPurchaseHistorySalesBookmark = document.getElementById('customer-purchase-history-sales-bookmark');
        if (customerPurchaseHistorySalesBookmark) {
            if (e.detail.tabId === 'sales') { // Only visible on 'sales' tab
                customerPurchaseHistorySalesBookmark.style.display = 'block';
                // If the sales tab becomes active and a customer was previously selected,
                // ensure the history component is updated.
                if (_customerHistoryComponent && _lastSelectedCustomerId !== null) {
                    _customerHistoryComponent.setCustomerId(_lastSelectedCustomerId);
                }
            } else {
                customerPurchaseHistorySalesBookmark.style.display = 'none';
                closeCustomerPurchaseHistorySalesPanel(); // Close panel if tab changes
            }
        }
    });
}
