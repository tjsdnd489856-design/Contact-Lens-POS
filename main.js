import { ProductService } from './services/product.service.js';
import { CustomerService } from './services/customer.service.js';
import { SalesService } from './services/sales.service.js';

import ProductList from './components/product-list.component.js';
import ProductForm from './components/product-form.component.js';
import CustomerList from './components/customer-list.component.js';
import CustomerForm from './components/customer-form.component.js';
import SaleTransaction from './components/sale-transaction.component.js';
import SalesList from './components/sales-list.component.js';
import CustomerPurchaseHistory from './components/customer-purchase-history.component.js';
import BrandProductListModal from './components/brand-product-list-modal.component.js';
import DiscardInventoryModal from './components/discard-inventory-modal.component.js';
import AbnormalInventoryList from './components/abnormal-inventory-list.component.js'; // New Import
import { initializeApp } from './components/app-initializer.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();

    // Get discard inventory button and modal elements
    const discardInventoryBtn = document.getElementById('discard-inventory-btn');
    const discardInventoryModal = document.getElementById('discard-inventory-modal');
    const closeDiscardInventoryModalBtn = document.getElementById('close-discard-inventory-modal');
    const discardInventoryModalComponent = discardInventoryModal.querySelector('discard-inventory-modal');

    // Open discard inventory modal
    discardInventoryBtn.addEventListener('click', () => {
        discardInventoryModalComponent.setProducts(ProductService.getProducts()); // Pass all products
        discardInventoryModal.style.display = 'block';
    });

    // Close discard inventory modal
    closeDiscardInventoryModalBtn.addEventListener('click', () => {
        discardInventoryModal.style.display = 'none';
    });
    document.addEventListener('closeDiscardInventoryModal', () => {
        discardInventoryModal.style.display = 'none';
    });

    // Abnormal Inventory Side Panel Logic
    const abnormalInventoryPanel = document.getElementById('abnormal-inventory-panel');
    const toggleAbnormalInventoryPanelBtn = document.getElementById('toggle-abnormal-inventory-panel');
    const abnormalInventoryListComponent = abnormalInventoryPanel.querySelector('abnormal-inventory-list');
    const abnormalInventoryBookmark = document.getElementById('abnormal-inventory-bookmark'); // Get bookmark element

    // Get other modal elements
    const customerModal = document.getElementById('customer-modal');
    const productModal = document.getElementById('product-modal');
    const brandProductListModal = document.getElementById('brand-product-list-modal');

    if (toggleAbnormalInventoryPanelBtn && abnormalInventoryPanel && abnormalInventoryListComponent && abnormalInventoryBookmark) { // Include bookmark in check
        toggleAbnormalInventoryPanelBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent this click from immediately closing the panel
            abnormalInventoryPanel.classList.add('open');
            abnormalInventoryListComponent.setAbnormalProducts(ProductService.getAbnormalInventory());
        });

        // Close panel when clicking outside
        document.addEventListener('click', (event) => {
            if (abnormalInventoryPanel.classList.contains('open') &&
                !abnormalInventoryPanel.contains(event.target) &&
                !toggleAbnormalInventoryPanelBtn.contains(event.target)) { // Also check if click is on the bookmark button itself
                abnormalInventoryPanel.classList.remove('open');
            }
        });
    } else {
        console.error('Abnormal inventory panel or its related elements not found. Check index.html and main.js.');
    }

    // Close all modals/panels on Escape key press
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (discardInventoryModal.style.display === 'block') {
                discardInventoryModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('closeDiscardInventoryModal')); // Trigger any cleanup
            }
            if (customerModal && customerModal.style.display === 'block') {
                customerModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('clearCustomerForm')); // Assuming this event exists
            }
            if (productModal && productModal.style.display === 'block') {
                productModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('closeProductModal')); // Assuming this event exists
            }
            if (brandProductListModal && brandProductListModal.style.display === 'block') {
                brandProductListModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('closeBrandProductListModal')); // Assuming this event exists
            }
            if (abnormalInventoryPanel.classList.contains('open')) {
                abnormalInventoryPanel.classList.remove('open');
            }
        }
    });

    // Add logic to show/hide abnormal inventory bookmark based on active tab
    document.addEventListener('showTab', (e) => {
        if (abnormalInventoryBookmark) {
            if (e.detail.tabId === 'products') {
                abnormalInventoryBookmark.style.display = 'block';
            } else {
                abnormalInventoryBookmark.style.display = 'none';
                // Also ensure the side panel is closed if the tab changes
                if (abnormalInventoryPanel.classList.contains('open')) {
                    abnormalInventoryPanel.classList.remove('open');
                }
            }
        }
    });

    // Initial state setup for bookmark
    // The initializeApp() in app-initializer.js sets the initial tab to 'customers'
    // so the bookmark's visibility will be correctly handled by the 'showTab' listener.
    // Removed: if (abnormalInventoryBookmark) { abnormalInventoryBookmark.style.display = 'none'; }

});