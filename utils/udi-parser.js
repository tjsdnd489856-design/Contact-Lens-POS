// utils/udi-parser.js

/**
 * GS1 Application Identifiers (AIs) that we are interested in.
 * Moved to top-level for better scope and reusability.
 */
const AIS = {
    GTIN: '01',
    EXPIRATION_DATE: '17',
    LOT_NUMBER: '10',
    SERIAL_NUMBER: '21',
};

/**
 * Parses a 6-digit GS1 date string (YYMMDD) into a YYYY-MM-DD format.
 * Handles 2-digit year ambiguity and '00' day value.
 * @param {string} dateStr - The 6-digit date string (YYMMDD).
 * @returns {string|null} The date in YYYY-MM-DD format, or null if invalid.
 */
function _parseGs1Date(dateStr) {
    if (!dateStr || dateStr.length !== 6) {
        console.warn(`Invalid GS1 date string length: ${dateStr}`);
        return null;
    }

    let year = parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10);
    let day = parseInt(dateStr.substring(4, 6), 10);

    // Handle 2-digit year (YY) ambiguity using a sliding window.
    // Assumes dates are within 20 years in the future or 80 years in the past from current year.
    const currentYearFull = new Date().getFullYear();
    const currentCentury = Math.floor(currentYearFull / 100) * 100;
    const yearGuess = currentCentury + year;

    if (yearGuess > currentYearFull + 20) { // e.g., current year 2023, barcode year '99' -> 1999
        year = (currentCentury - 100) + year;
    } else { // e.g., current year 2023, barcode year '01' -> 2001
        year = yearGuess;
    }
    
    // Per GS1 spec, a day of '00' means the item expires on the last day of that month.
    if (day === 0) {
        // To get the last day of the current month, we get the 0th day of the *next* month.
        // Date's month is 0-indexed, so `month` (which is 1-12) is used as `month` parameter.
        day = new Date(year, month, 0).getDate(); 
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        // Use Date object for validation, it handles invalid dates by rolling over (e.g., Feb 30 becomes Mar 2)
        const checkDate = new Date(year, month - 1, day); // month - 1 because Date month is 0-indexed
        if (checkDate.getFullYear() === year && checkDate.getMonth() === month - 1 && checkDate.getDate() === day) {
            const paddedMonth = month.toString().padStart(2, '0');
            const paddedDay = day.toString().padStart(2, '0');
            return `${year}-${paddedMonth}-${paddedDay}`;
        }
    }
    
    console.warn(`Invalid date components from GS1: Year=${year}, Month=${month}, Day=${day}`);
    return null;
}

/**
 * Parses a GS1-128 UDI (Unique Device Identification) barcode string.
 * This function extracts common application identifiers (AIs) like GTIN, expiration date,
 * lot number, and serial number.
 * 
 * NOTE: This is a simplified parser and does not implement a full GS1 state machine.
 * It may not correctly parse all GS1-128 barcodes, especially those with complex
 * variable-length fields or multiple FNC1 group separators.
 *
 * @param {string} udiString The raw UDI barcode string.
 * @returns {object} An object containing the parsed data.
 */
export function parseUdiBarcode(udiString) {
    const parsedData = {
        gtin: null,
        expirationDate: null,
        lotNumber: null,
        serialNumber: null,
        barcode: udiString, // Default to the full string, will be replaced by GTIN if found
        rawUdi: udiString,
    };

    let remainingString = udiString;

    // The regex now looks for known AIs at the beginning of the string.
    // It handles optional parentheses around the AI.
    while (remainingString.length > 0) {
        let matched = false;

        // GTIN (AI 01) - fixed 14 digits
        const gtinMatch = remainingString.match(new RegExp(`^\\(?${AIS.GTIN}\\)?(\\d{14})`));
        if (gtinMatch) {
            parsedData.gtin = gtinMatch[1];
            parsedData.barcode = gtinMatch[1]; // GTIN is the primary barcode identifier
            remainingString = remainingString.substring(gtinMatch[0].length);
            matched = true;
        }

        // Expiration Date (AI 17) - fixed 6 digits (YYMMDD)
        if (!matched) {
            const expirationDateMatch = remainingString.match(new RegExp(`^\\(?${AIS.EXPIRATION_DATE}\\)?(\\d{6})`));
            if (expirationDateMatch) {
                parsedData.expirationDate = _parseGs1Date(expirationDateMatch[1]);
                remainingString = remainingString.substring(expirationDateMatch[0].length);
                matched = true;
            }
        }

        // Lot Number (AI 10) - variable length (up to 20 chars), alphanumeric
        // Captures until the next AI or end of string. This is a simplification.
        if (!matched) {
            const lotNumberMatch = remainingString.match(new RegExp(`^\\(?${AIS.LOT_NUMBER}\\)?(.+?)(?=\\(?(?:${AIS.GTIN}|${AIS.EXPIRATION_DATE}|${AIS.SERIAL_NUMBER})\\)?|$)`));
            if (lotNumberMatch && lotNumberMatch[1]) {
                parsedData.lotNumber = lotNumberMatch[1].trim();
                remainingString = remainingString.substring(lotNumberMatch[0].length);
                matched = true;
            }
        }

        // Serial Number (AI 21) - variable length (up to 20 chars), alphanumeric
        // Captures until the next AI or end of string. This is a simplification.
        if (!matched) {
            const serialNumberMatch = remainingString.match(new RegExp(`^\\(?${AIS.SERIAL_NUMBER}\\)?(.+?)(?=\\(?(?:${AIS.GTIN}|${AIS.EXPIRATION_DATE}|${AIS.LOT_NUMBER})\\)?|$)`));
            if (serialNumberMatch && serialNumberMatch[1]) {
                parsedData.serialNumber = serialNumberMatch[1].trim();
                remainingString = remainingString.substring(serialNumberMatch[0].length);
                matched = true;
            }
        }

        // If no known AI is matched in this iteration, break to avoid infinite loops on malformed strings.
        if (!matched) {
            // If the remaining string starts with an unknown AI (two digits possibly followed by value)
            // or just garbage, consume it to prevent infinite loop
            const unknownAIMatch = remainingString.match(/^(\(?\d{2,}\)?.*)/);
            if (unknownAIMatch) {
                 console.warn(`Unknown AI or malformed UDI part: "${unknownAIMatch[1].substring(0, 20)}..." in "${udiString}"`);
                 remainingString = ''; // Clear remaining string to stop
            } else {
                 // No recognized AI pattern, just consume the rest
                 remainingString = '';
            }
            break;
        }
    }

    return parsedData;
}