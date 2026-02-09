// Constants for better maintainability
const API_GATEWAY_URL = 'https://oupi92eoc7.execute-api.ap-southeast-2.amazonaws.com/default/getMedicalDeviceDetails';
const DEFAULT_LENS_TYPE = '투명';
const DEFAULT_WEAR_TYPE = 'N/A';
const DEFAULT_PRODUCT_NAME = 'N/A';
const DEFAULT_BRAND = 'N/A';
const DEFAULT_MODEL = 'N/A';
const DEFAULT_QUANTITY = 1;
const DEFAULT_PRICE = 0.00;
const DEFAULT_EXPIRATION_DATE = '2099-12-31';

export const ProductService = {
  _products: [
    { id: 1, brand: '아큐브', model: '오아시스 원데이', lensType: '투명', wearType: '원데이', powerS: -1.25, powerC: -0.5, powerAX: 180, quantity: 20, expirationDate: '2028-12-31', price: 55.00, barcode: '1234567890123', gtin: '01234567890123' },
    { id: 2, brand: '바슈롬', model: '바이오트루 원데이', lensType: '컬러', wearType: '원데이', powerS: -2.50, powerC: 0, powerAX: 0, quantity: 15, expirationDate: '2028-11-30', price: 65.00, barcode: '2345678901234', gtin: '02345678901234' },
    { id: 3, brand: '알콘', model: '워터렌즈', lensType: '투명', wearType: '장기착용', powerS: -1.75, powerC: 0, powerAX: 0, quantity: 4, expirationDate: '2027-06-30', price: 70.00, barcode: '3456789012345', gtin: '03456789012345' },
    { id: 4, brand: '쿠퍼비전', model: '클래리티 원데이', lensType: '컬러', wearType: '장기착용', powerS: -3.00, powerC: -1.0, powerAX: 90, quantity: 30, expirationDate: '2029-01-31', price: 75.00, barcode: '4567890123456', gtin: '04567890123456' },
  ],
  _nextId: 5,

  /**
   * Retrieves a copy of all products.
   * @returns {Array<Object>} An array of product objects.
   */
  getProducts() {
    return [...this._products];
  },

  /**
   * Finds a product by its unique ID.
   * @param {number} id - The ID of the product.
   * @returns {Object|undefined} The product object if found, otherwise undefined.
   */
  getProductById(id) {
    return this._products.find(p => p.id === id);
  },

  /**
   * Finds a product by its Global Trade Item Number (GTIN).
   * @param {string} gtin - The GTIN of the product.
   * @returns {Object|undefined} The product object if found, otherwise undefined.
   */
  getProductByGtin(gtin) {
    return this._products.find(p => p.gtin === gtin);
  },

  /**
   * Finds a product by its legacy barcode.
   * @param {string} barcode - The legacy barcode of the product.
   * @returns {Object|undefined} The product object if found, otherwise undefined.
   */
  getProductByLegacyBarcode(barcode) {
      return this._products.find(p => p.barcode === barcode);
  },

  /**
   * Retrieves a list of unique product brands, including a '전체' option.
   * @returns {Array<string>} An array of unique brand names.
   */
  getUniqueBrands() {
    const brands = new Set(this._products.map(p => p.brand));
    return ['전체', ...Array.from(brands)];
  },

  /**
   * Adds a new product to the inventory.
   * Assigns a new ID and sets default values for missing properties.
   * @param {Object} product - The product object to add.
   */
  addProduct(product) {
    product.id = this._nextId++;
    product.lensType = product.lensType || DEFAULT_LENS_TYPE;
    product.wearType = product.wearType || DEFAULT_WEAR_TYPE;
    this._products.push(product);
    this._notify();
  },

  /**
   * Updates an existing product's details.
   * @param {Object} updatedProduct - The product object with updated details.
   */
  updateProduct(updatedProduct) {
    const index = this._products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      this._products[index] = { 
        ...updatedProduct, 
        lensType: updatedProduct.lensType || DEFAULT_LENS_TYPE,
        wearType: updatedProduct.wearType || DEFAULT_WEAR_TYPE
      }; 
      this._notify();
    }
  },

  /**
   * Deletes a product from the inventory by its ID.
   * @param {number} id - The ID of the product to delete.
   */
  deleteProduct(id) {
    this._products = this._products.filter(p => p.id !== id);
    this._notify();
  },

  /**
   * Decreases the stock quantity of a product.
   * @param {number} productId - The ID of the product.
   * @param {number} quantity - The amount to decrease the stock by.
   */
  decreaseStock(productId, quantity) {
      const product = this.getProductById(productId);
      if (product) {
          product.quantity -= quantity;
          this._notify();
      }
  },

  /**
   * Makes a POST request to the AWS API Gateway to fetch product details.
   * @param {string} gtin - The GTIN (UDI-DI) to query.
   * @returns {Promise<Object>} The JSON response from the API.
   * @throws {Error} If the network request fails or the API returns an error.
   */
  async _makeExternalApiRequest(gtin) {
    const response = await fetch(API_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ udiDi: gtin }),
    });

    if (!response.ok) {
      const errorContentType = response.headers.get('content-type');
      let errorMessage = `HTTP error! status: ${response.status}`;
      if (errorContentType && errorContentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage += `, message: ${errorData.error || errorData.message || 'Unknown error'}`;
      } else {
        const errorText = await response.text();
        errorMessage += `, raw response: ${errorText}`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  /**
   * Maps the external API response to the internal product structure.
   * @param {Object} apiResponse - The response object from the external API.
   * @param {string} gtin - The original GTIN queried.
   * @returns {Object|null} A product object in internal format, or null if no product found.
   */
  _mapExternalApiResponseToProduct(apiResponse, gtin) {
    if (apiResponse && apiResponse.productFound) {
      // Use logical OR for null/undefined values, and N/A for undefined/empty strings.
      // Prioritize product name from PRDT_ADD_EXPL, then generic
      const productName = apiResponse.productName || DEFAULT_PRODUCT_NAME;
      const brand = apiResponse.brand || DEFAULT_BRAND;
      const model = apiResponse.model || DEFAULT_MODEL;

      return {
        brand: brand,
        model: model,
        productName: productName, // Use the mapped product name
        // UDI-DI API does not provide power, quantity, price, expirationDate.
        // These must be sourced elsewhere or entered manually.
        powerS: 0, 
        powerC: 0,
        powerAX: 0,
        quantity: DEFAULT_QUANTITY,
        expirationDate: DEFAULT_EXPIRATION_DATE, // Placeholder (can be overridden by UDI parser)
        price: DEFAULT_PRICE,
        barcode: gtin, // Use GTIN as barcode
        gtin: gtin,
        lensType: DEFAULT_LENS_TYPE,
        wearType: DEFAULT_WEAR_TYPE
      };
    }
    return null;
  },

  /**
   * Fetches product details from an external API (AWS Lambda).
   * @param {string} gtin - The GTIN (UDI-DI) of the product.
   * @returns {Promise<Object|null>} A product object in internal format if found, otherwise null.
   */
  async fetchProductDetailsFromExternalApi(gtin) {
    try {
      const apiResponse = await this._makeExternalApiRequest(gtin);
      console.log('AWS Lambda Function response:', apiResponse); // Log raw API response
      
      // Check if rawResponse exists and items_list is empty, means API returned no data
      if (apiResponse && apiResponse.rawResponse && apiResponse.message && apiResponse.message.includes('API returned empty items list.')) {
        console.warn('External API returned an empty items list:', apiResponse.rawResponse);
        return null; // Return null if API explicitly states no items
      }

      return this._mapExternalApiResponseToProduct(apiResponse, gtin);
    } catch (error) {
      console.error('Error calling AWS Lambda Function:', error);
      return null;
    }
  },

  /**
   * Retrieves products expiring within a specified number of days.
   * @param {number} [days=90] - The number of days within which products will expire.
   * @returns {Array<Object>} An array of expiring product objects, sorted by expiration date.
   */
  getExpiringProducts(days = 90) {
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + days);

    return this._products.filter(product => {
        const expiration = new Date(product.expirationDate);
        return expiration <= warningDate && expiration >= today;
    }).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  },

  /**
   * Retrieves products with abnormal (negative) inventory quantities.
   * @returns {Array<Object>} An array of products with abnormal inventory.
   */
  getAbnormalInventory() {
    return this._products.filter(p => p.quantity < 0);
  },

  /**
   * Dispatches a custom event to notify listeners that products have been updated.
   * @private
   */
  _notify() {
    document.dispatchEvent(new CustomEvent('productsUpdated'));
  }
};