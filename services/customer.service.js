// --- Customer Service (Singleton) ---
export const CustomerService = {
  _customers: [
    { id: 1, name: '홍길동', phone: '010-1234-5678', rightS: -1.00, rightC: -0.50, rightAX: 180, leftS: -1.25, leftC: -0.75, leftAX: 90, purchaseHistory: [], lastPurchaseDate: null, notes: '', isVIP: false, isCaution: false },
    { id: 2, name: '김철수', phone: '010-9876-5432', rightS: -2.00, rightC: 0.00, rightAX: 0, leftS: -2.00, leftC: 0.00, leftAX: 0, purchaseHistory: [], lastPurchaseDate: null, notes: '', isVIP: false, isCaution: false },
  ],
  _nextId: 3,

  getCustomers() {
    return [...this._customers];
  },
  
  getCustomerById(id) {
      return this._customers.find(c => c.id === id);
  },
  
  isDuplicateCustomer(name, phone, id = null) {
      return this._customers.some(customer => 
          customer.name === name && 
          customer.phone === phone && 
          customer.id !== id
      );
  },

  searchCustomers(query) {
      if (!query) {
          return this.getCustomers();
      }
      const lowerCaseQuery = query.toLowerCase().trim();
      
      return this._customers.filter(customer => {
          const customerNameLower = customer.name.toLowerCase();
          const customerPhoneCleaned = customer.phone.replace(/-/g, '');
          const customerPhoneLower = customerPhoneCleaned.toLowerCase();

          // Search by name
          if (customerNameLower.includes(lowerCaseQuery)) {
              return true;
          }
          // Search by last 4 digits of phone
          if (customerPhoneCleaned.slice(-4).includes(lowerCaseQuery)) {
              return true;
          }
          // Search by any part of the phone number
          if (customerPhoneLower.includes(lowerCaseQuery)) {
              return true;
          }

          // Search by "이름 전화번호" format
          const queryParts = lowerCaseQuery.split(' ');
          if (queryParts.length >= 2) {
              const nameQuery = queryParts[0];
              const phoneQuery = queryParts.slice(1).join(''); // Join remaining parts for phone query
              if (customerNameLower.includes(nameQuery) && customerPhoneCleaned.includes(phoneQuery)) {
                  return true;
              }
          }

          return false; // No match found
      });
  },

  addCustomer(customer) {
    if (this.isDuplicateCustomer(customer.name, customer.phone)) {
        alert('중복된 고객입니다.');
        return false;
    }
    customer.id = this._nextId++;
    customer.purchaseHistory = []; // Initialize empty purchase history
    customer.lastPurchaseDate = null; // Initialize last purchase date
    customer.notes = ''; // Initialize notes
    customer.isVIP = customer.isVIP || false; // Initialize VIP
    customer.isCaution = customer.isCaution || false; // Initialize Caution
    // Initialize new dose fields
    customer.rightS = customer.rightS || null;
    customer.rightC = customer.rightC || null;
    customer.rightAX = customer.rightAX || 0;
    customer.leftS = customer.leftS || null;
    customer.leftC = customer.leftC || null;
    customer.leftAX = customer.leftAX || 0;

    this._customers.push(customer);
    this._notify();
    return true;
  },

  updateCustomer(updatedCustomer) {
    if (this.isDuplicateCustomer(updatedCustomer.name, updatedCustomer.phone, updatedCustomer.id)) {
        alert('중복된 고객입니다.');
        return false;
    }
    const index = this._customers.findIndex(c => c.id === updatedCustomer.id);
    if (index !== -1) {
      // Preserve purchase history and last purchase date
      updatedCustomer.purchaseHistory = this._customers[index].purchaseHistory; 
      updatedCustomer.lastPurchaseDate = this._customers[index].lastPurchaseDate; 
      this._customers[index] = updatedCustomer;
      this._notify();
      return true;
    }
    return false;
  },

  deleteCustomer(id) {
    this._customers = this._customers.filter(c => c.id !== id);
    this._notify();
  },

  addPurchaseToCustomerHistory(customerId, saleId, purchaseDate) {
    const customer = this.getCustomerById(customerId);
    if (customer) {
      customer.purchaseHistory.push(saleId);
      customer.lastPurchaseDate = purchaseDate; // Update last purchase date
      this._notify(); // Notify that customer data has changed
    }
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('customersUpdated', { detail: { filteredCustomers: null, query: '' } }));
  }
};