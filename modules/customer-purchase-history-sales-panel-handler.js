import { customerPurchaseHistorySalesPanel, toggleCustomerPurchaseHistorySalesPanelBtn } from '../utils/dom-elements.js';
import { CustomerService } from '../services/customer.service.js';

/**
 * Handles the logic for the customer purchase history side panel in the Sales tab.
 */
function toggleCustomerPurchaseHistorySalesPanel() {
    if (!customerPurchaseHistorySalesPanel) {
        console.error('Customer purchase history sales panel element not found.');
        return;
    }
    
    customerPurchaseHistorySalesPanel.classList.toggle('open');
    // The content will be updated by listening to customerSelectedForHistory event
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
 * Initializes event listeners for the customer purchase history panel in the Sales tab.
 */
export function initCustomerPurchaseHistorySalesPanelHandler() {
    if (!toggleCustomerPurchaseHistorySalesPanelBtn || !customerPurchaseHistorySalesPanel) {
        console.error('Customer purchase history sales panel or toggle button not found for initialization.');
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

    // Handle visibility based on active tab
    document.addEventListener('showTab', (e) => {
        const customerPurchaseHistorySalesBookmark = document.getElementById('customer-purchase-history-sales-bookmark');
        if (customerPurchaseHistorySalesBookmark) {
            if (e.detail.tabId === 'sales') { // Only visible on 'sales' tab
                customerPurchaseHistorySalesBookmark.style.display = 'block';
            } else {
                customerPurchaseHistorySalesBookmark.style.display = 'none';
                closeCustomerPurchaseHistorySalesPanel(); // Close panel if tab changes
            }
        }
    });

    // Listen for customer selection to open the panel and update history
    document.addEventListener('customerSelectedForHistory', (e) => {
        const customerId = e.detail;
        const customerPurchaseHistoryComponent = customerPurchaseHistorySalesPanel.querySelector('customer-purchase-history');
        if (customerPurchaseHistoryComponent) {
            if (customerId) {
                const customer = CustomerService.getCustomerById(customerId);
                if (customer) {
                    // Assuming customer-purchase-history component has a method to set customer
                    customerPurchaseHistoryComponent.setCustomer(customer);
                    // Automatically open the panel when a customer is selected
                    if (!customerPurchaseHistorySalesPanel.classList.contains('open')) {
                         toggleCustomerPurchaseHistorySalesPanel();
                    }
                }
            } else {
                // If customerId is null, clear the history and close the panel
                customerPurchaseHistoryComponent.setCustomer(null);
                closeCustomerPurchaseHistorySalesPanel();
            }
        }
    });
}