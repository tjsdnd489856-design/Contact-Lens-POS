import { db } from '../modules/firebase-init.js'; // Import Firestore instance

// Constants for better maintainability
const API_GATEWAY_URL = 'https://oupi92eoc7.lambda-url.ap-southeast-2.on.aws/'; // Updated to Function URL
export const DEFAULT_LENS_TYPE = '투명';
export const DEFAULT_WEAR_TYPE = 'N/A';
const DEFAULT_PRODUCT_NAME = 'N/A';
const DEFAULT_BRAND = 'N/A';
const DEFAULT_MODEL = 'N/A';
const DEFAULT_QUANTITY = 1;
const DEFAULT_PRICE = 0.00;
const DEFAULT_EXPIRATION_DATE = '2099-12-31';

const DEFAULT_PRODUCT_DATA = {
    brand: DEFAULT_BRAND,
    model: DEFAULT_MODEL,
    productName: DEFAULT_PRODUCT_NAME,
    powerS: 0,
    powerC: 0,
    powerAX: 0,
    quantity: DEFAULT_QUANTITY,
    expirationDate: DEFAULT_EXPIRATION_DATE,
    price: DEFAULT_PRICE,
    barcode: '',
    gtin: '',
    lensType: DEFAULT_LENS_TYPE,
    wearType: DEFAULT_WEAR_TYPE,
};

export const ProductService = {
  _initialized: false, // Flag to ensure initialization only runs once
  _firestoreProducts: [], // Local cache of Firestore data

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    // Set up a real-time listener for the 'products' collection
    db.collection('products').orderBy('brand').orderBy('model').onSnapshot(snapshot => {
      this._firestoreProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      this._notify(); // Notify components after local cache is updated
    }, error => {
      console.error("Error fetching products from Firestore:", error);
      // Optionally, handle error notification to UI
    });
  },

  /**
   * Retrieves a copy of all products.
   * @returns {Array<Object>} An array of product objects.
   */
  getProducts() {
    return [...this._firestoreProducts];
  },

  /**
   * Finds a product by its unique ID.
   * @param {string} id - The ID of the product.
   * @returns {Object|undefined} The product object if found, otherwise undefined.
   */
  getProductById(id) {
    return this._firestoreProducts.find(p => p.id === id);
  },

  /**
   * Finds a product by its Global Trade Item Number (GTIN).
   * @param {string} gtin - The GTIN of the product.
   * @returns {Object|undefined} The product object if found, otherwise undefined.
   */
  getProductByGtin(gtin) {
    return this._firestoreProducts.find(p => p.gtin === gtin);
  },

  /**
   * Finds a product by its legacy barcode.
   * @param {string} barcode - The legacy barcode of the product.
   * @returns {Object|undefined} The product object if found, otherwise undefined.
   */
  getProductByLegacyBarcode(barcode) {
      return this._firestoreProducts.find(p => p.barcode === barcode);
  },

  /**
   * Retrieves a list of unique product brands, including a '전체' option.
   * @returns {Array<string>} An array of unique brand names.
   */
  getUniqueBrands() {
    const brands = new Set(this._firestoreProducts.map(p => p.brand));
    return ['전체', ...Array.from(brands)];
  },

  /**
   * Adds a new product to the inventory.
   * Assigns a new ID and sets default values for missing properties.
   * @param {Object} product - The product object to add.
   */
  async addProduct(product) {
    try {
      const docRef = await db.collection('products').add({
        ...DEFAULT_PRODUCT_DATA, // Apply defaults first
        ...product, // Then override with provided product data
        createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Add timestamp
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding product to Firestore:", error);
      throw new Error("제품 추가 중 오류가 발생했습니다: " + error.message);
    }
  },

  /**
   * Updates an existing product's details.
   * @param {Object} updatedProduct - The product object with updated details.
   * @returns {Promise<string>} The ID of the updated product.
   */

  /**
   * Deletes a product from the inventory by its ID.
   * @param {string} id - The ID of the product to delete.
   */
  async deleteProduct(id) {
    try {
      await db.collection('products').doc(id).delete();
    } catch (error) {
      console.error("Error deleting product from Firestore:", error);
      throw new Error("제품 삭제 중 오류가 발생했습니다: " + error.message);
    }
  },

  /**
   * Decreases the stock quantity of a product.
   * @param {string} productId - The ID of the product.
   * @param {number} quantity - The amount to decrease the stock by.
   * @returns {Promise<void>}
   */
  async decreaseStock(productId, quantity) {
    try {
      const productRef = db.collection('products').doc(productId);
      await productRef.update({
        quantity: firebase.firestore.FieldValue.increment(-quantity),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error decreasing stock in Firestore:", error);
      throw new Error("재고 감소 중 오류가 발생했습니다: " + error.message);
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

    return this._firestoreProducts.filter(product => {
        const expiration = new Date(product.expirationDate);
        return expiration <= warningDate && expiration >= today;
    }).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  },

  /**
   * Retrieves products with abnormal (negative) inventory quantities.
   * @returns {Array<Object>} An array of products with abnormal inventory.
   */
  getAbnormalInventory() {
    return this._firestoreProducts.filter(p => p.quantity < 0);
  },

  /**
   * Dispatches a custom event to notify listeners that products have been updated.
   * @private
   */
  _notify() {
    document.dispatchEvent(new CustomEvent('productsUpdated', { detail: this._firestoreProducts }));
  }
};