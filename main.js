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
// import ExpirationWarningModal from './components/expiration-warning-modal.component.js'; // Removed import
import { initializeApp } from './components/app-initializer.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});