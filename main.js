import { initializeApp } from './components/app-initializer.js';
import { db } from './modules/firebase-init.js'; // Import Firebase db instance

// Import all Web Components to ensure they are defined
import ProductList from './components/product-list.component.js';
import ProductForm from './components/product-form.component.js';
import CustomerList from './components/customer-list.component.js';
import CustomerForm from './components/customer-form.component.js';
import SaleTransaction from './components/sale-transaction.component.js';
import SalesList from './components/sales-list.component.js';
import CustomerPurchaseHistory from './components/customer-purchase-history.component.js';
import BrandProductListModal from './components/brand-product-list-modal.component.js';
import DiscardInventoryModal from './components/discard-inventory-modal.component.js';
import AbnormalInventoryList from './components/abnormal-inventory-list.component.js';
import UdiScannerModal from './components/udi-scanner-modal.component.js'; // New UDI Scanner Component
import ProductSelectionModal from './components/product-selection-modal.component.js'; // New Product Selection Modal
import { ProductService } from './services/product.service.js'; // Import ProductService


// Import handlers for various modals and global hotkeys
import { initAbnormalInventoryPanelHandler } from './modules/abnormal-inventory-panel-handler.js';
import { initCustomerPurchaseHistorySalesPanelHandler } from './modules/customer-purchase-history-sales-panel-handler.js';
import { initGlobalHotkeys } from './modules/global-hotkeys.js';


document.addEventListener('DOMContentLoaded', () => {
    // Initialize handlers for features that require global setup FIRST to ensure listeners are ready
    initAbnormalInventoryPanelHandler();
    initCustomerPurchaseHistorySalesPanelHandler();

    // Initialize the main application setup (Firebase, tabs, general event listeners)
    initializeApp();
    ProductService.init(); // Initialize ProductService to fetch products
    initGlobalHotkeys(); // Setup global hotkeys like Escape

    // --- Global Event Listeners for Modals that need to be opened from main controls ---
    
    // Discard Inventory Modal
    const discardInventoryBtn = document.getElementById('discard-inventory-btn');
    const discardInventoryModal = document.getElementById('discard-inventory-modal');
    const closeDiscardInventoryModalBtn = document.getElementById('close-discard-inventory-modal');
    
    // Ensure the custom element is defined before querying for it
    customElements.whenDefined('discard-inventory-modal').then(() => {
        const discardInventoryModalComponent = discardInventoryModal ? discardInventoryModal.querySelector('discard-inventory-modal') : null;

        if (discardInventoryBtn && discardInventoryModal && closeDiscardInventoryModalBtn && discardInventoryModalComponent) {
            discardInventoryBtn.addEventListener('click', () => {
                discardInventoryModalComponent.setProducts(ProductService.getProducts()); // Pass all products
                discardInventoryModal.style.display = 'block';
            });

            // Handle external close button click
            closeDiscardInventoryModalBtn.addEventListener('click', () => {
                discardInventoryModalComponent.closeModal(); // Component will dispatch 'closeDiscardInventoryModal'
            });

            // Listen for the close event dispatched by the component itself
            document.addEventListener('closeDiscardInventoryModal', () => {
                discardInventoryModal.style.display = 'none';
            });
            // Handle overlay click to close
            discardInventoryModal.addEventListener('click', (e) => {
                if (e.target === discardInventoryModal) {
                    discardInventoryModalComponent.closeModal(); // Component will dispatch 'closeDiscardInventoryModal'
                }
            });
        } else {
            console.error('Discard Inventory button, modal container, close button, or component not found after custom element defined.');
        }
    });

    // UDI Scanner Modal
    const openUdiScannerBtn = document.getElementById('open-udi-scanner-btn');

    customElements.whenDefined('udi-scanner-modal').then(() => {
        const udiScannerModal = document.getElementById('udi-scanner-modal'); // Now directly refers to the custom element

        if (openUdiScannerBtn && udiScannerModal) {
            openUdiScannerBtn.addEventListener('click', () => {
                udiScannerModal.openModal();
            });

            // Listen for the close event dispatched by the component itself
            document.addEventListener('closeUdiScannerModal', () => {
                // The custom element already hides itself, but we might want to do something else here if needed
            });
        } else {
            console.error('Open UDI Scanner button or udi-scanner-modal component not found after custom element defined.');
        }
    });

    // Product Selection Modal
    customElements.whenDefined('product-selection-modal').then(() => {
        const productSelectionModal = document.getElementById('product-selection-modal'); // Now directly refers to the custom element

        if (productSelectionModal) {
            // Event listener to open the modal (triggered from sales-transaction.component.js usually)
            document.addEventListener('openProductSelectionModal', () => {
                productSelectionModal.openModal();
            });
            // Event listener to close the modal (dispatched by the component itself)
            document.addEventListener('closeProductSelectionModal', () => {
                // The custom element already hides itself, but we might want to do something else here if needed
            });
        } else {
            console.error('Product Selection Modal component not found after custom element defined.');
        }
    });

    // Sales Tab Reset Button
    customElements.whenDefined('sale-transaction-component').then(() => {
        const resetSalesTabBtn = document.getElementById('reset-sales-tab-btn');
        const saleTransactionComponent = document.querySelector('sale-transaction-component');

        if (resetSalesTabBtn && saleTransactionComponent) {
            resetSalesTabBtn.addEventListener('click', () => {
                saleTransactionComponent.reset(); // Call the public reset method on the component
            });
        } else {
            console.error('Reset Sales Tab Button or Sale Transaction Component not found after custom element defined.');
        }
    });
});