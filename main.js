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
    const closeAbnormalInventoryPanelBtn = abnormalInventoryPanel.querySelector('.side-panel-close-button');
    const abnormalInventoryListComponent = abnormalInventoryPanel.querySelector('abnormal-inventory-list');

    if (toggleAbnormalInventoryPanelBtn && abnormalInventoryPanel && closeAbnormalInventoryPanelBtn && abnormalInventoryListComponent) {
        toggleAbnormalInventoryPanelBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent this click from immediately closing the panel
            abnormalInventoryPanel.classList.add('open');
            abnormalInventoryListComponent.setAbnormalProducts(ProductService.getAbnormalInventory());
        });

        closeAbnormalInventoryPanelBtn.addEventListener('click', () => {
            abnormalInventoryPanel.classList.remove('open');
        });

        // Close panel when clicking outside
        document.addEventListener('click', (event) => {
            if (abnormalInventoryPanel.classList.contains('open') &&
                !abnormalInventoryPanel.contains(event.target) &&
                !toggleAbnormalInventoryPanelBtn.contains(event.target)) {
                abnormalInventoryPanel.classList.remove('open');
            }
        });
    } else {
        console.error('Abnormal inventory panel elements not found. Check index.html and main.js.');
    }

});