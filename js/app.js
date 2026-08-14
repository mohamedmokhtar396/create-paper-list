// Core Application State & Business Logic

let appData = null;
let draggedRowIndex = null; // For Drag and Drop tracking

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderApp();
});

// Helper: Get Active List with bulletproof activeListId sync
function getActiveList() {
    if (!appData || !appData.lists || !Array.isArray(appData.lists) || appData.lists.length === 0) {
        appData = JSON.parse(JSON.stringify(defaultState));
    }
    
    let list = appData.lists.find(l => l && l.id === appData.activeListId);
    if (!list) {
        list = appData.lists[0];
        if (list) appData.activeListId = list.id;
    }
    if (!list) {
        appData = JSON.parse(JSON.stringify(defaultState));
        list = appData.lists[0];
        appData.activeListId = list.id;
    }
    
    if (!list.subTitle) list.subTitle = 'تقرير الأصناف واللوائح المدمجة';
    
    // Ensure list has categories configured
    if (!list.categories || !Array.isArray(list.categories) || list.categories.length === 0) {
        list.categories = JSON.parse(JSON.stringify(defaultCategories));
    }

    // Ensure list has headers
    if (!list.headers || !Array.isArray(list.headers) || list.headers.length === 0) {
        list.headers = JSON.parse(JSON.stringify(defaultState.lists[0].headers));
    }
    if (!list.items || !Array.isArray(list.items)) {
        list.items = [];
    }

    // Ensure every item has originalOrder, serialNo, itemCode, and categoryId
    const defaultCatId = list.categories[0] ? list.categories[0].id : 'cat_main_1';
    list.items.forEach((item, idx) => {
        if (item.originalOrder === undefined) item.originalOrder = idx + 1;
        if (item.serialNo === undefined) item.serialNo = item.originalOrder;
        if (item.itemCode === undefined) item.itemCode = (item.serialNo || idx + 1).toString();
        if (!item.categoryId) {
            item.categoryId = item.isSpecial ? 'cat_special' : defaultCatId;
        }
    });

    return list;
}

// Master Render Function
function renderApp() {
    getActiveList(); // Sync active list state
    renderListTabs();
    renderHeadersControl();
    renderRawTable();
    renderAggregatedTable();
    updateStats();
    saveToLocalStorage();
}

// List Navigation Logic
function switchList(id) {
    if (!id) return;
    appData.activeListId = id;
    renderApp();
}

function createNewList() {
    const name = prompt('أدخل اسم القائمة الجديدة:', `قائمة وارد ${appData.lists.length + 1}`);
    if (!name || !name.trim()) return;
    const currentList = getActiveList();
    const newList = {
        id: 'list_' + Date.now(),
        title: name.trim(),
        subTitle: 'تقرير الأصناف واللوائح المدمجة',
        createdAt: new Date().toLocaleDateString('en-GB'),
        categories: JSON.parse(JSON.stringify(currentList.categories)),
        headers: JSON.parse(JSON.stringify(currentList.headers)),
        items: []
    };
    appData.lists.push(newList);
    appData.activeListId = newList.id;
    renderApp();
}

function renameList(id, e) {
    if (e) e.stopPropagation();
    const list = appData.lists.find(l => l.id === id);
    if (!list) return;
    const newName = prompt('تعديل اسم القائمة:', list.title);
    if (newName && newName.trim()) {
        list.title = newName.trim();
        renderApp();
    }
}

function updateListSubTitle() {
    const list = getActiveList();
    const newSubTitle = prompt('تعديل ترويسة/وصف التقرير:', list.subTitle || 'تقرير الأصناف واللوائح المدمجة');
    if (newSubTitle !== null) {
        list.subTitle = newSubTitle.trim();
        renderApp();
    }
}

// Custom Table Category Management (Add, Rename, Delete Table Categories)
function addNewTableCategoryPrompt() {
    const name = prompt('أدخل اسم الجدول الجديد (مثال: برستول كوشيه، ظهر كرافت، كرافت وش وظهر، هوالك...):');
    if (!name || !name.trim()) return;
    const list = getActiveList();
    const newCat = {
        id: 'cat_' + Date.now(),
        name: name.trim()
    };
    list.categories.push(newCat);
    renderApp();
}

function renameTableCategory(catId) {
    const list = getActiveList();
    const cat = list.categories.find(c => c.id === catId);
    if (!cat) return;
    const newName = prompt('تعديل اسم الجدول:', cat.name);
    if (newName && newName.trim()) {
        cat.name = newName.trim();
        renderApp();
    }
}

