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
   */
  getProductById(id) {
    return this._firestoreProducts.find(p => p.id === id);
  },

  /**
   * Finds a product by its Global Trade Item Number (GTIN).
   */
  getProductByGtin(gtin) {
    if (!gtin) return undefined;
    // Handle both 13 and 14 digit GTINs by padding with leading zeros
    const paddedGtin = gtin.padStart(14, '0');
    return this._firestoreProducts.find(p => (p.gtin && p.gtin.padStart(14, '0') === paddedGtin) || p.barcode === gtin);
  },

  /**
   * Finds a product by its legacy barcode.
   */
  getProductByLegacyBarcode(barcode) {
      return this._firestoreProducts.find(p => p.barcode === barcode);
  },

  /**
   * Retrieves a list of unique product brands.
   */
  getUniqueBrands() {
    const brands = new Set(this._firestoreProducts.map(p => p.brand));
    return ['전체', ...Array.from(brands)];
  },

  /**
   * Adds a new product to the inventory.
   */
  async addProduct(product) {
    try {
      const docRef = await db.collection('products').add({
        ...DEFAULT_PRODUCT_DATA,
        ...product,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding product to Firestore:", error);
      throw new Error("제품 추가 중 오류가 발생했습니다: " + error.message);
    }
  },

  /**
   * Deletes a product.
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
   * Makes a POST request to the AWS API Function URL.
   * CORS safe implementation.
   */
  async _makeExternalApiRequest(gtin) {
    // Note: Simple request without custom headers can sometimes bypass complex preflights,
    // but here we must use JSON.
    const response = await fetch(API_GATEWAY_URL, {
      method: 'POST',
      mode: 'cors', // Explicitly set CORS mode
      headers: { 
          'Content-Type': 'text/plain' // Use text/plain to avoid some preflight issues if possible, or application/json
      },
      body: JSON.stringify({ udiDi: gtin }),
    });

    if (!response.ok) {
      throw new Error(`API Request Failed: ${response.status}`);
    }
    
    // Attempt to parse text response as JSON
    const textData = await response.text();
    try {
        return JSON.parse(textData);
    } catch (e) {
        console.error('Failed to parse API response as JSON:', textData);
        throw new Error('Invalid JSON response from API');
    }
  },

  /**
   * Maps the external API response to the internal product structure.
   */
  _mapExternalApiResponseToProduct(apiResponse, gtin) {
    const data = apiResponse.item_details || apiResponse;
    
    if (data && (data.brand || data.model || data.productName)) {
      return {
        brand: data.brand || DEFAULT_BRAND,
        model: data.model || DEFAULT_MODEL,
        productName: data.productName || DEFAULT_PRODUCT_NAME,
        powerS: 0, 
        powerC: 0,
        powerAX: 0,
        quantity: DEFAULT_QUANTITY,
        expirationDate: DEFAULT_EXPIRATION_DATE,
        price: DEFAULT_PRICE,
        barcode: gtin,
        gtin: gtin,
        lensType: DEFAULT_LENS_TYPE,
        wearType: DEFAULT_WEAR_TYPE
      };
    }
    return null;
  },

  /**
   * Fetches product details from an external API.
   */
  async fetchProductDetailsFromExternalApi(gtin) {
    if (!gtin) return null;
    try {
      console.log(`Calling API for GTIN: ${gtin}`);
      const apiResponse = await this._makeExternalApiRequest(gtin);
      console.log('API Raw Response:', apiResponse);
      
      const mappedProduct = this._mapExternalApiResponseToProduct(apiResponse, gtin);
      if (mappedProduct) {
          console.log('Successfully mapped product:', mappedProduct);
          return mappedProduct;
      }
      
      console.warn('API returned data but it could not be mapped to a product.');
      return null;
    } catch (error) {
      console.error('External API Call Error:', error);
      return null;
    }
  },

  /**
   * Retrieves products expiring within a specified number of days.
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
   */
  getAbnormalInventory() {
    return this._firestoreProducts.filter(p => p.quantity < 0);
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('productsUpdated', { detail: this._firestoreProducts }));
  }
};
