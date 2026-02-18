import { CustomerService } from './customer.service.js';
import { ProductService } from './product.service.js';
import { db } from '../modules/firebase-init.js'; // Import Firestore instance

// --- Constants for better readability and maintainability ---
const ALERT_MESSAGES = {
    INSUFFICIENT_STOCK: (brand, model, currentStock) => 
        `${brand} ${model} 제품의 재고가 부족합니다. 현재 재고: ${currentStock}개`,
    SALE_COMPLETED: '판매가 성공적으로 완료되었습니다!',
};

// --- Sales Service (Singleton) ---
export const SalesService = {
  _sales: [], // Local cache of Firestore sales data
  _initialized: false,

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    // Set up a real-time listener for the 'sales' collection
    db.collection('sales').orderBy('date', 'asc').onSnapshot(snapshot => {
      this._sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date object if it exists
        date: doc.data().date?.toDate() 
      }));
      // Notify listeners that sales data has been updated
      this._notify();
    }, error => {
      console.error("Error fetching sales from Firestore:", error);
      // Optionally, handle error notification to UI
    });
  },

  /**
   * Retrieves a copy of all sales records from the local Firestore cache.
   * @returns {Array<Object>} An array of sale objects.
   */
  getSales() {
    return [...this._sales];
  },
  
  /**
   * Retrieves sales records for a specific customer from the local Firestore cache.
   * This now filters from the continuously updated _sales array.
   * @param {string} customerId - The Firestore ID of the customer.
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
        // Assuming productId in saleItems is the ProductService's unique ID
        const product = ProductService.getProductById(item.productId);
        if (!product || product.quantity < item.quantity) {
            throw new Error(ALERT_MESSAGES.INSUFFICIENT_STOCK(product.brand, product.model, product ? product.quantity : 0));
        }
    }
  },

  /**
   * Deducts the quantity of sold items from the product stock.
   * @param {Array<Object>} saleItems - An array of items in the sale cart.
   * @private
   */
  async _deductStock(saleItems) {
    for (const item of saleItems) {
        await ProductService.decreaseStock(item.productId, item.quantity);
    }
  },

  /**
   * Adds a new sale transaction to Firestore and updates customer history.
   * @param {Object} sale - The sale object containing customerId, items, and total.
   * @returns {Promise<boolean>} True if the sale was added successfully.
   * @throws {Error} If stock is insufficient.
   */
  async addSale(sale) {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Validate stock before proceeding
        this._validateStock(sale.items);
        
        // 2. Deduct stock for all items - AWAIT this call
        await this._deductStock(sale.items);

        // 3. Create sale record to be added to Firestore
        const newSaleData = {
          customerId: sale.customerId,
          items: sale.items,
          total: sale.total,
          date: firebase.firestore.FieldValue.serverTimestamp(), // Use Firestore server timestamp
        };

        // 4. Add sale to Firestore
        const docRef = await db.collection('sales').add(newSaleData);
        
        // 5. Update customer purchase history with the new sale's Firestore ID
        // Note: newSaleData.date will be a Timestamp after it's written to Firestore,
        // and addPurchaseToCustomerHistory expects a Date object.
        // The onSnapshot listener will convert it to Date, so we can pass the timestamp directly.
        await CustomerService.addPurchaseToCustomerHistory(sale.customerId, docRef.id, newSaleData.date);
        
        // No need to call this._notify() explicitly here, as the onSnapshot listener will trigger it.
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Dispatches a custom event to notify listeners that sales data has been updated.
   * @private
   */
  _notify() {
    document.dispatchEvent(new CustomEvent('salesUpdated'));
  }
};