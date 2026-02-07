import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import cors from "cors"; // Fix: Use default import for cors

// Initialize CORS middleware
// Allowing all origins for simplicity in this development context.
// For production, you should restrict this to your app's actual domain.
const corsHandler = cors({origin: true});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const getMedicalDeviceDetails = functions.https.onRequest(
  (request, response) => {
    // Wrap the function logic with the CORS handler
    corsHandler(request, response, async () => {
      // Fix: Re-declare the udiDi constant
      const udiDi = request.body.data?.udiDi;

      if (!udiDi) {
        logger.error("Function called without udiDi in the body data.");
        response.status(400).send({
          error: {
            message: "The function must be called with a JSON body " +
                     "containing { data: { udiDi: 'your_code' } }.",
          },
        });
        return;
      }

      // Fix: Correctly access the function configuration
      const serviceKey = functions.config().med_device_api.key;
      if (!serviceKey) {
        logger.error(
          "API key not configured. Run 'firebase " +
          "functions:config:set med_device_api.key=YOUR_API_KEY'"
        );
        response.status(500).send({
          error: {message: "API key not configured on the server."},
        });
        return;
      }

      // Construct the external API URL.
      const apiUrl =
        "https://apis.data.go.kr/1471000/MdeqStdCdUnityInfoService01/" +
        "getMdeqStdCdUnityInfoList";

      try {
        const apiResponse = await axios.get(apiUrl, {
          params: {
            serviceKey: serviceKey,
            type: "json", // Request JSON format.
            numOfRows: 1, // We only expect one result for a specific UDI-DI
            pageNo: 1,
            diCd: udiDi, // Assuming "diCd" is the parameter for UDI-DI
          },
        });

        const responseData = apiResponse.data;
        logger.info("External API Response:", responseData);

        const items = responseData?.response?.body?.items?.item;

        if (!items || items.length === 0) {
          logger.warn(`No medical device details found for UDI-DI: ${udiDi}`);
          // Send a successful response but indicate product was not found
          response.status(200).send({
            data: {
              productFound: false,
              message: "No product details found for this UDI-DI.",
            },
          });
          return;
        }

        const productInfo = items[0];

        const extractedDetails = {
          productFound: true,
          udiDi: productInfo.diCd || udiDi,
          productName: productInfo.prdlstNm || "N/A", // 제품명
          brand: productInfo.bsshNm || "N/A", // 제조/수입사 명칭
          model: productInfo.mdlNm || "N/A", // 모델명
          permitNum: productInfo.prmitNo || "N/A", // 허가번호
          itemNo: productInfo.itemNo || "N/A", // 품목 번호
          material: productInfo.matrNm || "N/A", // 재료명
          standardCode: productInfo.stdrCd || "N/A", // 표준코드
        };

        logger.info("Extracted Product Details:", extractedDetails);
        // Cloud Functions onRequest should send a response.
        // The data is wrapped in a 'data' object to match the callable client's
        // expectation.
        response.status(200).send({data: extractedDetails});
      } catch (error: unknown) {
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        const axiosError = error as any; // Type assertion for axios error
        logger.error(
          "Error calling data.go.kr API:",
          errorMessage,
          axiosError.response?.data
        );
        response.status(500).send({
          error: {
            message: "Failed to retrieve product details from external API.",
            originalError: errorMessage,
          },
        });
      }
    });
  });
