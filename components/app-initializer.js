import { ProductService } from '../services/product.service.js';
import { CustomerService } from '../services/customer.service.js';
import { SalesService } from '../services/sales.service.js';

export function initializeApp() {
    try {
        console.log('DOMContentLoaded fired: Initializing application.');
        const tabButtons = document.querySelectorAll('.tabs-nav .tab-button');
        const tabContents = document.querySelectorAll('main .tab-content');
        
        // Customer Modal
        const customerModal = document.getElementById('customer-modal');
        const closeCustomerButton = customerModal ? customerModal.querySelector('.close-button') : null;
        const addCustomerBtn = document.getElementById('add-customer-btn');
        const customerSearchInput = document.getElementById('customer-search-input');

        // Product Modal
        const productModal = document.getElementById('product-modal');
        const closeProductButton = productModal ? productModal.querySelector('.close-button') : null;
        const addProductBtn = document.getElementById('add-product-btn');
        const productModalLayout = document.getElementById('product-modal-layout');
        const saveAllProductsBtn = document.getElementById('save-all-products-btn');
        const tempProductListDiv = document.getElementById('temp-product-list');

        // Brand Product List Modal
        const brandProductListModal = document.getElementById('brand-product-list-modal');
        const closeBrandProductListModalElement = document.getElementById('close-brand-product-list-modal');

        // Expiration Warning Modal references removed

        let productsToAdd = [];
        let isEditMode = false;

        if (!customerModal) console.error('Error: customer-modal element not found.');
        if (!closeCustomerButton) console.error('Error: close-button element not found within customer-modal.');
        if (!addCustomerBtn) console.error('Error: add-customer-btn element not found.');
        if (!customerSearchInput) console.error('Error: customer-search-input element not found.');
        
        if (!productModal) console.error('Error: product-modal element not found.');
        if (!closeProductButton) console.error('Error: close-button element not found within product-modal.');
        if (!addProductBtn) console.error('Error: add-product-btn element not found.');
        if (!saveAllProductsBtn) console.error('Error: save-all-products-btn element not found.');
        if (!brandProductListModal) console.error('Error: brand-product-list-modal element not found.');
        if (!closeBrandProductListModalElement) console.error('Error: close-brand-product-list-modal element not found.');
        // Expiration Warning Modal error checks removed


        function showTab(tabId) {
            tabContents.forEach(content => {
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
            tabButtons.forEach(button => {
                if (button.dataset.tab === tabId) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
            console.log(`Tab switched to: ${tabId}`);
        }
        
        // Customer Modal Logic
        function openCustomerModal() {
            if (customerModal) {
                customerModal.style.display = 'block';
                console.log('Customer modal opened.');
            } else {
                console.error('Attempted to open customer modal but element not found.');
            }
        }

        function closeCustomerModal() {
            if (customerModal) {
                customerModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('clearCustomerForm'));
                console.log('Customer modal closed.');
            } else {
                console.error('Attempted to close customer modal but element not found.');
            }
        }

        // Brand Product List Modal Logic
        function openBrandProductListModal(brand) {
            const brandProductListModalComponent = brandProductListModal.querySelector('brand-product-list-modal');
            if (brandProductListModal && brandProductListModalComponent) {
                brandProductListModalComponent.setBrand(brand);
                brandProductListModal.style.display = 'block';
                console.log(`Brand product list modal opened for brand: ${brand}`);
            } else {
                console.error('Attempted to open brand product list modal but element not found.');
            }
        }

        function closeBrandProductListModal() {
            if (brandProductListModal) {
                brandProductListModal.style.display = 'none';
                console.log('Brand product list modal closed.');
            } else {
                console.error('Attempted to close brand product list modal but element not found.');
            }
        }

        // Expiration Warning Modal Logic removed


        // Product Modal Logic
        function renderTempProductList() {
            if (productsToAdd.length === 0) {
                tempProductListDiv.innerHTML = '<p>추가할 제품이 없습니다.</p>';
                return;
            }
            let table = `
                <table>
                    <thead>
                        <tr>
                            <th>바코드</th>
                            <th>브랜드</th>
                            <th>모델명</th>
                            <th>S</th>
                            <th>C</th>
                            <th>AX</th>
                            <th>수량</th>
                            <th>유통기한</th>
                            <th>가격</th>
                            <th>삭제</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productsToAdd.map(p => `
                            <tr>
                                <td>${p.barcode || 'N/A'}</td>
                                <td>${p.brand}</td>
                                <td>${p.model}</td>
                                <td>${p.powerS}</td>
                                <td>${p.powerC}</td>
                                <td>${p.powerAX}</td>
                                <td>${p.quantity}</td>
                                <td>${p.expirationDate}</td>
                                <td>${p.price}</td>
                                <td><button class="remove-temp-product-btn" data-tempid="${p.tempId}">삭제</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            tempProductListDiv.innerHTML = table;

            // Add event listeners to remove buttons
            tempProductListDiv.querySelectorAll('.remove-temp-product-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tempId = parseInt(e.target.dataset.tempid, 10);
                    productsToAdd = productsToAdd.filter(p => p.tempId !== tempId);
                    renderTempProductList();
                });
            });
        }


        function openProductModal(editMode = false) {
            isEditMode = editMode;
            if (productModal) {
                if (isEditMode) {
                    productModalLayout.style.display = 'block';
                    document.getElementById('temp-product-list-container').style.display = 'none';
                    saveAllProductsBtn.style.display = 'none';
                } else {
                    productModalLayout.style.display = 'flex';
                    document.getElementById('temp-product-list-container').style.display = 'block';
                    saveAllProductsBtn.style.display = 'block';
                    productsToAdd = [];
                    renderTempProductList();
                }
                productModal.style.display = 'block';
                console.log('Product modal opened in ' + (isEditMode ? 'edit' : 'add') + ' mode.');
            } else {
                console.error('Attempted to open product modal but element not found.');
            }
        }

        function closeProductModal() {
            if (productModal) {
                productModal.style.display = 'none';
                document.dispatchEvent(new CustomEvent('clearProductForm'));
                console.log('Product modal closed.');
            } else {
                console.error('Attempted to close product modal but element not found.');
            }
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const tabId = button.dataset.tab;
                showTab(tabId);
            });
        });

        // Event listeners for customer modal
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => {
                console.log('Add Customer button clicked.');
                openCustomerModal();
                document.dispatchEvent(new CustomEvent('clearCustomerForm'));
            });
        }
        if (closeCustomerButton) {
            closeCustomerButton.addEventListener('click', closeCustomerModal);
        }
        document.addEventListener('closeCustomerModal', closeCustomerModal);
        document.addEventListener('openCustomerModal', openCustomerModal);
        
        // Event listeners for product modal
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                openProductModal(false); // Open in add mode
                document.dispatchEvent(new CustomEvent('clearProductForm'));
            });
        }

        document.addEventListener('openProductModal', (e) => {
             openProductModal(true); // Open in edit mode
        });


        if (closeProductButton) {
            closeProductButton.addEventListener('click', closeProductModal);
        }
        document.addEventListener('closeProductModal', closeProductModal);

        document.addEventListener('addProductToModalList', (e) => {
            productsToAdd.push(e.detail);
            renderTempProductList();
        });

        saveAllProductsBtn.addEventListener('click', () => {
            if (productsToAdd.length === 0) {
                alert('추가할 제품이 없습니다.');
                return;
            }
            productsToAdd.forEach(p => {
                const { tempId, ...product } = p;
                ProductService.addProduct(product);
            });
            closeProductModal();
        });

        // Event listener for brand product list modal
        document.addEventListener('openBrandProductListModal', (e) => {
            openBrandProductListModal(e.detail);
        });
        if (closeBrandProductListModalElement) {
            closeBrandProductListModalElement.addEventListener('click', closeBrandProductListModal);
        }

        // Expiration Warning Modal event listeners removed


        // Event listener for customer search
        if (customerSearchInput) {
            customerSearchInput.addEventListener('input', (event) => {
                const query = event.target.value;
                console.log(`Customer search input: "${query}"`);
                const filteredCustomers = CustomerService.searchCustomers(query);
                document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers: filteredCustomers, query: query } }));
            });
        }

        // Event listener for tab switching to reset search and purchase history
        document.addEventListener('showTab', (e) => {
            showTab(e.detail.tabId);
            if (e.detail.tabId !== 'customers') {
                document.dispatchEvent(new CustomEvent('customerSelectedForHistory', { detail: null }));
            }
            if (e.detail.tabId === 'customers') {
                if (customerSearchInput) customerSearchInput.value = '';
                document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers: [], query: '' } }));
            }
        });


        // Show the initial active tab (customers tab by default)
        showTab('customers');
        console.log('Initial tab set to customers.');

    } catch (error) {
        console.error('Error during DOMContentLoaded initialization:', error);
    }
}