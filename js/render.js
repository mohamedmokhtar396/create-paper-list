// DOM Rendering Engine for Tabs, Headers, Tables, and Stats Dashboard

// Render List Navigation Tabs
function renderListTabs() {
    const container = document.getElementById('listsTabContainer');
    if (!container) return;
    container.innerHTML = '';

    const activeList = getActiveList();

    appData.lists.forEach((list) => {
        const isActive = list.id === activeList.id;
        const tab = document.createElement('div');
        tab.onclick = () => switchList(list.id);
        tab.className = `flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer font-semibold transition border select-none ${
            isActive 
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300' 
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
        }`;

        tab.innerHTML = `
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-list text-[10px] opacity-70"></i> ${list.title}</span>
            <i class="fa-solid fa-pen text-[10px] hover:text-amber-300 ml-1 cursor-pointer p-0.5" onclick="renameList('${list.id}', event)" title="تعديل اسم القائمة"></i>
            ${appData.lists.length > 1 ? `<i class="fa-solid fa-xmark text-[10px] hover:text-rose-300 cursor-pointer p-0.5" onclick="deleteList('${list.id}', event)" title="حذف القائمة"></i>` : ''}
        `;
        container.appendChild(tab);
    });
}

// Render Dynamic Header Control Pills & Table Category Pills (With Add, Rename & Delete buttons)
function renderHeadersControl() {
    const list = getActiveList();
    const container = document.getElementById('headersContainer');
    if (!container) return;
    container.innerHTML = '';

    // 1. Table Categories Management Section
    const catSection = document.createElement('div');
    catSection.className = "w-full border-b border-slate-200 pb-2.5 mb-2.5 flex flex-wrap items-center gap-2";
    catSection.innerHTML = `<span class="text-xs font-bold text-slate-700 flex items-center gap-1 pl-1"><i class="fa-solid fa-folder-open text-indigo-600"></i> الجداول التجميعية:</span>`;

    (list.categories || defaultCategories).forEach(cat => {
        const catPill = document.createElement('div');
        const isSpecial = cat.id === 'cat_special';
        catPill.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
            isSpecial ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-indigo-50 text-indigo-900 border-indigo-200'
        }`;
        
        catPill.innerHTML = `
            <span>${cat.name}</span>
            <i class="fa-solid fa-pen text-[10px] text-slate-400 hover:text-indigo-600 cursor-pointer px-0.5" onclick="renameTableCategory('${cat.id}')" title="تعديل اسم هذا الجدول"></i>
            ${list.categories.length > 1 ? `<i class="fa-solid fa-trash-can text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer px-0.5" onclick="deleteTableCategory('${cat.id}')" title="حذف هذا الجدول"></i>` : ''}
        `;
        catSection.appendChild(catPill);
    });

    const addCatBtn = document.createElement('button');
    addCatBtn.onclick = addNewTableCategoryPrompt;
    addCatBtn.className = "bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shadow-sm";
    addCatBtn.innerHTML = `<i class="fa-solid fa-plus"></i> إضافة جدول جديد`;
    catSection.appendChild(addCatBtn);

    container.appendChild(catSection);

    // 2. Data Headers Section
    const headersSection = document.createElement('div');
    headersSection.className = "w-full flex flex-wrap items-center gap-2";
    headersSection.innerHTML = `<span class="text-xs font-bold text-slate-700 flex items-center gap-1 pl-1"><i class="fa-solid fa-sliders text-indigo-600"></i> أعمدة البيانات:</span>`;

    list.headers.forEach(h => {
        const pill = document.createElement('div');
        pill.className = "flex items-center gap-1.5 bg-slate-100 border border-slate-300 text-slate-700 px-2.5 py-1 rounded-lg text-xs";
        
        let roleColor = 'bg-slate-200 text-slate-700';
        let roleLabel = 'معلومات';
        if (h.role === 'group') { roleColor = 'bg-indigo-100 text-indigo-800'; roleLabel = 'دمج وتطابق'; }
        if (h.role === 'sum') { roleColor = 'bg-emerald-100 text-emerald-800'; roleLabel = 'جمع أرقام'; }

        pill.innerHTML = `
            <span class="font-bold cursor-pointer hover:text-indigo-600" onclick="renameHeader('${h.id}')" title="انقر لتغيير اسم العمود">${h.name}</span>
            <button onclick="cycleHeaderRole('${h.id}')" class="text-[9px] font-semibold px-1.5 py-0.5 rounded ${roleColor}" title="انقر لتغيير نوع العمود">
                ${roleLabel}
            </button>
            <i class="fa-solid fa-pen text-[10px] text-slate-400 hover:text-indigo-600 cursor-pointer px-0.5" onclick="renameHeader('${h.id}')" title="تعديل اسم العمود"></i>
            ${list.headers.length > 1 ? `<i class="fa-solid fa-trash-can text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer px-0.5" onclick="deleteHeader('${h.id}')"></i>` : ''}
        `;
        headersSection.appendChild(pill);
    });

    container.appendChild(headersSection);
}

// Render Raw Input Table (Left Panel) with Category Dropdown, Editable Code & Drag-and-Drop
function renderRawTable() {
    const list = getActiveList();
    const thead = document.getElementById('rawTableHeader');
    const tbody = document.getElementById('rawTableBody');
    if (!thead || !tbody) return;

    const categories = list.categories || defaultCategories;

    // Header HTML with Reorder, Category Select & Editable Code
    let thHTML = '<th class="p-2 border border-slate-200 text-center w-10" title="ترتيب وتحريك الأسطر يدوياً"><i class="fa-solid fa-up-down text-indigo-600"></i></th>';
    thHTML += '<th class="p-2 border border-slate-200 text-center w-28" title="تحديد الجدول أو تصنيف الصنف">الجدول / التصنيف</th>';
    thHTML += '<th class="p-2 border border-slate-200 text-center w-16" title="كود الصنف (قابل للتعديل يدويًا)">الكود #</th>';
    list.headers.forEach(h => {
        const suffix = getUnitSuffix(h.name);
        const suffixBadge = suffix ? `<span class="text-[10px] text-indigo-500 font-normal ml-1">(${suffix})</span>` : '';
        thHTML += `<th class="p-2 border border-slate-200">${h.name}${suffixBadge}</th>`;
    });
    thHTML += '<th class="p-2 border border-slate-200 text-center w-10"><i class="fa-solid fa-gear"></i></th>';
    thead.innerHTML = thHTML;

    // Rows HTML
    tbody.innerHTML = '';
    if (list.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${list.headers.length + 4}" class="p-6 text-center text-slate-400">لا توجد مدخلات حالية. اضغط على "إضافة صنف" أو "لصق من Excel".</td></tr>`;
        return;
    }

    list.items.forEach((item, idx) => {
        const isSpecial = item.categoryId === 'cat_special' || item.isSpecial;
        const tr = document.createElement('tr');
        tr.className = isSpecial ? "bg-amber-50/60 hover:bg-amber-100/60 transition group cursor-grab" : "hover:bg-indigo-50/50 transition group cursor-grab";
        tr.setAttribute('draggable', 'true');
        tr.setAttribute('ondragstart', `handleDragStart(event, ${idx})`);
        tr.setAttribute('ondragover', 'handleDragOver(event)');
        tr.setAttribute('ondrop', `handleDrop(event, ${idx})`);
        
        // Manual Move Controls & Grip Handle
        let tdHTML = `
            <td class="p-1 border border-slate-200 text-center select-none">
                <div class="flex items-center justify-center gap-1 text-slate-400">
                    <i class="fa-solid fa-grip-vertical text-slate-300 group-hover:text-indigo-600 transition cursor-grab" title="اسحب لتحريك السطر"></i>
                    <div class="flex flex-col">
                        <button onclick="moveItemUp('${item.id}')" ${idx === 0 ? 'disabled' : ''} class="text-[9px] hover:text-indigo-600 disabled:opacity-30 p-0.5" title="تحريك لأعلى"><i class="fa-solid fa-chevron-up"></i></button>
                        <button onclick="moveItemDown('${item.id}')" ${idx === list.items.length - 1 ? 'disabled' : ''} class="text-[9px] hover:text-indigo-600 disabled:opacity-30 p-0.5" title="تحريك لأسفل"><i class="fa-solid fa-chevron-down"></i></button>
                    </div>
                </div>
            </td>
        `;

        // Category Selector Dropdown
        let catOptions = '';
        categories.forEach(cat => {
            const selected = item.categoryId === cat.id ? 'selected' : '';
            catOptions += `<option value="${cat.id}" ${selected}>${cat.name}</option>`;
        });

        tdHTML += `
            <td class="p-1 border border-slate-200 text-center">
                <select onchange="updateItemCategory('${item.id}', this.value)" class="w-full text-[11px] p-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-semibold ${isSpecial ? 'text-amber-800 font-bold' : 'text-slate-700'}">
                    ${catOptions}
                </select>
            </td>
        `;

        // Editable Item Code Input Field
        const currentCode = item.itemCode || item.serialNo || (idx + 1);
        tdHTML += `
            <td class="p-1 border border-slate-200 text-center">
                <input type="text" value="${currentCode}" 
                    onchange="updateItemCode('${item.id}', this.value)"
                    placeholder="كود"
                    title="تعديل كود الصنف يدويًا"
                    class="w-16 p-1 text-center font-extrabold ${isSpecial ? 'text-amber-800 bg-amber-100/50' : 'text-indigo-700 bg-slate-100/50'} text-[11px] border border-transparent focus:border-indigo-400 rounded outline-none transition">
            </td>
        `;
        
        list.headers.forEach(h => {
            const val = item[h.id] !== undefined ? toEnglishDigits(item[h.id]) : '';
            const isNum = h.role === 'sum';
            tdHTML += `
                <td class="p-1 border border-slate-200">
                    <input type="${isNum ? 'number' : 'text'}" value="${val}" 
                        onchange="updateItemValue('${item.id}', '${h.id}', this.value)"
                        placeholder="${isNum ? '0' : ''}"
                        class="w-full p-1 text-xs bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded outline-none transition">
                </td>
            `;
        });
        tdHTML += `
            <td class="p-1 border border-slate-200 text-center">
                <button onclick="deleteRow('${item.id}')" class="text-slate-400 hover:text-rose-600 transition p-1"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tr.innerHTML = tdHTML;
        tbody.appendChild(tr);
    });
}

// Helper: Build HTML Table Rows for an aggregated list array with text-wrap support
function buildAggregatedTableSection(aggregatedList, headers, filterText, isSpecialTable = false) {
    const sumHeaders = headers.filter(h => h.role === 'sum');
    const filtered = aggregatedList.filter(row => {
        if (!filterText) return true;
        return Object.values(row.groupValues).some(v => v.toString().toLowerCase().includes(filterText)) ||
               Object.values(row.infoValues).some(arr => arr.join(' ').toLowerCase().includes(filterText));
    });

    if (filtered.length === 0) {
        return { html: `<tr><td colspan="${headers.length + 2}" class="p-4 text-center text-slate-400">لا توجد أصناف في هذا الجدول.</td></tr>`, totals: {} };
    }

    const totals = {};
    sumHeaders.forEach(h => totals[h.id] = 0);
    let rowsHTML = '';

    filtered.forEach((row, idx) => {
        rowsHTML += `<tr class="${idx % 2 === 0 ? 'bg-white' : (isSpecialTable ? 'bg-amber-50/50' : 'bg-slate-50')}">`;
        rowsHTML += `<td class="p-1.5 border border-slate-200 text-center font-bold text-slate-500 whitespace-nowrap">${formatEnglishNumber(idx + 1, false)}</td>`;
        
        headers.forEach(h => {
            if (h.role === 'group') {
                const val = row.groupValues[h.id] || '';
                const formatted = formatCellValueWithUnit(val, h.name, false);
                rowsHTML += `<td class="p-1.5 border border-slate-200 font-semibold whitespace-normal break-words leading-relaxed">${formatted}</td>`;
            } else if (h.role === 'sum') {
                const val = row.sumValues[h.id] || 0;
                totals[h.id] += val;
                const formatted = formatCellValueWithUnit(val, h.name, true);
                rowsHTML += `<td class="p-1.5 border border-slate-200 font-bold ${isSpecialTable ? 'text-amber-800' : 'text-indigo-700'} whitespace-nowrap">${formatted}</td>`;
            } else {
                const valArr = (row.infoValues[h.id] || []).filter(Boolean);
                const valStr = valArr.map(v => formatCellValueWithUnit(v, h.name, false)).join(', ');
                rowsHTML += `<td class="p-1.5 border border-slate-200 text-slate-600 text-[11px] whitespace-normal break-words leading-relaxed">${valStr || '-'}</td>`;
            }
        });
        
        rowsHTML += `<td class="p-1.5 border border-slate-200 text-center font-semibold text-amber-700 bg-amber-50/50 whitespace-nowrap">${formatEnglishNumber(row.count, false)}</td></tr>`;
    });

    return { html: rowsHTML, totals };
}

// Render Aggregated Final Results Table (Right Panel) with Multi-Table & Text Wrap Support
function renderAggregatedTable() {
    const list = getActiveList();
    const resultCategories = computeAggregatedData();
    const searchInput = document.getElementById('searchInput');
    const filterText = (searchInput ? searchInput.value : '').trim().toLowerCase();

    const titleEl = document.getElementById('exportListTitle');
    const dateEl = document.getElementById('exportDate');
    if (titleEl) titleEl.innerText = list.title;
    if (dateEl) dateEl.innerText = `تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}`;

    const exportArea = document.getElementById('exportableArea');
    if (!exportArea) return;

    let containerHTML = `
        <div class="text-center mb-3 border-b pb-2">
            <h4 class="font-bold text-slate-800 text-sm flex items-center justify-center gap-1.5">
                <span>${list.title}</span>
                <i class="fa-solid fa-pen text-[10px] text-slate-400 hover:text-indigo-600 cursor-pointer" onclick="renameList('${list.id}')" title="تعديل اسم القائمة"></i>
            </h4>
            <p class="text-[10px] text-slate-400" id="exportDate">تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
    `;

    let grandTotalWeight = 0;
    let grandTotalCount = 0;
    const sumHeader = list.headers.find(h => h.role === 'sum');

    // Loop through each Category Table that has items
    resultCategories.forEach((catGroup, index) => {
        if (catGroup.rawItemCount === 0 && resultCategories.length > 1) return; // Skip empty tables if multiple exist

        grandTotalWeight += catGroup.totalWeight;
        grandTotalCount += catGroup.rawItemCount;

        const isSpecial = catGroup.isSpecial;
        const headerBg = isSpecial ? 'bg-amber-900 text-white' : (index % 2 === 0 ? 'bg-slate-800 text-white' : 'bg-indigo-900 text-white');
        const borderTheme = isSpecial ? 'border-amber-300' : 'border-slate-200';

        containerHTML += `
            <div class="mb-5 border ${borderTheme} rounded-xl overflow-hidden shadow-sm">
                <div class="flex justify-between items-center px-3 py-2 ${isSpecial ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'} border-b">
                    <h5 class="font-bold text-xs flex items-center gap-1.5">
                        <i class="fa-solid ${isSpecial ? 'fa-square-check text-amber-600' : 'fa-table text-indigo-600'}"></i>
                        <span>${catGroup.name}</span>
                        <i class="fa-solid fa-pen text-[9px] text-slate-400 hover:text-indigo-600 cursor-pointer" onclick="renameTableCategory('${catGroup.id}')" title="تعديل اسم هذا الجدول"></i>
                        ${list.categories.length > 1 ? `<i class="fa-solid fa-trash-can text-[9px] text-slate-400 hover:text-rose-600 cursor-pointer" onclick="deleteTableCategory('${catGroup.id}')" title="حذف هذا الجدول"></i>` : ''}
                    </h5>
                    <span class="text-[10px] font-bold ${isSpecial ? 'bg-amber-200 text-amber-900' : 'bg-indigo-100 text-indigo-800'} px-2 py-0.5 rounded-full">
                        إجمالي الجدول: ${sumHeader ? formatCellValueWithUnit(catGroup.totalWeight, sumHeader.name, true) : formatEnglishNumber(catGroup.totalWeight)}
                    </span>
                </div>

                <table class="w-full text-right text-xs border-collapse">
                    <thead>
                        <tr class="${headerBg}">
                            <th class="p-1.5 border border-slate-700 text-center w-8">م</th>
        `;

        list.headers.forEach(h => {
            containerHTML += `<th class="p-1.5 border border-slate-700">${h.name}</th>`;
        });
        containerHTML += `<th class="p-1.5 border border-slate-700 text-center w-12">عدد</th></tr></thead><tbody>`;

        const sectionRes = buildAggregatedTableSection(catGroup.aggregated, list.headers, filterText, isSpecial);
        containerHTML += sectionRes.html;

        containerHTML += `</tbody><tfoot class="${isSpecial ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-800'} font-bold border-t-2"><tr><td class="p-2 border text-center">مجموع الجدول</td>`;
        
        list.headers.forEach(h => {
            if (h.role === 'sum') {
                const formattedTotal = formatCellValueWithUnit(sectionRes.totals[h.id] || 0, h.name, true);
                containerHTML += `<td class="p-2 border font-extrabold ${isSpecial ? 'text-amber-900' : 'text-emerald-800'}">${formattedTotal}</td>`;
            } else {
                containerHTML += `<td class="p-2 border text-slate-400">-</td>`;
            }
        });
        containerHTML += `<td class="p-2 border text-center">-</td></tr></tfoot></table></div>`;
    });

    // Grand Total Summary Card at Bottom
    containerHTML += `
        <div class="mt-4 p-3 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-indigo-700 flex flex-wrap justify-between items-center gap-2">
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-calculator text-amber-400 text-base"></i>
                <span class="font-extrabold text-xs">إجمالي الشحنة الكلي (جميع الجداول):</span>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-xs bg-white/10 px-2.5 py-1 rounded-lg">عدد الرولات/البكرات: <strong class="text-amber-300 font-bold">${formatEnglishNumber(grandTotalCount)}</strong></span>
                <span class="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/30">الوزن الإجمالي الكلي: <strong class="text-emerald-300 font-extrabold">${sumHeader ? formatCellValueWithUnit(grandTotalWeight, sumHeader.name, true) : formatEnglishNumber(grandTotalWeight)}</strong></span>
            </div>
        </div>
    `;

    exportArea.innerHTML = containerHTML;
}

// Update Top Dashboard Stats Card
function updateStats() {
    const list = getActiveList();
    const resultCategories = computeAggregatedData();
    
    let grandTotalWeight = 0;
    let grandMergedCount = 0;

    resultCategories.forEach(catGroup => {
        grandTotalWeight += catGroup.totalWeight;
        grandMergedCount += catGroup.aggregated.length;
    });

    const statRawCount = document.getElementById('statRawCount');
    const statMergedCount = document.getElementById('statMergedCount');
    const statTotalWeight = document.getElementById('statTotalWeight');

    if (statRawCount) statRawCount.innerText = formatEnglishNumber(list.items.length);
    if (statMergedCount) statMergedCount.innerText = formatEnglishNumber(grandMergedCount);

    const sumHeader = list.headers.find(h => h.role === 'sum');
    if (sumHeader && statTotalWeight) {
        const formattedTotalWithUnit = formatCellValueWithUnit(grandTotalWeight, sumHeader.name, true);
        statTotalWeight.innerText = `${formattedTotalWithUnit} (${sumHeader.name})`;
    } else if (statTotalWeight) {
        statTotalWeight.innerText = '0';
    }
}
