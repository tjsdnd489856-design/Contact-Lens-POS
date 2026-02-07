
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import axios from "axios";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript



export const getMedicalDeviceDetails = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated. This is optional but recommended for production.
  // if (!context.auth) {
  //   throw new functions.https.HttpsError(
  //     'unauthenticated',
  //     'The function must be called while authenticated.'
  //   );
  // }

  const udiDi = (data as any).udiDi; // Correctly access udiDi
  if (!udiDi) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with one argument "udiDi" containing the UDI-DI code.'
    );
  }

  // Access the API key securely from Firebase environment configuration
  const serviceKey = (functions.config as any)().med_device_api.key; // Apply workaround for config() call
  if (!serviceKey) {
    logger.error('API key not configured. Run "firebase functions:config:set med_device_api.key=YOUR_API_KEY"');
    throw new functions.https.HttpsError(
      'internal',
      'API key not configured on the server.'
    );
  }

  // Construct the external API URL.
  // I'm making an educated guess for the operation name and parameter based on common data.go.kr patterns.
  // If this doesn't work, further documentation lookup for MdeqStdCdUnityInfoService01 will be needed.
  const apiUrl = `https://apis.data.go.kr/1471000/MdeqStdCdUnityInfoService01/getMdeqStdCdUnityInfoList`;
  
  try {
    const response = await axios.get(apiUrl, {
      params: {
        serviceKey: serviceKey,
        type: 'json', // Request JSON format. The user mentioned JSON+XML, so trying JSON first.
        numOfRows: 1, // We only expect one result for a specific UDI-DI
        pageNo: 1,
        diCd: udiDi, // Assuming 'diCd' is the parameter for UDI-DI
      },
    });

    const responseData = response.data;
    logger.info("External API Response:", responseData);

    // Parse the response. data.go.kr responses are often nested.
    // Example path: items.item[0].propertyName
    const items = responseData?.response?.body?.items?.item;

    if (!items || items.length === 0) {
      logger.warn(`No medical device details found for UDI-DI: ${udiDi}`);
      return { productFound: false, message: 'No product details found for this UDI-DI.' };
    }

    const productInfo = items[0]; // Assuming the first item is the relevant one

    // Extract relevant fields. These are educated guesses based on typical medical device data.
    // Actual field names would come from the API documentation.
    const extractedDetails = {
      productFound: true,
      udiDi: productInfo.diCd || udiDi,
      productName: productInfo.prdlstNm || 'N/A', // 제품명
      brand: productInfo.bsshNm || 'N/A', // 제조/수입사 명칭 (often acts as brand)
      model: productInfo.mdlNm || 'N/A', // 모델명
      permitNum: productInfo.prmitNo || 'N/A', // 허가번호
      itemNo: productInfo.itemNo || 'N/A', // 품목 번호
      material: productInfo.matrNm || 'N/A', // 재료명
      standardCode: productInfo.stdrCd || 'N/A', // 표준코드
      // Additional fields if available and relevant:
      // power: productInfo.power || 'N/A', // 도수
      // wearType: productInfo.wearType || 'N/A', // 착용기간
      // The API documentation would be crucial to map these correctly.
    };

    logger.info("Extracted Product Details:", extractedDetails);
    return extractedDetails;

  } catch (error: any) {
    logger.error("Error calling data.go.kr API:", error.message, error.response?.data);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to retrieve product details from external API.',
      error.message
    );
  }
});
