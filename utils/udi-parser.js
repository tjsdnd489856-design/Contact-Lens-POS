// utils/udi-parser.js

/**
 * GS1 Application Identifiers (AIs)
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

    year = (yearGuess > currentYearFull + 20) ? (currentCentury - 100) + year : yearGuess;
    
    if (day === 0) day = new Date(year, month, 0).getDate(); 

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const checkDate = new Date(year, month - 1, day);
        if (checkDate.getFullYear() === year && checkDate.getMonth() === month - 1 && checkDate.getDate() === day) {
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
    }
    return null;
}

/**
 * UDI 바코드를 분석하여 GTIN, 유통기한 등을 추출합니다.
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

    // 보이지 않는 제어 문자 제거
    const cleanUdi = udiString.replace(/[\u001D\u001E\u001F\u0004]/g, '').trim();

    // 1. 가장 흔한 GS1-128 패턴 처리 (01로 시작하는 경우)
    if (cleanUdi.startsWith('01') && cleanUdi.length >= 16) {
        parsedData.gtin = cleanUdi.substring(2, 16); // 01 뒤의 14자리 추출
        parsedData.barcode = parsedData.gtin;
        
        let remaining = cleanUdi.substring(16);
        
        // 유통기한(17) 찾기
        if (remaining.startsWith('17') && remaining.length >= 8) {
            parsedData.expirationDate = _parseGs1Date(remaining.substring(2, 8));
            remaining = remaining.substring(8);
        }
        
        // 로트번호(10) 처리 (가변 길이이므로 나머지를 로트로 간주하거나 패턴 매칭)
        if (remaining.startsWith('10')) {
            parsedData.lotNumber = remaining.substring(2);
        }
    } 
    // 2. 880으로 시작하는 일반 바코드 또는 AI가 생략된 경우
    else if (cleanUdi.length === 13 || cleanUdi.length === 14) {
        parsedData.gtin = cleanUdi.padStart(14, '0');
        parsedData.barcode = parsedData.gtin;
    }
    // 3. 기타 복합 패턴 (AI 검색)
    else {
        const gtinMatch = cleanUdi.match(/\(01\)(\d{14})/) || cleanUdi.match(/01(\d{14})/);
        if (gtinMatch) {
            parsedData.gtin = gtinMatch[1];
            parsedData.barcode = parsedData.gtin;
        }
    }

    console.log(`[UDI Parser] Raw: ${udiString} -> GTIN: ${parsedData.gtin}`);
    return parsedData;
}
