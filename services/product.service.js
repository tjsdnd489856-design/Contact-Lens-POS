export const ProductService = {
  _products: [
    { id: 1, brand: '아큐브', model: '오아시스 원데이', lensType: '투명', wearType: '원데이', powerS: -1.25, powerC: -0.5, powerAX: 180, quantity: 20, expirationDate: '2028-12-31', price: 55.00, barcode: '1234567890123', gtin: '01234567890123' },
    { id: 2, brand: '바슈롬', model: '바이오트루 원데이', lensType: '컬러', wearType: '원데이', powerS: -2.50, powerC: 0, powerAX: 0, quantity: 15, expirationDate: '2028-11-30', price: 65.00, barcode: '2345678901234', gtin: '02345678901234' },
    { id: 3, brand: '알콘', model: '워터렌즈', lensType: '투명', wearType: '장기착용', powerS: -1.75, powerC: 0, powerAX: 0, quantity: 4, expirationDate: '2027-06-30', price: 70.00, barcode: '3456789012345', gtin: '03456789012345' },
    { id: 4, brand: '쿠퍼비전', model: '클래리티 원데이', lensType: '컬러', wearType: '장기착용', powerS: -3.00, powerC: -1.0, powerAX: 90, quantity: 30, expirationDate: '2029-01-31', price: 75.00, barcode: '4567890123456', gtin: '04567890123456' },
  ],
  _nextId: 5,

  getProducts() {
    return [...this._products];
  },

  getProductById(id) {
    return this._products.find(p => p.id === id);
  },

  getProductByGtin(gtin) {
    return this._products.find(p => p.gtin === gtin);
  },

  getProductByLegacyBarcode(barcode) {
      return this._products.find(p => p.barcode === barcode);
  },

  getUniqueBrands() {
    const brands = new Set(this._products.map(p => p.brand));
    return ['전체', ...Array.from(brands)];
  },

  addProduct(product) {
    product.id = this._nextId++;
    product.lensType = product.lensType || '투명'; // Default to '투명'
    product.wearType = product.wearType || 'N/A'; // Default to 'N/A' for wearType
    this._products.push(product);
    this._notify();
  },

  updateProduct(updatedProduct) {
    const index = this._products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      this._products[index] = { 
        ...updatedProduct, 
        lensType: updatedProduct.lensType || '투명', // Ensure lensType is handled
        wearType: updatedProduct.wearType || 'N/A' // Ensure wearType is handled
      }; 
      this._notify();
    }
  },

  deleteProduct(id) {
    this._products = this._products.filter(p => p.id !== id);
    this._notify();
  },

  decreaseStock(productId, quantity) {
      const product = this.getProductById(productId);
      if (product) {
          product.quantity -= quantity;
          this._notify();
      }
  },

  async fetchProductDetailsFromExternalApi(gtin) {
    // IMPORTANT: Replace this with your actual AWS API Gateway endpoint URL
    const API_GATEWAY_URL = 'https://YOUR_API_GATEWAY_ENDPOINT.execute-api.AWS_REGION.amazonaws.com/default/getMedicalDeviceDetails'; 

    try {
        const response = await fetch(API_GATEWAY_URL, {
            method: 'POST', // API Gateway usually expects POST for Lambda proxy integration
            headers: {
                'Content-Type': 'application/json',
                // Add any necessary authorization headers here if your API Gateway requires them
            },
            body: JSON.stringify({ udiDi: gtin }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Gateway Error:', errorData);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('AWS Lambda Function response:', result);
        
        if (result && result.productFound) {
            // Map the external API fields to our internal product structure
            // The Lambda function now returns a more complete set of details.
            return {
                brand: result.brand || 'N/A',
                model: result.model || result.productName || 'N/A',
                // UDI-DI API does not provide power, quantity, price, expirationDate.
                // These must be sourced elsewhere or entered manually.
                powerS: 0, 
                powerC: 0,
                powerAX: 0,
                quantity: 1, // Default to 1
                expirationDate: '2099-12-31', // Placeholder (can be overridden by UDI parser)
                price: 0.00, // Placeholder
                barcode: gtin, // Use GTIN as barcode
                gtin: gtin,
                lensType: '투명', // Default (can be refined manually)
                wearType: 'N/A' // Default (can be refined manually)
            };
        }
        return null;
    } catch (error) {
        console.error('Error calling AWS Lambda Function:', error);
        return null;
    }
  },

  getExpiringProducts(days = 90) { // New method to get products expiring within 'days'
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + days);

    return this._products.filter(product => {
        const expiration = new Date(product.expirationDate);
        return expiration <= warningDate && expiration >= today;
    }).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate)); // Sort by expiration date
  },

  getAbnormalInventory() {
    return this._products.filter(p => p.quantity < 0);
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('productsUpdated'));
  }
};