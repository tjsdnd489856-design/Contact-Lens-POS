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
const DUPLICATE_CUSTOMER_MESSAGE = '중복된 고객입니다.';

// --- Customer Service (Singleton) ---
export const CustomerService = {
  _customers: [
    { id: 1, name: '홍길동', phone: '010-1234-5678', rightS: -1.00, rightC: -0.50, rightAX: 180, leftS: -1.25, leftC: -0.75, leftAX: 90, purchaseHistory: [], lastPurchaseDate: null, notes: '', isVIP: false, isCaution: false },
    { id: 2, name: '김철수', phone: '010-9876-5432', rightS: -2.00, rightC: 0.00, rightAX: 0, leftS: -2.00, leftC: 0.00, leftAX: 0, purchaseHistory: [], lastPurchaseDate: null, notes: '', isVIP: false, isCaution: false },
  ],
  _nextId: 3,

  /**
   * Retrieves a copy of all customer records.
   * @returns {Array<Object>} An array of customer objects.
   */
  getCustomers() {
    return [...this._customers];
  },
  
  /**
   * Finds a customer by their unique ID.
   * @param {number} id - The ID of the customer.
   * @returns {Object|undefined} The customer object if found, otherwise undefined.
   */
  getCustomerById(id) {
      return this._customers.find(c => c.id === id);
  },
  
  /**
   * Checks if a customer with the given name and phone already exists.
   * @param {string} name - The name of the customer.
   * @param {string} phone - The phone number of the customer.
   * @param {number|null} id - The ID of the customer being checked (for updates).
   * @returns {boolean} True if a duplicate exists, false otherwise.
   */
  isDuplicateCustomer(name, phone, id = null) {
      return this._customers.some(customer => 
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
   * @param {string} query - The search query (name, phone, or 'name phone' format).
   * @returns {Array<Object>} An array of matching customer objects.
   */
  searchCustomers(query) {
      if (!query) {
          return this.getCustomers();
      }
      const lowerCaseQuery = query.toLowerCase().trim();
      const queryParts = lowerCaseQuery.split(' '); // Split for 'name phone' search
      
      return this._customers.filter(customer => {
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
   * Adds a new customer to the system.
   * @param {Object} customerData - The data for the new customer.
   * @returns {boolean} True if the customer was added, false if it's a duplicate.
   */
  addCustomer(customerData) {
    if (this.isDuplicateCustomer(customerData.name, customerData.phone)) {
        console.warn(DUPLICATE_CUSTOMER_MESSAGE); // Log instead of alert
        return false;
    }
    const newCustomer = {
        id: this._nextId++,
        ...DEFAULT_CUSTOMER_DATA, // Apply defaults first
        ...customerData,         // Override with provided data
    };

    this._customers.push(newCustomer);
    this._notify();
    return true;
  },

  /**
   * Updates an existing customer's details.
   * @param {Object} updatedCustomerData - The updated data for the customer.
   * @returns {boolean} True if the customer was updated, false if not found or a duplicate.
   */
  updateCustomer(updatedCustomerData) {
    if (this.isDuplicateCustomer(updatedCustomerData.name, updatedCustomerData.phone, updatedCustomerData.id)) {
        console.warn(DUPLICATE_CUSTOMER_MESSAGE); // Log instead of alert
        return false;
    }
    const index = this._customers.findIndex(c => c.id === updatedCustomerData.id);
    if (index !== -1) {
      // Preserve purchase history and last purchase date if not explicitly updated
      const existingCustomer = this._customers[index];
      const customerToUpdate = {
        ...updatedCustomerData,
        purchaseHistory: updatedCustomerData.purchaseHistory || existingCustomer.purchaseHistory,
        lastPurchaseDate: updatedCustomerData.lastPurchaseDate || existingCustomer.lastPurchaseDate,
      };
      this._customers[index] = customerToUpdate;
      this._notify();
      return true;
    }
    return false;
  },

  /**
   * Deletes a customer from the system by their ID.
   * @param {number} id - The ID of the customer to delete.
   */
  deleteCustomer(id) {
    this._customers = this._customers.filter(c => c.id !== id);
    this._notify();
  },

  /**
   * Adds a sale record to a customer's purchase history and updates their last purchase date.
   * @param {number} customerId - The ID of the customer.
   * @param {number} saleId - The ID of the completed sale.
   * @param {Date} purchaseDate - The date of the purchase.
   */
  addPurchaseToCustomerHistory(customerId, saleId, purchaseDate) {
    const customer = this.getCustomerById(customerId);
    if (customer) {
      customer.purchaseHistory.push(saleId);
      customer.lastPurchaseDate = purchaseDate;
      this._notify();
    }
  },

  /**
   * Dispatches a custom event to notify listeners that customer data has been updated.
   * @private
   */
  _notify(filteredCustomers = null, query = '') {
    document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers, query } }));
  }
};