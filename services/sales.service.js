// --- Sales Service (Singleton) ---
export const SalesService = {
  _sales: [],
  _nextId: 1,

  getSales() {
    return [...this._sales];
  },
  
  getSalesByCustomerId(customerId) {
      return this._sales.filter(sale => sale.customerId === customerId);
  },

  addSale(sale) {
    for (const item of sale.items) {
        const product = ProductService.getProductById(item.product.id);
        if (!product || product.quantity < item.quantity) {
            alert(`${item.product.brand} ${item.product.model} 제품의 재고가 부족합니다. 현재 재고: ${product.quantity}개`);
            return false;
        }
    }
    
    for (const item of sale.items) {
        ProductService.decreaseStock(item.product.id, item.quantity);
    }

    sale.id = this._nextId++;
    sale.date = new Date();
    this._sales.push(sale);
    CustomerService.addPurchaseToCustomerHistory(sale.customerId, sale.id, sale.date); // Pass purchaseDate
    this._notify();
    return true;
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('salesUpdated'));
  }
};
