import { CustomerService } from './customer.service.js';
import { ProductService } from './product.service.js';

// --- Constants for better readability and maintainability ---
const ALERT_MESSAGES = {
    INSUFFICIENT_STOCK: (brand, model, currentStock) => 
        `${brand} ${model} 제품의 재고가 부족합니다. 현재 재고: ${currentStock}개`,
    SALE_COMPLETED: '판매가 성공적으로 완료되었습니다!',
};

// --- Sales Service (Singleton) ---
export const SalesService = {
  _sales: [],
  _nextId: 1,

  /**
   * Retrieves a copy of all sales records.
   * @returns {Array<Object>} An array of sale objects.
   */
  getSales() {
    return [...this._sales];
  },
  
  /**
   * Retrieves sales records for a specific customer.
   * @param {number} customerId - The ID of the customer.
   * @returns {Array<Object>} An array of sale objects for the given customer.
   */
  getSalesByCustomerId(customerId) {
      return this._sales.filter(sale => sale.customerId === customerId);
  },

  /**
   * Validates if there is sufficient stock for all items in a sale.
   * @param {Array<Object>} saleItems - An array of items in the sale cart.
   * @throws {Error} If stock is insufficient for any item.
   * @private
   */
  _validateStock(saleItems) {
    for (const item of saleItems) {
        const product = ProductService.getProductById(item.product.id);
        if (!product || product.quantity < item.quantity) {
            throw new Error(ALERT_MESSAGES.INSUFFICIENT_STOCK(item.product.brand, item.product.model, product ? product.quantity : 0));
        }
    }
  },

  /**
   * Deducts the quantity of sold items from the product stock.
   * @param {Array<Object>} saleItems - An array of items in the sale cart.
   * @private
   */
  _deductStock(saleItems) {
    for (const item of saleItems) {
        ProductService.decreaseStock(item.product.id, item.quantity);
    }
  },

  /**
   * Adds a new sale transaction to the system.
   * @param {Object} sale - The sale object containing customerId, items, and total.
   * @returns {boolean} True if the sale was added successfully.
   * @throws {Error} If stock is insufficient.
   */
  addSale(sale) {
    // 1. Validate stock before proceeding
    this._validateStock(sale.items);
    
    // 2. Deduct stock for all items
    this._deductStock(sale.items);

    // 3. Create sale record
    sale.id = this._nextId++;
    sale.date = new Date();
    this._sales.push(sale);
    
    // 4. Update customer purchase history
    CustomerService.addPurchaseToCustomerHistory(sale.customerId, sale.id, sale.date);
    
    // 5. Notify listeners of sales update
    this._notify();
    return true;
  },

  /**
   * Dispatches a custom event to notify listeners that sales data has been updated.
   * @private
   */
  _notify() {
    document.dispatchEvent(new CustomEvent('salesUpdated'));
  }
};