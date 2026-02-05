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
});