function deleteTableCategory(catId) {
    const list = getActiveList();
    if (!list.categories || list.categories.length <= 1) {
        alert('يجب أن تحتوي القائمة على جدول مخصص واحد على الأقل.');
        return;
    }
    const catToDelete = list.categories.find(c => c.id === catId);
    if (!catToDelete) return;

    if (confirm(`هل أنت متاكد من حذف جدول "${catToDelete.name}"؟ سيتم إعادة توجيه أصنافه تلقائيًا إلى الجدول الأول.`)) {
        list.categories = list.categories.filter(c => c.id !== catId);
        const fallbackCatId = list.categories[0].id;
        list.items.forEach(item => {
            if (item.categoryId === catId) {
                item.categoryId = fallbackCatId;
                item.isSpecial = (fallbackCatId === 'cat_special');
            }
        });
        renderApp();
    }
}

function updateItemCategory(itemId, categoryId) {
    const list = getActiveList();
    const item = list.items.find(i => i.id === itemId);
    if (item) {
        item.categoryId = categoryId;
        item.isSpecial = (categoryId === 'cat_special');
        renderAggregatedTable();
        updateStats();
        saveToLocalStorage();
    }
}

function updateItemCode(itemId, newCode) {
    const list = getActiveList();
    const item = list.items.find(i => i.id === itemId);
    if (item) {
        item.itemCode = toEnglishDigits(newCode.trim());
        renderRawTable();
        renderAggregatedTable();
        saveToLocalStorage();
    }
}

function deleteList(id, e) {
    if (e) e.stopPropagation();
    if (confirm('هل أنت متاكد من حذف هذه القائمة بجميع بياناتها؟')) {
        appData.lists = appData.lists.filter(l => l.id !== id);
        if (appData.lists.length === 0) {
            appData = JSON.parse(JSON.stringify(defaultState));
        } else {
            const listExists = appData.lists.some(l => l.id === appData.activeListId);
            if (!listExists) {
                appData.activeListId = appData.lists[0].id;
            }
        }
        renderApp();
    }
}

function resetDefaultDataPrompt() {
    if (confirm('هل تريد استرجاع قائمة الأصناف الرئيسية الكاملة (32 بكرة فردية مقسمة على جداول مخصصة)؟')) {
        appData = JSON.parse(JSON.stringify(defaultState));
        renderApp();
    }
}

// Restore Original Entry Order (By originalOrder)
function restoreOriginalOrder() {
    const list = getActiveList();
    if (!list.items || list.items.length < 2) return;

    list.items.sort((a, b) => (a.originalOrder || 0) - (b.originalOrder || 0));
    renderApp();
}

// Automatic Smart Sorting (Group by Type, then Sort by Gram Ascending)
function sortItemsAutomatically() {
    const list = getActiveList();
    if (!list.items || list.items.length < 2) return;

    // Identify header for Type and Gram
    const typeHeader = list.headers.find(h => h.name.includes('النوع') || h.id === 'h_type') || list.headers[0];
    const gramHeader = list.headers.find(h => h.name.includes('الجرام') || h.id === 'h_gram') || list.headers[1];

    list.items.sort((a, b) => {
        const typeA = (a[typeHeader.id] || '').toString().trim();
        const typeB = (b[typeHeader.id] || '').toString().trim();
        
        // Primary sort: Type (Arabic locale string comparison)
        const typeCompare = typeA.localeCompare(typeB, 'ar');
        if (typeCompare !== 0) return typeCompare;

        // Secondary sort: Gram (Numerical Ascending from Lowest to Highest)
        const gramA = parseFloat(toEnglishDigits((a[gramHeader.id] || '0').toString())) || 0;
        const gramB = parseFloat(toEnglishDigits((b[gramHeader.id] || '0').toString())) || 0;

        return gramA - gramB;
    });

    renderApp();
}

// Manual Item Reordering (Move Up / Move Down)
function moveItemUp(itemId) {
    const list = getActiveList();
    const idx = list.items.findIndex(i => i.id === itemId);
    if (idx > 0) {
        const temp = list.items[idx];
        list.items[idx] = list.items[idx - 1];
        list.items[idx - 1] = temp;
        renderApp();
    }
}

function moveItemDown(itemId) {
    const list = getActiveList();
    const idx = list.items.findIndex(i => i.id === itemId);
    if (idx !== -1 && idx < list.items.length - 1) {
        const temp = list.items[idx];
        list.items[idx] = list.items[idx + 1];
        list.items[idx + 1] = temp;
        renderApp();
    }
}

