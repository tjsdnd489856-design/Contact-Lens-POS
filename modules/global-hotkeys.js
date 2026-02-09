import { closeCustomerModal } from './customer-modal-handler.js';
import { closeProductModal } from './product-modal-handler.js';
import { closeBrandProductListModal } from './brand-product-list-modal-handler.js';
import { closeAbnormalInventoryPanel } from './abnormal-inventory-panel-handler.js';

/**
 * Initializes global keyboard shortcuts, specifically the Escape key handler
 * for closing various modals and panels.
 */
export function initGlobalHotkeys() {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // Attempt to close various modals and panels
            // We need references to the actual modal DOM elements to check their display style
            const discardInventoryModal = document.getElementById('discard-inventory-modal');
            const udiScannerModal = document.getElementById('udi-scanner-modal');
            const customerModal = document.getElementById('customer-modal');
            const productModal = document.getElementById('product-modal');
            const brandProductListModal = document.getElementById('brand-product-list-modal');
            const abnormalInventoryPanel = document.getElementById('abnormal-inventory-panel');

            if (discardInventoryModal && discardInventoryModal.style.display === 'block') {
                discardInventoryModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('closeDiscardInventoryModal'));
            } else if (udiScannerModal && udiScannerModal.style.display === 'block') {
                udiScannerModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('closeUdiScannerModal')); // Dispatch custom event
            } else if (customerModal && customerModal.style.display === 'block') {
                closeCustomerModal(); // Use the dedicated handler
            } else if (productModal && productModal.style.display === 'block') {
                closeProductModal(); // Use the dedicated handler
            } else if (brandProductListModal && brandProductListModal.style.display === 'block') {
                closeBrandProductListModal(); // Use the dedicated handler
            } else if (abnormalInventoryPanel && abnormalInventoryPanel.classList.contains('open')) {
                closeAbnormalInventoryPanel(); // Use the dedicated handler
            }
        }
    });
}