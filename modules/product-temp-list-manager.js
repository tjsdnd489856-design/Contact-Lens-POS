import { saveAllProductsBtn, tempProductListDiv, tempProductListContainer } from '../utils/dom-elements.js';
import { ProductService } from '../services/product.service.js';

let productsToAdd = [];
let nextTempId = 1; // Used to uniquely identify temporary products before they are saved

/**
 * Generates a set of power variants for a new product based on the base product's details.
 * Ensures the manually entered variant is included with its quantity, and other generated variants
 * have quantity 0.
 * @param {Object} baseProduct - The product object received from the form (manually entered variant).
 * @returns {Array<Object>} An array of product variants.
 */
function generatePowerVariants(baseProduct) {
    const variants = [];
    const manuallyEnteredS = baseProduct.powerS;
    const manuallyEnteredC = baseProduct.powerC;
    const manuallyEnteredAX = baseProduct.powerAX;
    const manuallyEnteredQuantity = baseProduct.quantity;

    // Map to keep track of unique variants by S_C_AX key, prioritizing manually entered one
    const uniqueVariantsMap = new Map();

    // Add manually entered variant first
    // Use a key to detect potential overlaps with generated ones later
    const manuallyEnteredKey = `${manuallyEnteredS}_${manuallyEnteredC}_${manuallyEnteredAX}`;
    uniqueVariantsMap.set(manuallyEnteredKey, { ...baseProduct });

    // Generate S values from 0 to -8.00 in steps of -0.25
    for (let s = 0; s >= -8.00; s -= 0.25) {
        const generatedS = parseFloat(s.toFixed(2)); // To handle floating point precision
        const generatedC = 0; // C value unified to 0
        const generatedAX = null; // AX value to null for generated

        const generatedKey = `${generatedS}_${generatedC}_${generatedAX}`;

        // If this generated variant is not the manually entered one, or if it is but the manually entered
        // one has quantity 0 (which shouldn't happen, but as a safeguard), add it.
        // We ensure that the manually entered variant (with its quantity) is always preserved.
        if (!uniqueVariantsMap.has(generatedKey)) {
            uniqueVariantsMap.set(generatedKey, {
                ...baseProduct, // Copy other details like brand, model, price, expirationDate, lensType, wearType
                powerS: generatedS,
                powerC: generatedC,
                powerAX: generatedAX,
                quantity: 0 // Default quantity for generated variants is 0
            });
        }
    }

    // Ensure the manually entered variant (if its key clashed with a generated 0-quantity one) is prioritized
    // This handles cases where the user specifically enters a 0 quantity for a variant, and we generated it.
    // If user entered quantity for generated S,C,AX, it should be kept.
    if (uniqueVariantsMap.has(manuallyEnteredKey)) {
        const existing = uniqueVariantsMap.get(manuallyEnteredKey);
        // If the variant that maps to the manually entered key has a quantity of 0 (meaning it was a generated one)
        // AND the user actually specified a quantity for it, then update it.
        if (existing.quantity === 0 && manuallyEnteredQuantity > 0) {
             uniqueVariantsMap.set(manuallyEnteredKey, { ...baseProduct, quantity: manuallyEnteredQuantity });
        }
    }


    return Array.from(uniqueVariantsMap.values());
}


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
                        <td>${p.brand || 'N/A'}</td>
                        <td>${p.model || 'N/A'}</td>
                        <td>${(p.powerS !== null && p.powerS !== undefined) ? (p.powerS > 0 ? '+' : '') + p.powerS.toFixed(2) : 'N/A'}</td>
                        <td>${(p.powerC !== null && p.powerC !== undefined) ? (p.powerC > 0 ? '+' : '') + p.powerC.toFixed(2) : 'N/A'}</td>
                        <td>${p.powerAX !== null ? p.powerAX : 'N/A'}</td>
                        <td>${p.quantity || '0'}</td>
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
        const baseProduct = e.detail;
        
        // This event should only be for adding *new* products to the temp list.
        // If the product has an ID, it implies it's an existing product being edited,
        // and we should not generate new variants for it.
        if (baseProduct.id) {
            // For existing products, just add the specific variant
            // The form should ideally send only one variant at a time for existing products
            // when in edit mode.
            productsToAdd.push({ ...baseProduct, tempId: nextTempId++ });
        } else {
            // For new products, generate variants based on S values
            const generatedVariants = generatePowerVariants(baseProduct);
            generatedVariants.forEach(variant => {
                productsToAdd.push({ ...variant, tempId: nextTempId++ });
            });
        }
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