// Drag & Drop Handler Functions
function handleDragStart(e, index) {
    draggedRowIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e, targetIndex) {
    e.preventDefault();
    if (draggedRowIndex !== null && draggedRowIndex !== targetIndex) {
        const list = getActiveList();
        const movedItem = list.items.splice(draggedRowIndex, 1)[0];
        list.items.splice(targetIndex, 0, movedItem);
        draggedRowIndex = null;
        renderApp();
    }
}

// Header Control Logic
function cycleHeaderRole(headerId) {
    const list = getActiveList();
    const header = list.headers.find(h => h.id === headerId);
    if (!header) return;
    const roles = ['group', 'sum', 'info'];
    const nextIdx = (roles.indexOf(header.role) + 1) % roles.length;
    header.role = roles[nextIdx];
    renderApp();
}

function addNewHeaderPrompt() {
    const name = prompt('أدخل اسم العمود الجديد:');
    if (!name) return;
    const list = getActiveList();
    const newHeader = {
        id: 'h_' + Date.now(),
        name: name.trim(),
        role: 'info'
    };
    list.headers.push(newHeader);
    renderApp();
}

function renameHeader(headerId) {
    const list = getActiveList();
    const header = list.headers.find(h => h.id === headerId);
    if (!header) return;
    const newName = prompt('تعديل اسم العمود:', header.name);
    if (newName && newName.trim()) {
        header.name = newName.trim();
        renderApp();
    }
}

function deleteHeader(headerId) {
    const list = getActiveList();
    if (confirm('عند حذف العمود سيتم مسح بياناته من هذه القائمة، هل تريد المتابعة؟')) {
        list.headers = list.headers.filter(h => h.id !== headerId);
        renderApp();
    }
}

// Item Special Checkbox Toggle Logic
function toggleItemSpecial(itemId, isChecked) {
    const list = getActiveList();
    const item = list.items.find(i => i.id === itemId);
    if (item) {
        item.isSpecial = isChecked;
        if (isChecked) {
            item.categoryId = 'cat_special';
        } else if (item.categoryId === 'cat_special') {
            item.categoryId = list.categories[0] ? list.categories[0].id : 'cat_main_1';
        }
        renderAggregatedTable();
        updateStats();
        saveToLocalStorage();
    }
}

// Item Table Management Logic
function updateItemValue(itemId, headerId, value) {
    const list = getActiveList();
    const item = list.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Normalize input to english digits
    const cleanedVal = toEnglishDigits(value);
    
    const header = list.headers.find(h => h.id === headerId);
    if (header && header.role === 'sum') {
        item[headerId] = parseFloat(cleanedVal) || 0;
    } else {
        item[headerId] = cleanedVal;
    }
    renderAggregatedTable();
    updateStats();
    saveToLocalStorage();
}

function addNewRow() {
    const list = getActiveList();
    const nextOrder = list.items.length > 0 
        ? Math.max(...list.items.map(i => i.originalOrder || 0)) + 1 
        : 1;

    const defaultCatId = list.categories[0] ? list.categories[0].id : 'cat_main_1';

    const newItem = {
        id: 'i_' + Date.now(),
        originalOrder: nextOrder,
        serialNo: nextOrder,
        itemCode: nextOrder.toString(),
        categoryId: defaultCatId,
        isSpecial: false
    };

    list.headers.forEach(h => {
        newItem[h.id] = h.role === 'sum' ? 0 : '';
    });
    list.items.push(newItem);
    renderRawTable();
    renderAggregatedTable();
    updateStats();
    saveToLocalStorage();
}

function deleteRow(itemId) {
    const list = getActiveList();
    list.items = list.items.filter(i => i.id !== itemId);
    renderRawTable();
    renderAggregatedTable();
    updateStats();
    saveToLocalStorage();
}

function clearCurrentListItems() {
    if (confirm('هل أنت متاكد من مسح جميع عناصر هذه القائمة؟')) {
        const list = getActiveList();
        list.items = [];
        renderApp();
    }
}

