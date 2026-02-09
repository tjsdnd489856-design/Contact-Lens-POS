import { ProductService } from '../services/product.service.js';
import { abnormalInventoryPanel, toggleAbnormalInventoryPanelBtn } from '../utils/dom-elements.js';

/**
 * Handles the logic for the abnormal inventory side panel.
 */
function toggleAbnormalInventoryPanel() {
    if (!abnormalInventoryPanel) {
        console.error('Abnormal inventory panel element not found.');
        return;
    }
    
    abnormalInventoryPanel.classList.toggle('open');
    if (abnormalInventoryPanel.classList.contains('open')) {
        const abnormalInventoryListComponent = abnormalInventoryPanel.querySelector('abnormal-inventory-list');
        if (abnormalInventoryListComponent) {
            abnormalInventoryListComponent.setAbnormalProducts(ProductService.getAbnormalInventory());
        }
    }
}

/**
 * Closes the abnormal inventory side panel.
 */
export function closeAbnormalInventoryPanel() {
    if (abnormalInventoryPanel && abnormalInventoryPanel.classList.contains('open')) {
        abnormalInventoryPanel.classList.remove('open');
    }
}

/**
 * Initializes event listeners for the abnormal inventory panel.
 */
export function initAbnormalInventoryPanelHandler() {
    if (!toggleAbnormalInventoryPanelBtn || !abnormalInventoryPanel) {
        console.error('Abnormal inventory panel or toggle button not found for initialization.');
        return;
    }

    // Toggle button click listener
    toggleAbnormalInventoryPanelBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent this click from immediately closing the panel if clicking inside
        toggleAbnormalInventoryPanel();
    });

    // Close panel when clicking outside of it
    document.addEventListener('click', (event) => {
        if (abnormalInventoryPanel.classList.contains('open') &&
            !abnormalInventoryPanel.contains(event.target) &&
            !toggleAbnormalInventoryPanelBtn.contains(event.target)) {
            closeAbnormalInventoryPanel();
        }
    });

    // Handle visibility based on active tab
    document.addEventListener('showTab', (e) => {
        const abnormalInventoryBookmark = document.getElementById('abnormal-inventory-bookmark'); // This element is in index.html
        if (abnormalInventoryBookmark) {
            if (e.detail.tabId === 'products') {
                abnormalInventoryBookmark.style.display = 'block';
            } else {
                abnormalInventoryBookmark.style.display = 'none';
                closeAbnormalInventoryPanel(); // Close panel if tab changes
            }
        }
    });
}
