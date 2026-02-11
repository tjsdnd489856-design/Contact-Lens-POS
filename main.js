import { initializeApp } from './components/app-initializer.js';

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
    initGlobalHotkeys(); // Setup global hotkeys like Escape

    // --- Global Event Listeners for Modals that need to be opened from main controls ---
    
    // Discard Inventory Modal
    const discardInventoryBtn = document.getElementById('discard-inventory-btn');
    const discardInventoryModal = document.getElementById('discard-inventory-modal');
    const closeDiscardInventoryModalBtn = document.getElementById('close-discard-inventory-modal');
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
        console.error('Discard Inventory button, modal container, close button, or component not found.');
    }

    // UDI Scanner Modal
    const openUdiScannerBtn = document.getElementById('open-udi-scanner-btn');
    const udiScannerModal = document.getElementById('udi-scanner-modal');
    const closeUdiScannerModalBtn = document.getElementById('close-udi-scanner-modal');
    const udiScannerModalComponent = udiScannerModal ? udiScannerModal.querySelector('udi-scanner-modal') : null;

    if (openUdiScannerBtn && udiScannerModal && closeUdiScannerModalBtn && udiScannerModalComponent) {
        openUdiScannerBtn.addEventListener('click', () => {
            udiScannerModalComponent.openModal();
            udiScannerModal.style.display = 'block';
        });
        closeUdiScannerModalBtn.addEventListener('click', () => {
            udiScannerModalComponent.closeModal();
        });
        // Listen for the close event dispatched by the component itself
        document.addEventListener('closeUdiScannerModal', () => {
            udiScannerModal.style.display = 'none';
        });
        // Handle overlay click to close
        udiScannerModal.addEventListener('click', (e) => {
            if (e.target === udiScannerModal) {
                udiScannerModalComponent.closeModal();
            }
        });
    } else {
        console.error('Open UDI Scanner button, modal, close button, or component not found.');
    }

    // Product Selection Modal
    const productSelectionModalContainer = document.getElementById('product-selection-modal');
    const productSelectionModalComponent = productSelectionModalContainer ? productSelectionModalContainer.querySelector('product-selection-modal') : null;

    if (productSelectionModalContainer && productSelectionModalComponent) {
        document.addEventListener('openProductSelectionModal', () => {
            productSelectionModalContainer.style.display = 'block';
            productSelectionModalComponent.openModal();
        });
        // Listen for the close event dispatched by the component
        document.addEventListener('closeProductSelectionModal', () => {
            productSelectionModalContainer.style.display = 'none';
        });
        // Handle overlay click to close
        productSelectionModalContainer.addEventListener('click', (e) => {
            // Close if clicking on the overlay itself (not the modal content)
            if (e.target === productSelectionModalContainer) {
                productSelectionModalComponent.closeModal(); // Component will dispatch 'closeProductSelectionModal'
            }
        });

    } else {
        console.error('Product Selection Modal container or component not found.');
    }
});