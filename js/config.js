// Configuration & Global Helpers

// Telegram Configuration
const TELEGRAM_TOKEN = '8696731458:AAGCmEOkGl5jOxFiaUohWDf3V83FlWdBTTw';
const TELEGRAM_CHAT_ID = '912466383';

// Default Application Initial State with unpacked raw roll items (32 individual rolls)
const defaultState = {
    activeListId: 'list_1',
    lists: [
        {
            id: 'list_1',
            title: 'برستول كوشيه السويس',
            subTitle: 'تقرير الأصناف واللوائح المدمجة',
            specialTableTitle: 'الأصناف المختلفة / الهوالك',
            createdAt: '11/08/2026',
            headers: [
                { id: 'h_type', name: 'النوع', role: 'group' },
                { id: 'h_gram', name: 'الجرام', role: 'group' },
                { id: 'h_size', name: 'المقاس', role: 'group' },
                { id: 'h_weight', name: 'الوزن', role: 'sum' },
                { id: 'h_notes', name: 'ملاحظات', role: 'info' }
            ],
            items: [
                // Raw Unpacked Roll Entries (Main Items)
                { id: 'i_1', originalOrder: 1, serialNo: 1, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '190', h_size: '122.5', h_weight: 532, h_notes: '' },
                { id: 'i_2', originalOrder: 2, serialNo: 2, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '200', h_size: '122', h_weight: 1654, h_notes: '' },
                
                // 3 rolls for (برستول كوشيه - 200 - 114) -> Total 5307 kg
                { id: 'i_3', originalOrder: 3, serialNo: 3, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '200', h_size: '114', h_weight: 1769, h_notes: '' },
                { id: 'i_4', originalOrder: 4, serialNo: 4, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '200', h_size: '114', h_weight: 1769, h_notes: '' },
                { id: 'i_5', originalOrder: 5, serialNo: 5, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '200', h_size: '114', h_weight: 1769, h_notes: '' },
                
                { id: 'i_6', originalOrder: 6, serialNo: 6, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '200', h_size: '118', h_weight: 1182, h_notes: '' },
                
                // 2 rolls for (برستول كوشيه - 200 - 87.8) -> Total 1481 kg
                { id: 'i_7', originalOrder: 7, serialNo: 7, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '200', h_size: '87.8', h_weight: 740, h_notes: '' },
                { id: 'i_8', originalOrder: 8, serialNo: 8, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '200', h_size: '87.8', h_weight: 741, h_notes: '' },
                
                { id: 'i_9', originalOrder: 9, serialNo: 9, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '210', h_size: '114', h_weight: 108, h_notes: '' },
                { id: 'i_10', originalOrder: 10, serialNo: 10, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '210', h_size: '122', h_weight: 1838, h_notes: '' },
                { id: 'i_11', originalOrder: 11, serialNo: 11, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '210', h_size: '87.8', h_weight: 510, h_notes: '' },
                { id: 'i_12', originalOrder: 12, serialNo: 12, isSpecial: false, h_type: 'برستول كوشيه', h_gram: '350', h_size: '135', h_weight: 1752, h_notes: '' },
                { id: 'i_13', originalOrder: 13, serialNo: 13, isSpecial: false, h_type: 'برستول كوشيه ظهر سلوفان', h_gram: '200', h_size: '122', h_weight: 1487, h_notes: 'ظهر سيلفر' },
                { id: 'i_14', originalOrder: 14, serialNo: 14, isSpecial: false, h_type: 'برستول كوشيه لامع', h_gram: '200', h_size: '122', h_weight: 368, h_notes: '' },
                { id: 'i_15', originalOrder: 15, serialNo: 15, isSpecial: false, h_type: 'برستول كوشيه وش + ظهر سلوفان', h_gram: '265', h_size: '114', h_weight: 779, h_notes: 'وش وظهر سلوفان' },
                { id: 'i_16', originalOrder: 16, serialNo: 16, isSpecial: false, h_type: 'برستول كوشيه وش سلوفان', h_gram: '200', h_size: '113', h_weight: 258, h_notes: 'وش سلوفان' },
                { id: 'i_17', originalOrder: 17, serialNo: 17, isSpecial: false, h_type: 'ظهر كرافت', h_gram: '200', h_size: '129', h_weight: 1195, h_notes: '' },
                { id: 'i_18', originalOrder: 18, serialNo: 18, isSpecial: false, h_type: 'ظهر كرافت', h_gram: '200', h_size: '130', h_weight: 314, h_notes: '' },
                { id: 'i_19', originalOrder: 19, serialNo: 19, isSpecial: false, h_type: 'ظهر كرافت', h_gram: '200', h_size: '114', h_weight: 1735, h_notes: '' },
                
                // 2 rolls for (ظهر كرافت - 260 - 130) -> Total 1745 kg
                { id: 'i_20', originalOrder: 20, serialNo: 20, isSpecial: false, h_type: 'ظهر كرافت', h_gram: '260', h_size: '130', h_weight: 872, h_notes: '' },
                { id: 'i_21', originalOrder: 21, serialNo: 21, isSpecial: false, h_type: 'ظهر كرافت', h_gram: '260', h_size: '130', h_weight: 873, h_notes: '' },
                
                { id: 'i_22', originalOrder: 22, serialNo: 22, isSpecial: false, h_type: 'ظهر كرافت', h_gram: '265', h_size: '153', h_weight: 909, h_notes: '' },
                { id: 'i_23', originalOrder: 23, serialNo: 23, isSpecial: false, h_type: 'ظهر كرافت', h_gram: '270', h_size: '151', h_weight: 115, h_notes: '' },
                { id: 'i_24', originalOrder: 24, serialNo: 24, isSpecial: false, h_type: 'ظهر كرافت', h_gram: '275', h_size: '130', h_weight: 1359, h_notes: '' },
                
                // 2 rolls for (كرافت ظهر سلوفان - 260 - 130) -> Total 1352 kg
                { id: 'i_25', originalOrder: 25, serialNo: 25, isSpecial: false, h_type: 'كرافت ظهر سلوفان', h_gram: '260', h_size: '130', h_weight: 676, h_notes: 'ظهر سيلفر شويه صغيرين والباقي ظهر سلوفان فقط' },
                { id: 'i_26', originalOrder: 26, serialNo: 26, isSpecial: false, h_type: 'كرافت ظهر سلوفان', h_gram: '260', h_size: '130', h_weight: 676, h_notes: 'ظهر سيلفر شويه صغيرين والباقي ظهر سلوفان فقط' },
                
                { id: 'i_27', originalOrder: 27, serialNo: 27, isSpecial: false, h_type: 'كرافت وش + ظهر سلوفان', h_gram: '250', h_size: '130', h_weight: 1050, h_notes: 'وش وظهر سلوفان' },
                { id: 'i_28', originalOrder: 28, serialNo: 28, isSpecial: false, h_type: 'وش وظهر سلوفان', h_gram: '290', h_size: '122.5', h_weight: 541, h_notes: 'ظهر سيلفر' },
                
                // Raw Special / Damaged Items (4 rolls)
                { id: 'i_29', originalOrder: 29, serialNo: 29, isSpecial: true, h_type: 'ظهر كرافت بصمه', h_gram: '180', h_size: '114', h_weight: 143, h_notes: 'مربعات' },
                { id: 'i_30', originalOrder: 30, serialNo: 30, isSpecial: true, h_type: 'ظهر كرافت بصمه', h_gram: '190', h_size: '151', h_weight: 194, h_notes: 'مربعات' },
                { id: 'i_31', originalOrder: 31, serialNo: 31, isSpecial: true, h_type: 'ظهر كرافت بصمه', h_gram: '230', h_size: '150', h_weight: 688, h_notes: 'مربعات' },
                { id: 'i_32', originalOrder: 32, serialNo: 32, isSpecial: true, h_type: 'ظهر كرافت مخرم', h_gram: '230', h_size: '150', h_weight: 445, h_notes: '' }
            ]
        }
    ]
};

