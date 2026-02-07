import { ProductService } from './services/product.service.js';
import { CustomerService } from './services/customer.service.js';
import { SalesService } from './services/sales.service.js';
import { parseUdiBarcode } from './utils/udi-parser.js';

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

    // UDI Scanner Modal Elements
    const udiScannerModal = document.getElementById('udi-scanner-modal');
    const openUdiScannerBtn = document.getElementById('open-udi-scanner-btn');
    const closeUdiScannerModalBtn = document.getElementById('close-udi-scanner-modal');
    const udiInput = document.getElementById('udi-input');
    const lookupUdiBtn = document.getElementById('lookup-udi-btn');
    const udiProductDetailsDiv = document.getElementById('udi-product-details');
    const udiBrandSpan = document.getElementById('udi-brand');
    const udiModelSpan = document.getElementById('udi-model');
    const udiGtinSpan = document.getElementById('udi-gtin');
    const udiExpirationDateSpan = document.getElementById('udi-expiration-date');
    const udiLotNumberSpan = document.getElementById('udi-lot-number');
    const udiSerialNumberSpan = document.getElementById('udi-serial-number');
    const udiLensTypeSpan = document.getElementById('udi-lens-type');
    const udiWearTypeSpan = document.getElementById('udi-wear-type');
    const udiQuantityInput = document.getElementById('udi-quantity');
    const udiPriceInput = document.getElementById('udi-price');
    const udiStatusMessage = document.getElementById('udi-status-message');
    const addUdiProductBtn = document.getElementById('add-udi-product-btn');

    // Open discard inventory modal
    discardInventoryBtn.addEventListener('click', () => {
        discardInventoryModalComponent.setProducts(ProductService.getProducts()); // Pass all products
        discardInventoryModal.style.display = 'block';
    });

    // Open UDI Scanner modal
    if (openUdiScannerBtn) {
      openUdiScannerBtn.addEventListener('click', () => {
        udiScannerModal.style.display = 'block';
        udiInput.value = ''; // Clear previous input
        udiInput.focus();
        clearUdiProductDetails(); // Clear any previously displayed product details
      });
    }

    // Close discard inventory modal
    closeDiscardInventoryModalBtn.addEventListener('click', () => {
        discardInventoryModal.style.display = 'none';
    });

    // Close UDI Scanner modal
    if (closeUdiScannerModalBtn) {
      closeUdiScannerModalBtn.addEventListener('click', () => {
        udiScannerModal.style.display = 'none';
        clearUdiProductDetails();
      });
    }

    function clearUdiProductDetails() {
        udiBrandSpan.textContent = '';
        udiModelSpan.textContent = '';
        udiGtinSpan.textContent = '';
        udiExpirationDateSpan.textContent = '';
        udiLotNumberSpan.textContent = '';
        udiSerialNumberSpan.textContent = '';
        udiLensTypeSpan.textContent = '';
        udiWearTypeSpan.textContent = '';
        udiQuantityInput.value = '1';
        udiPriceInput.value = '0.00';
        udiStatusMessage.textContent = '';
        addUdiProductBtn.disabled = true;
    }

    // Lookup UDI functionality
    if (lookupUdiBtn) {
      lookupUdiBtn.addEventListener('click', async () => {
        udiStatusMessage.textContent = '';
        addUdiProductBtn.disabled = true;
        clearUdiProductDetails(); // Clear previous details before new lookup

        const udiString = udiInput.value.trim();
        if (!udiString) {
          udiStatusMessage.textContent = 'UDI 바코드를 입력해주세요.';
          return;
        }

        try {
          const parsedUdi = parseUdiBarcode(udiString);
          console.log('Parsed UDI:', parsedUdi);

          const gtin = parsedUdi.gtin;
          if (!gtin) {
            udiStatusMessage.textContent = '유효한 GTIN (UDI-DI)을 UDI 바코드에서 찾을 수 없습니다.';
            return;
          }

          udiStatusMessage.textContent = '제품 정보를 조회 중입니다...';
          const externalProduct = await ProductService.fetchProductDetailsFromExternalApi(gtin);
          console.log('External Product:', externalProduct);

          if (externalProduct && externalProduct.productFound) {
            udiBrandSpan.textContent = externalProduct.brand;
            udiModelSpan.textContent = externalProduct.model;
            udiGtinSpan.textContent = externalProduct.gtin;
            udiLensTypeSpan.textContent = externalProduct.lensType;
            udiWearTypeSpan.textContent = externalProduct.wearType;

            // Fill expiration, lot, serial from parsed UDI if available, otherwise from external (if provided) or N/A
            udiExpirationDateSpan.textContent = parsedUdi.expirationDate || externalProduct.expirationDate || 'N/A';
            udiLotNumberSpan.textContent = parsedUdi.lotNumber || externalProduct.lotNumber || 'N/A';
            udiSerialNumberSpan.textContent = parsedUdi.serialNumber || externalProduct.serialNumber || 'N/A';

            udiQuantityInput.value = externalProduct.quantity || 1;
            udiPriceInput.value = externalProduct.price || 0.00;

            udiStatusMessage.textContent = '';
            addUdiProductBtn.disabled = false;
          } else {
            udiStatusMessage.textContent = externalProduct?.message || 'UDI-DI에 해당하는 제품 정보를 찾을 수 없습니다.';
          }
        } catch (error) {
          console.error('UDI 조회 중 오류 발생:', error);
          udiStatusMessage.textContent = `UDI 조회 중 오류 발생: ${error.message}`;
        }
      });
    }

    // Add UDI product to inventory functionality
    if (addUdiProductBtn) {
        addUdiProductBtn.addEventListener('click', () => {
            const newProduct = {
                brand: udiBrandSpan.textContent,
                model: udiModelSpan.textContent,
                lensType: udiLensTypeSpan.textContent,
                wearType: udiWearTypeSpan.textContent,
                // powerS, powerC, powerAX are not provided by the external API via UDI-DI
                // and are likely specific to individual lens prescriptions.
                // We'll set them to default/placeholder values.
                powerS: 0,
                powerC: 0,
                powerAX: 0,
                quantity: parseInt(udiQuantityInput.value, 10),
                expirationDate: udiExpirationDateSpan.textContent,
                price: parseFloat(udiPriceInput.value),
                barcode: udiGtinSpan.textContent, // Use GTIN as primary barcode
                gtin: udiGtinSpan.textContent,
                lotNumber: udiLotNumberSpan.textContent,
                serialNumber: udiSerialNumberSpan.textContent,
            };

            ProductService.addProduct(newProduct);
            alert('제품이 재고에 추가되었습니다!');
            udiScannerModal.style.display = 'none';
            clearUdiProductDetails();
        });
    }

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

    // Get product form instance for focusing
    const productForm = productModal.querySelector('product-form');


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

    // Open product modal
    document.getElementById('add-product-btn').addEventListener('click', () => {
        productModal.style.display = 'block';
        productForm.focusBarcodeInput(); // Focus barcode after opening modal
    });


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
            if (udiScannerModal.style.display === 'block') {
                udiScannerModal.style.display = 'none';
                clearUdiProductDetails();
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