// Bulletproof Aggregation Engine Helper
function aggregateItemArray(items, headers) {
    if (!items || !Array.isArray(items)) return [];
    if (!headers || !Array.isArray(headers)) return [];

    const groupHeaders = headers.filter(h => h && h.role === 'group');
    const sumHeaders = headers.filter(h => h && h.role === 'sum');
    const infoHeaders = headers.filter(h => h && h.role === 'info');

    const map = new Map();

    items.forEach(item => {
        if (!item) return;

        const groupKey = groupHeaders
            .map(h => toEnglishDigits((item[h.id] || '').toString().trim().toLowerCase()))
            .join('___');

        if (!map.has(groupKey)) {
            const aggregatedObj = {
                count: 1,
                groupValues: {},
                sumValues: {},
                infoValues: {}
            };
            groupHeaders.forEach(h => aggregatedObj.groupValues[h.id] = toEnglishDigits(item[h.id] || ''));
            sumHeaders.forEach(h => aggregatedObj.sumValues[h.id] = parseFloat(toEnglishDigits(item[h.id])) || 0);
            infoHeaders.forEach(h => {
                const infoVal = toEnglishDigits(item[h.id] || '');
                aggregatedObj.infoValues[h.id] = infoVal ? [infoVal] : [];
            });
            map.set(groupKey, aggregatedObj);
        } else {
            const existing = map.get(groupKey);
            existing.count += 1;
            sumHeaders.forEach(h => {
                const prevSum = existing.sumValues[h.id] || 0;
                existing.sumValues[h.id] = prevSum + (parseFloat(toEnglishDigits(item[h.id])) || 0);
            });
            infoHeaders.forEach(h => {
                if (!existing.infoValues[h.id]) {
                    existing.infoValues[h.id] = [];
                }
                const cleanInfo = toEnglishDigits(item[h.id] || '');
                if (cleanInfo && !existing.infoValues[h.id].includes(cleanInfo)) {
                    existing.infoValues[h.id].push(cleanInfo);
                }
            });
        }
    });

    return Array.from(map.values());
}

// Live Multi-Category Aggregation Engine
function computeAggregatedData() {
    const list = getActiveList();
    const categories = list.categories || defaultCategories;

    const resultCategories = [];

    categories.forEach(cat => {
        const catItems = (list.items || []).filter(i => i.categoryId === cat.id);
        const aggregated = aggregateItemArray(catItems, list.headers);
        
        // Calculate totals for category
        const sumHeader = list.headers.find(h => h.role === 'sum');
        let categoryTotalWeight = 0;
        if (sumHeader) {
            categoryTotalWeight = aggregated.reduce((acc, curr) => acc + (curr.sumValues[sumHeader.id] || 0), 0);
        }

        resultCategories.push({
            id: cat.id,
            name: cat.name,
            isSpecial: cat.id === 'cat_special',
            aggregated: aggregated,
            rawItemCount: catItems.length,
            totalWeight: categoryTotalWeight
        });
    });

    // Catch any uncategorized items
    const catIds = categories.map(c => c.id);
    const uncategorizedItems = (list.items || []).filter(i => !catIds.includes(i.categoryId));
    if (uncategorizedItems.length > 0) {
        const aggregated = aggregateItemArray(uncategorizedItems, list.headers);
        const sumHeader = list.headers.find(h => h.role === 'sum');
        let totalW = 0;
        if (sumHeader) {
            totalW = aggregated.reduce((acc, curr) => acc + (curr.sumValues[sumHeader.id] || 0), 0);
        }
        resultCategories.unshift({
            id: 'cat_default',
            name: 'أصناف عامة',
            isSpecial: false,
            aggregated: aggregated,
            rawItemCount: uncategorizedItems.length,
            totalWeight: totalW
        });
    }

    return resultCategories;
}

// Bulk Paste Modal Functions
function openBulkPasteModal() {
    const list = getActiveList();
    const guide = list.headers.map(h => h.name).join(' | ');
    document.getElementById('pasteColumnsGuide').innerText = guide;
    document.getElementById('bulkPasteTextarea').value = '';
    document.getElementById('bulkPasteModal').classList.remove('hidden');
}

function closeBulkPasteModal() {
    document.getElementById('bulkPasteModal').classList.add('hidden');
}

function processBulkPaste() {
    const text = document.getElementById('bulkPasteTextarea').value.trim();
    if (!text) return closeBulkPasteModal();

    const list = getActiveList();
    const lines = text.split('\n');
    let startOrder = list.items.length > 0 
        ? Math.max(...list.items.map(i => i.originalOrder || 0)) + 1 
        : 1;
    const defaultCatId = list.categories[0] ? list.categories[0].id : 'cat_main_1';

    lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split('\t'); // tab separated
        const newItem = {
            id: 'i_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            originalOrder: startOrder,
            serialNo: startOrder,
            itemCode: startOrder.toString(),
            categoryId: defaultCatId,
            isSpecial: false
        };
        startOrder++;
        
        list.headers.forEach((h, index) => {
            const rawVal = parts[index] ? toEnglishDigits(parts[index].trim()) : '';
            if (h.role === 'sum') {
                newItem[h.id] = parseFloat(rawVal) || 0;
            } else {
                newItem[h.id] = rawVal;
            }
        });
        list.items.push(newItem);
    });

    closeBulkPasteModal();
    renderApp();
}