// Helper: Format Number with English Digits (en-US locale)
function formatEnglishNumber(num, useGrouping = true) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const numberVal = Number(num);
    if (useGrouping) {
        return numberVal.toLocaleString('en-US');
    }
    return numberVal.toString();
}

// Helper: Convert any Arabic Eastern digits (٠-٩) in strings to English digits (0-9)
function toEnglishDigits(str) {
    if (!str && str !== 0) return '';
    return str.toString().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

// Helper: Get connected unit suffix based on column name
function getUnitSuffix(headerName) {
    if (!headerName) return '';
    const cleanName = headerName.trim().toLowerCase();
    if (cleanName.includes('الجرام') || cleanName.includes('جرام')) {
        return 'جم';
    }
    if (cleanName.includes('المقاس') || cleanName.includes('مقاس')) {
        return 'سم';
    }
    if (cleanName.includes('الوزن') || cleanName.includes('وزن')) {
        return 'كجم';
    }
    return '';
}

// Helper: Format cell value with unit suffix and English digits
function formatCellValueWithUnit(value, headerName, isSum = false) {
    if (value === null || value === undefined || value === '') return '-';
    
    const suffix = getUnitSuffix(headerName);
    let strVal = value.toString();

    // Convert any eastern arabic digits to English digits
    strVal = toEnglishDigits(strVal);

    if (isSum) {
        const numVal = parseFloat(strVal) || 0;
        const formattedNum = formatEnglishNumber(numVal);
        return suffix ? `${formattedNum} ${suffix}` : formattedNum;
    }

    if (suffix) {
        if (!strVal.endsWith(suffix)) {
            return `${strVal} ${suffix}`;
        }
    }
    return strVal;
}
