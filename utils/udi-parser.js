// utils/udi-parser.js

/**
 * GS1 Application Identifiers (AIs) that we are interested in.
 */
const AIS = {
    GTIN: '01',
    EXPIRATION_DATE: '17',
    LOT_NUMBER: '10',
    SERIAL_NUMBER: '21',
};

/**
 * Parses a 6-digit GS1 date string (YYMMDD) into a YYYY-MM-DD format.
 */
function _parseGs1Date(dateStr) {
    if (!dateStr || dateStr.length !== 6) return null;

    let year = parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10);
    let day = parseInt(dateStr.substring(4, 6), 10);

    const currentYearFull = new Date().getFullYear();
    const currentCentury = Math.floor(currentYearFull / 100) * 100;
    const yearGuess = currentCentury + year;

    if (yearGuess > currentYearFull + 20) {
        year = (currentCentury - 100) + year;
    } else {
        year = yearGuess;
    }
    
    if (day === 0) {
        day = new Date(year, month, 0).getDate(); 
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const checkDate = new Date(year, month - 1, day);
        if (checkDate.getFullYear() === year && checkDate.getMonth() === month - 1 && checkDate.getDate() === day) {
            const paddedMonth = month.toString().padStart(2, '0');
            const paddedDay = day.toString().padStart(2, '0');
            return `${year}-${paddedMonth}-${paddedDay}`;
        }
    }
    return null;
}

/**
 * Robustly parses a UDI barcode string (GS1-128 or simpler).
 */
export function parseUdiBarcode(udiString) {
    const parsedData = {
        gtin: null,
        expirationDate: null,
        lotNumber: null,
        serialNumber: null,
        barcode: udiString,
        rawUdi: udiString,
    };

    if (!udiString) return parsedData;

    // 1. Try AI-based parsing (GS1-128)
    // Remove invisible control characters like FNC1 (ASCII 29 or <GS>)
    const cleanUdi = udiString.replace(/[\u001D]/g, '');
    
    // Pattern for (AI)Value or AIValue
    const aiPattern = /(\(?\d{2,}\)?)([a-zA-Z0-9]+)/g;
    let match;
    
    while ((match = aiPattern.exec(cleanUdi)) !== null) {
        let ai = match[1].replace(/[()]/g, ''); // Remove parentheses
        const value = match[2];

        // Specific AI Handling
        if (ai === AIS.GTIN) {
            // GTIN is fixed 14 digits. If value is longer, the rest might be another AI
            parsedData.gtin = value.substring(0, 14);
            parsedData.barcode = parsedData.gtin;
            // Adjust regex index if we consumed too much
            if (value.length > 14) aiPattern.lastIndex -= (value.length - 14);
        } else if (ai === AIS.EXPIRATION_DATE) {
            parsedData.expirationDate = _parseGs1Date(value.substring(0, 6));
            if (value.length > 6) aiPattern.lastIndex -= (value.length - 6);
        } else if (ai === AIS.LOT_NUMBER) {
            // Lot number is variable, but often followed by another (AI)
            // This is complex, so we'll just take the whole value for now
            parsedData.lotNumber = value;
        } else if (ai === AIS.SERIAL_NUMBER) {
            parsedData.serialNumber = value;
        }
    }

    // 2. Fallback: If GTIN wasn't found by AI, try to find a 13-14 digit number in the string
    if (!parsedData.gtin) {
        const gtinCandidate = udiString.match(/\d{13,14}/);
        if (gtinCandidate) {
            parsedData.gtin = gtinCandidate[0].padStart(14, '0');
            parsedData.barcode = parsedData.gtin;
        }
    }

    console.log(`Parsed UDI Result for "${udiString}":`, parsedData);
    return parsedData;
}
