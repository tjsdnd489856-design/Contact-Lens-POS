import { db } from '../modules/firebase-init.js'; // Import Firestore instance

const DUPLICATE_CUSTOMER_MESSAGE = '중복된 고객입니다.';

// --- Constants for better readability and maintainability ---
const DEFAULT_CUSTOMER_DATA = {
    phone: '',
    rightS: null, rightC: null, rightAX: 0,
    leftS: null, leftC: null, leftAX: 0,
    purchaseHistory: [],
    lastPurchaseDate: null,
    notes: '',
    isVIP: false,
    isCaution: false,
};

// --- Customer Service (Singleton) ---
export const CustomerService = {
  _initialized: false, // Flag to ensure initialization only runs once
  _firestoreCustomers: [], // Local cache of Firestore data

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    // Set up a real-time listener for the 'customers' collection
    db.collection('customers').orderBy('name').onSnapshot(snapshot => {
      this._firestoreCustomers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Removed this._notify() here to prevent displaying all customers by default
    }, error => {
      console.error("Error fetching customers from Firestore:", error);
      // Optionally, handle error notification to UI
    });
  },

  /**
   * Retrieves a copy of all customer records from the local Firestore cache.
   * @returns {Array<Object>} An array of customer objects.
   */
  getCustomers() {
    return [...this._firestoreCustomers];
  },
  
  /**
   * Finds a customer by their unique ID from the local Firestore cache.
   * @param {string} id - The ID of the customer.
   * @returns {Object|undefined} The customer object if found, otherwise undefined.
   */
  getCustomerById(id) {
      return this._firestoreCustomers.find(c => c.id === id);
  },
  
  /**
   * Checks if a customer with the given name and phone already exists in the local Firestore cache.
   * @param {string} name - The name of the customer.
   * @param {string} phone - The phone number of the customer.
   * @param {string|null} id - The ID of the customer being checked (for updates).
   * @returns {boolean} True if a duplicate exists, false otherwise.
   */
  isDuplicateCustomer(name, phone, id = null) {
      return this._firestoreCustomers.some(customer => 
          customer.name === name && 
          customer.phone === phone && 
          customer.id !== id
      );
  },

  /**
   * Helper function to filter by customer name.
   * @param {Object} customer - The customer object.
   * @param {string} lowerCaseQuery - The search query in lowercase.
   * @returns {boolean} True if customer name matches.
   */
  _filterByName(customer, lowerCaseQuery) {
      return customer.name.toLowerCase().includes(lowerCaseQuery);
  },

  /**
   * Helper function to filter by customer phone number.
   * @param {Object} customer - The customer object.
   * @param {string} lowerCaseQuery - The search query in lowercase.
   * @returns {boolean} True if customer phone matches (full or last 4 digits).
   */
  _filterByPhone(customer, lowerCaseQuery) {
      const customerPhoneCleaned = customer.phone.replace(/-/g, '');
      const customerPhoneLower = customerPhoneCleaned.toLowerCase();
      
      return customerPhoneLower.includes(lowerCaseQuery) || 
             customerPhoneCleaned.slice(-4).includes(lowerCaseQuery);
  },

  /**
   * Helper function to filter by customer name and phone combination.
   * @param {Object} customer - The customer object.
   * @param {Array<string>} queryParts - The search query split into parts.
   * @returns {boolean} True if both name and phone parts match.
   */
  _filterByNameAndPhone(customer, queryParts) {
      if (queryParts.length < 2) return false;
      const nameQuery = queryParts[0].toLowerCase();
      const phoneQuery = queryParts.slice(1).join('').toLowerCase();
      
      const customerNameLower = customer.name.toLowerCase();
      const customerPhoneCleaned = customer.phone.replace(/-/g, '').toLowerCase();

      return customerNameLower.includes(nameQuery) && customerPhoneCleaned.includes(phoneQuery);
  },

  /**
   * Searches for customers based on a query string.
   * This now filters the local Firestore cache.
   * @param {string} query - The search query (name, phone, or 'name phone' format).
   * @returns {Array<Object>} An array of matching customer objects.
   */
  searchCustomers(query) {
      if (!query) {
          return this.getCustomers();
      }
      const lowerCaseQuery = query.toLowerCase().trim();
      const queryParts = lowerCaseQuery.split(' '); // Split for 'name phone' search
      
      return this._firestoreCustomers.filter(customer => {
          // Search by name
          if (this._filterByName(customer, lowerCaseQuery)) {
              return true;
          }
          // Search by phone
          if (this._filterByPhone(customer, lowerCaseQuery)) {
              return true;
          }
          // Search by 'name phone' format
          if (this._filterByNameAndPhone(customer, queryParts)) {
              return true;
          }
          return false;
      });
  },

  /**
   * Adds a new customer to Firestore.
   * @param {Object} customerData - The data for the new customer.
   * @returns {Promise<boolean>} True if the customer was added, false if it's a duplicate.
   */
  async addCustomer(customerData) {
    if (this.isDuplicateCustomer(customerData.name, customerData.phone)) {
        throw new Error(DUPLICATE_CUSTOMER_MESSAGE);
    }
    try {
      const docRef = await db.collection('customers').add({
          ...DEFAULT_CUSTOMER_DATA,
          ...customerData,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding customer to Firestore:", error);
      throw new Error("고객 추가 중 오류가 발생했습니다: " + error.message);
    }
  },

  /**
   * Updates an existing customer's details in Firestore.
   * @param {Object} updatedCustomerData - The updated data for the customer (must include id).
   * @returns {Promise<boolean>} True if the customer was updated, false if not found or a duplicate.
   */
  async updateCustomer(updatedCustomerData) {
    if (this.isDuplicateCustomer(updatedCustomerData.name, updatedCustomerData.phone, updatedCustomerData.id)) {
        throw new Error(DUPLICATE_CUSTOMER_MESSAGE);
    }
    try {
      const customerRef = db.collection('customers').doc(updatedCustomerData.id);
      await customerRef.update({
          ...updatedCustomerData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return updatedCustomerData.id;
    } catch (error) {
      console.error("Error updating customer in Firestore:", error);
      throw new Error("고객 정보 업데이트 중 오류가 발생했습니다: " + error.message);
    }
  },

  /**
   * Deletes a customer from Firestore by their ID.
   * @param {string} id - The ID of the customer to delete.
   * @returns {Promise<void>}
   */
  async deleteCustomer(id) {
    try {
      await db.collection('customers').doc(id).delete();
    } catch (error) {
      console.error("Error deleting customer from Firestore:", error);
      throw new Error("고객 삭제 중 오류가 발생했습니다: " + error.message);
    }
  },

  /**
   * Adds a sale record to a customer's purchase history and updates their last purchase date in Firestore.
   * @param {string} customerId - The ID of the customer.
   * @param {string} saleId - The ID of the completed sale.
   * @param {Date} purchaseDate - The date of the purchase.
   * @returns {Promise<void>}
   */
  async addPurchaseToCustomerHistory(customerId, saleId, purchaseDate) {
    try {
      const customerRef = db.collection('customers').doc(customerId);
      await customerRef.update({
        purchaseHistory: firebase.firestore.FieldValue.arrayUnion(saleId), // Add saleId to array
        lastPurchaseDate: purchaseDate,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating customer purchase history in Firestore:", error);
      throw new Error("고객 구매 내역 업데이트 중 오류가 발생했습니다: " + error.message);
    }
  },

  /**
   * Dispatches a custom event to notify listeners that customer data has been updated.
   * This now uses the internally cached Firestore data.
   * @private
   */
  _notify(filteredCustomers = null, query = '') {
    // If filteredCustomers are provided (e.g., from a search), use them, otherwise use the full Firestore cache
    const customersToDispatch = filteredCustomers || this._firestoreCustomers;
    document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers: customersToDispatch, query } }));
  }
};