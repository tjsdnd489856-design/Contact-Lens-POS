import { brandProductListModal, closeBrandProductListModalElement } from '../utils/dom-elements.js';

/**
 * Opens the brand product list modal for a specific brand.
 * @param {string} brand - The brand name to display products for.
 */
function openBrandProductListModal(brand) {
    const brandProductListModalComponent = brandProductListModal ? brandProductListModal.querySelector('brand-product-list-modal') : null;
    if (brandProductListModal && brandProductListModalComponent) {
        brandProductListModalComponent.setBrand(brand);
        brandProductListModal.style.display = 'block';
        console.log(`Brand product list modal opened for brand: ${brand}`);
    } else {
        console.error('Attempted to open brand product list modal but element or component not found.');
    }
}

/**
 * Closes the brand product list modal.
 */
function closeBrandProductListModal() {
    if (brandProductListModal) {
        brandProductListModal.style.display = 'none';
        console.log('Brand product list modal closed.');
    } else {
        console.error('Attempted to close brand product list modal but element not found.');
    }
}

/**
 * Initializes the brand product list modal's event listeners.
 */
export function initBrandProductListModalHandler() {
    // Event listener for brand product list modal
    document.addEventListener('openBrandProductListModal', (e) => {
        openBrandProductListModal(e.detail);
    });
    if (closeBrandProductListModalElement) {
        closeBrandProductListModalElement.addEventListener('click', closeBrandProductListModal);
    }
}

// Export open/close functions if they need to be called externally
export { openBrandProductListModal, closeBrandProductListModal };