import { saveAllProductsBtn, tempProductListDiv, tempProductListContainer } from '../utils/dom-elements.js';
import { ProductService } from '../services/product.service.js';

let productsToAdd = [];
let nextTempId = 1; // Used to uniquely identify temporary products before they are saved

/**
 * Renders the temporary product list table in the product modal.
 */
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
                        <td>${p.brand || 'N/A'}</td>
                        <td>${p.model || 'N/A'}</td>
                        <td>${p.powerS || 'N/A'}</td>
                        <td>${p.powerC || 'N/A'}</td>
                        <td>${p.powerAX || 'N/A'}</td>
                        <td>${p.quantity || 'N/A'}</td>
                        <td>${p.expirationDate || 'N/A'}</td>
                        <td>${p.price || 'N/A'}</td>
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

/**
 * Handles saving all temporary products to the ProductService.
 * @param {Function} closeProductModal - Callback to close the product modal after saving.
 */
function handleSaveAllProducts(closeProductModal) {
    if (productsToAdd.length === 0) {
        alert('추가할 제품이 없습니다.');
        return;
    }
    productsToAdd.forEach(p => {
        const { tempId, ...product } = p; // Destructure to remove tempId
        ProductService.addProduct(product);
    });
    closeProductModal();
    productsToAdd = []; // Clear list after saving
    nextTempId = 1; // Reset temp ID counter
}

/**
 * Initializes the product temporary list manager.
 * Sets up event listeners for adding and saving temporary products.
 */
export function initProductTempListManager(closeProductModalCallback) {
    // Event listener for adding product to modal list (from product-form component)
    document.addEventListener('addProductToModalList', (e) => {
        productsToAdd.push({ ...e.detail, tempId: nextTempId++ });
        renderTempProductList();
    });

    // Event listener for saving all temporary products
    if (saveAllProductsBtn) {
        saveAllProductsBtn.addEventListener('click', () => handleSaveAllProducts(closeProductModalCallback));
    }
}

/**
 * Controls the visibility and mode of the temporary product list section.
 * @param {boolean} isEditMode - True if the product modal is in edit mode, false for add mode.
 */
export function toggleProductTempListVisibility(isEditMode) {
    if (tempProductListContainer && saveAllProductsBtn) {
        if (isEditMode) {
            tempProductListContainer.style.display = 'none';
            saveAllProductsBtn.style.display = 'none';
        } else {
            tempProductListContainer.style.display = 'block';
            saveAllProductsBtn.style.display = 'block';
            productsToAdd = []; // Clear list when entering add mode
            nextTempId = 1;
            renderTempProductList();
        }
    }
}