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

// Import handlers for various modals and global hotkeys
import { initAbnormalInventoryPanelHandler } from './modules/abnormal-inventory-panel-handler.js';
import { initGlobalHotkeys } from './modules/global-hotkeys.js';


document.addEventListener('DOMContentLoaded', () => {
    // Initialize the main application setup (Firebase, tabs, general event listeners)
    initializeApp();

    // Initialize handlers for features that require global setup
    initAbnormalInventoryPanelHandler();
    initGlobalHotkeys(); // Setup global hotkeys like Escape

    // --- Global Event Listeners for Modals that need to be opened from main controls ---
    
    // Discard Inventory Modal
    const discardInventoryBtn = document.getElementById('discard-inventory-btn');
    const discardInventoryModal = document.getElementById('discard-inventory-modal'); // Assuming this is the div wrapping the component
    const discardInventoryModalComponent = discardInventoryModal ? discardInventoryModal.querySelector('discard-inventory-modal') : null;

    if (discardInventoryBtn && discardInventoryModalComponent) {
        discardInventoryBtn.addEventListener('click', () => {
            // ProductService is imported in ProductList, but might need to be imported here too if its methods are called directly
            // For now, assume ProductService is globally accessible for this call due to Web Component scope
            discardInventoryModalComponent.setProducts(ProductService.getProducts()); // Pass all products
            discardInventoryModal.style.display = 'block';
        });
    } else {
        console.error('Discard Inventory button or modal component not found.');
    }

    // UDI Scanner Modal
    const openUdiScannerBtn = document.getElementById('open-udi-scanner-btn');
    const udiScannerModal = document.getElementById('udi-scanner-modal'); // Assuming this is the div wrapping the component
    const closeUdiScannerModalBtn = document.getElementById('close-udi-scanner-modal'); // Get the close button

    if (openUdiScannerBtn && udiScannerModal && closeUdiScannerModalBtn) {
        openUdiScannerBtn.addEventListener('click', () => {
            udiScannerModal.style.display = 'block';
            document.dispatchEvent(new CustomEvent('openUdiScannerModal'));
        });
        closeUdiScannerModalBtn.addEventListener('click', () => { // Attach listener to the 'x' button
            udiScannerModal.style.display = 'none';
            document.dispatchEvent(new CustomEvent('closeUdiScannerModal'));
        });
    } else {
        console.error('Open UDI Scanner button, modal, or close button not found.');
    }
});