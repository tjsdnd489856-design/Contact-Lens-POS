// utils/udi-parser.js

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

    // GS1 Application Identifiers (AIs) that we are interested in.
    const AIS = {
        GTIN: '01',
        EXPIRATION_DATE: '17',
        LOT_NUMBER: '10',
        SERIAL_NUMBER: '21',
    };

    let remainingString = udiString;

    // The regex now looks for known AIs at the beginning of the string.
    // It handles optional parentheses around the AI.
    while (remainingString.length > 0) {
        const gtinMatch = remainingString.match(new RegExp(`^\\(?${AIS.GTIN}\\)?(\\d{14})`));
        if (gtinMatch) {
            parsedData.gtin = gtinMatch[1];
            parsedData.barcode = gtinMatch[1]; // GTIN is the primary barcode identifier
            remainingString = remainingString.substring(gtinMatch[0].length);
            continue;
        }

        const expirationDateMatch = remainingString.match(new RegExp(`^\\(?${AIS.EXPIRATION_DATE}\\)?(\\d{6})`));
        if (expirationDateMatch) {
            const dateStr = expirationDateMatch[1];
            const month = dateStr.substring(2, 4);
            const day = dateStr.substring(4, 6);
            
            // Handle 2-digit year (YY) ambiguity using a sliding window.
            // If the expiration year is more than 20 years in the future,
            // assume it's in the last century. Otherwise, current century.
            let year = parseInt(dateStr.substring(0, 2), 10);
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            const yearGuess = currentCentury + year;

            if (yearGuess > currentYear + 20) {
                year = (currentCentury - 100) + year;
            } else {
                year = yearGuess;
            }

            if (parseInt(month) >= 1 && parseInt(month) <= 12 && parseInt(day) >= 1 && parseInt(day) <= 31) {
                parsedData.expirationDate = `${year}-${month}-${day}`;
            } else {
                console.warn(`Invalid expiration date format from UDI: ${dateStr}`);
            }
            remainingString = remainingString.substring(expirationDateMatch[0].length);
            continue;
        }

        // For variable-length fields like Lot and Serial Number, we capture until the next AI or end of string.
        // This is a simplification. A proper implementation uses FNC1 group separators.
        const lotNumberMatch = remainingString.match(new RegExp(`^\\(?${AIS.LOT_NUMBER}\\)?(.+?)(?=\\(?(?:${AIS.GTIN}|${AIS.EXPIRATION_DATE}|${AIS.SERIAL_NUMBER})\\)?|$)`));
        if (lotNumberMatch && lotNumberMatch[1]) {
            parsedData.lotNumber = lotNumberMatch[1].trim();
            remainingString = remainingString.substring(lotNumberMatch[0].length);
            continue;
        }

        const serialNumberMatch = remainingString.match(new RegExp(`^\\(?${AIS.SERIAL_NUMBER}\\)?(.+?)(?=\\(?(?:${AIS.GTIN}|${AIS.EXPIRATION_DATE}|${AIS.LOT_NUMBER})\\)?|$)`));
        if (serialNumberMatch && serialNumberMatch[1]) {
            parsedData.serialNumber = serialNumberMatch[1].trim();
            remainingString = remainingString.substring(serialNumberMatch[0].length);
            continue;
        }

        // If no known AI is matched, break the loop to avoid infinite loops on malformed strings.
        break;
    }

    return parsedData;
}
