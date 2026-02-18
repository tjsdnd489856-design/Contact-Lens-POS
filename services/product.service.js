import { db } from '../modules/firebase-init.js';

const API_GATEWAY_URL = 'https://oupi92eoc7.lambda-url.ap-southeast-2.on.aws/';
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
  _initialized: false,
  _firestoreProducts: [],

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    db.collection('products').orderBy('brand').orderBy('model').onSnapshot(snapshot => {
      this._firestoreProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      this._notify();
    }, error => {
      console.error("Error fetching products from Firestore:", error);
    });
  },

  getProducts() {
    return [...this._firestoreProducts];
  },

  getProductById(id) {
    return this._firestoreProducts.find(p => p.id === id);
  },

  getProductByGtin(gtin) {
    if (!gtin) return undefined;
    const paddedGtin = gtin.padStart(14, '0');
    return this._firestoreProducts.find(p => (p.gtin && p.gtin.padStart(14, '0') === paddedGtin) || p.barcode === gtin);
  },

  getProductByLegacyBarcode(barcode) {
      return this._firestoreProducts.find(p => p.barcode === barcode);
  },

  getUniqueBrands() {
    const brands = new Set(this._firestoreProducts.map(p => p.brand));
    return ['전체', ...Array.from(brands)];
  },

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

  async deleteProduct(id) {
    try {
      await db.collection('products').doc(id).delete();
    } catch (error) {
      console.error("Error deleting product from Firestore:", error);
      throw new Error("제품 삭제 중 오류가 발생했습니다: " + error.message);
    }
  },

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
   * GET 방식을 사용하여 API를 호출합니다. (CORS 에러를 줄이기 위한 가장 단순한 방식)
   */
  async _makeExternalApiRequest(gtin) {
    const url = `${API_GATEWAY_URL}?udiDi=${encodeURIComponent(gtin)}`;
    
    // 단순 GET 요청은 보안 검사(Preflight)가 생략될 가능성이 매우 높습니다.
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }
    
    return response.json();
  },

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

  async fetchProductDetailsFromExternalApi(gtin) {
    if (!gtin) return null;
    try {
      console.log(`[ProductService] API(GET) 호출 시작: ${gtin}`);
      const apiResponse = await this._makeExternalApiRequest(gtin);
      console.log('[ProductService] API 응답 성공:', apiResponse);
      
      return this._mapExternalApiResponseToProduct(apiResponse, gtin);
    } catch (error) {
      console.error('[ProductService] API 에러:', error);
      return null;
    }
  },

  getExpiringProducts(days = 90) {
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + days);

    return this._firestoreProducts.filter(product => {
        const expiration = new Date(product.expirationDate);
        return expiration <= warningDate && expiration >= today;
    }).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  },

  getAbnormalInventory() {
    return this._firestoreProducts.filter(p => p.quantity < 0);
  },

  _notify() {
    document.dispatchEvent(new CustomEvent('productsUpdated', { detail: this._firestoreProducts }));
  }
};
