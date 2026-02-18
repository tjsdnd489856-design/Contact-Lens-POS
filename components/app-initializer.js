import { CustomerService } from '../services/customer.service.js';
import { ProductService } from '../services/product.service.js'; // Import ProductService
import { SalesService } from '../services/sales.service.js'; // Import SalesService
// import { initializeFirebase } from '../modules/firebase-init.js'; // Firebase is initialized globally via CDN and its modules handle services
import { initTabManager } from '../modules/tab-manager.js';
import { validateDOMElements, tabButtons, tabContents, customerSearchInput } from '../utils/dom-elements.js';
import { initProductTempListManager } from '../modules/product-temp-list-manager.js';
import { initCustomerModalHandler } from '../modules/customer-modal-handler.js';
import { initProductModalHandler, closeProductModal } from '../modules/product-modal-handler.js';
import { initBrandProductListModalHandler } from '../modules/brand-product-list-modal-handler.js';

/**
 * Initializes the entire application by setting up Firebase, DOM elements,
 * tab management, and various modal handlers.
 */
export function initializeApp() {
    try {
        console.log('DOMContentLoaded fired: Initializing application.');

        // 1. Initialize Firebase services and data stores
        CustomerService.init(); // Initialize CustomerService with Firestore listener
        ProductService.init(); // Initialize ProductService with Firestore listener
        SalesService.init();   // Initialize SalesService with Firestore listener
        // initializeFirebase(); // No longer needed, Firebase app is initialized via global script and CustomerService uses its own init

        // 2. Validate essential DOM elements
        validateDOMElements();
        
        // 3. Initialize Tab Management
        initTabManager(tabButtons, tabContents);

        // 4. Initialize Modal Handlers and related managers
        initCustomerModalHandler();
        initProductTempListManager(closeProductModal); // Pass the close callback
        initProductModalHandler();
        initBrandProductListModalHandler();
        
        // 5. Setup global event listeners
        _setupGlobalEventListeners();

        console.log('Application initialization complete.');

    } catch (error) {
        console.error('Error during application initialization:', error);
    }
}

/**
 * Sets up global event listeners that are not specific to a single module.
 * @private
 */
function _setupGlobalEventListeners() {
    // Event listener for tab switching to reset search and purchase history views
    document.addEventListener('showTab', (e) => {
        // Handle tab-specific resets
        if (e.detail.tabId !== 'customers') {

        }
        if (e.detail.tabId === 'customers') {
            if (customerSearchInput) customerSearchInput.value = '';
            // Dispatch a generic customersUpdated event to clear/reset list
            document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers: [], query: '' } }));
        }
    });
}
