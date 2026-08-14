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

// Render Dynamic Header Control Pills
function renderHeadersControl() {
    const list = getActiveList();
    const container = document.getElementById('headersContainer');
    if (!container) return;
    container.innerHTML = '';

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
        container.appendChild(pill);
    });
}

// Render Raw Input Table (Left Panel) with Checkbox, Serial Number & Reordering Drag-and-Drop
function renderRawTable() {
    const list = getActiveList();
    const thead = document.getElementById('rawTableHeader');
    const tbody = document.getElementById('rawTableBody');
    if (!thead || !tbody) return;

    // Header HTML with Reorder & Checkbox columns & Serial No
    let thHTML = '<th class="p-2 border border-slate-200 text-center w-12" title="ترتيب وتحريك الأسطر يدوياً"><i class="fa-solid fa-up-down text-indigo-600"></i></th>';
    thHTML += '<th class="p-2 border border-slate-200 text-center w-8" title="تحديد كصنف خاص/هوالك لجمعه في جدول منفصل"><i class="fa-solid fa-square-check text-indigo-600"></i></th>';
    thHTML += '<th class="p-2 border border-slate-200 text-center w-12" title="كود/الرقم التسلسلي الأصلي للصنف">كود #</th>';
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
        const tr = document.createElement('tr');
        tr.className = item.isSpecial ? "bg-amber-50/60 hover:bg-amber-100/60 transition group cursor-grab" : "hover:bg-indigo-50/50 transition group cursor-grab";
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

        // Checkbox for special item grouping
        tdHTML += `
            <td class="p-1.5 border border-slate-200 text-center">
                <input type="checkbox" ${item.isSpecial ? 'checked' : ''} 
                    onchange="toggleItemSpecial('${item.id}', this.checked)"
                    title="تحديد لجمع هذا الصنف في جدول منفصل (هوالك/مستبعدات)"
                    class="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer">
            </td>
        `;

        // Fixed Original Serial Number / Code
        const serialNoDisplay = formatEnglishNumber(item.serialNo || (item.originalOrder || idx + 1), false);
        tdHTML += `<td class="p-1.5 border border-slate-200 text-center font-extrabold ${item.isSpecial ? 'text-amber-800 bg-amber-100/50' : 'text-indigo-700 bg-slate-100/50'} text-[11px]" title="الرقم التسلسلي الأصلي">${serialNoDisplay}</td>`;
        
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

// Helper: Build HTML Table Rows for an aggregated list array
function buildAggregatedTableSection(aggregatedList, headers, filterText) {
    const sumHeaders = headers.filter(h => h.role === 'sum');
    const filtered = aggregatedList.filter(row => {
        if (!filterText) return true;
        return Object.values(row.groupValues).some(v => v.toString().toLowerCase().includes(filterText)) ||
               Object.values(row.infoValues).some(arr => arr.join(' ').toLowerCase().includes(filterText));
    });

    if (filtered.length === 0) {
        return { html: `<tr><td colspan="${headers.length + 2}" class="p-4 text-center text-slate-400">لا توجد نتائج.</td></tr>`, totals: {} };
    }

    const totals = {};
    sumHeaders.forEach(h => totals[h.id] = 0);
    let rowsHTML = '';

    filtered.forEach((row, idx) => {
        rowsHTML += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">`;
        rowsHTML += `<td class="p-1.5 border border-slate-200 text-center font-bold text-slate-500">${formatEnglishNumber(idx + 1, false)}</td>`;
        
        headers.forEach(h => {
            if (h.role === 'group') {
                const val = row.groupValues[h.id] || '';
                const formatted = formatCellValueWithUnit(val, h.name, false);
                rowsHTML += `<td class="p-1.5 border border-slate-200 font-semibold">${formatted}</td>`;
            } else if (h.role === 'sum') {
                const val = row.sumValues[h.id] || 0;
                totals[h.id] += val;
                const formatted = formatCellValueWithUnit(val, h.name, true);
                rowsHTML += `<td class="p-1.5 border border-slate-200 font-bold text-indigo-700">${formatted}</td>`;
            } else {
                const valArr = (row.infoValues[h.id] || []).filter(Boolean);
                const valStr = valArr.map(v => formatCellValueWithUnit(v, h.name, false)).join(', ');
                rowsHTML += `<td class="p-1.5 border border-slate-200 text-slate-500 text-[11px]">${valStr || '-'}</td>`;
            }
        });
        
        rowsHTML += `<td class="p-1.5 border border-slate-200 text-center font-semibold text-amber-700 bg-amber-50/50">${formatEnglishNumber(row.count, false)}</td></tr>`;
    });

    return { html: rowsHTML, totals };
}

// Render Aggregated Final Results Table (Right Panel)
function renderAggregatedTable() {
    const list = getActiveList();
    const { main, special } = computeAggregatedData();
    const searchInput = document.getElementById('searchInput');
    const filterText = (searchInput ? searchInput.value : '').trim().toLowerCase();

    const titleEl = document.getElementById('exportListTitle');
    const dateEl = document.getElementById('exportDate');
    if (titleEl) titleEl.innerText = list.title;
    if (dateEl) dateEl.innerText = `تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}`;

    const exportArea = document.getElementById('exportableArea');
    if (!exportArea) return;

    // Render Full Aggregated View (Main Table + Optional Special Table)
    let containerHTML = `
        <div class="text-center mb-3 border-b pb-2">
            <h4 class="font-bold text-slate-800 text-sm flex items-center justify-center gap-1.5">
                <span>${list.title}</span>
                <i class="fa-solid fa-pen text-[10px] text-slate-400 hover:text-indigo-600 cursor-pointer" onclick="renameList('${list.id}')" title="تعديل اسم القائمة"></i>
            </h4>
            <p class="text-[10px] text-slate-400" id="exportDate">تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
    `;

    // 1. Main Aggregated Table
    containerHTML += `
        <div class="mb-4">
            <table class="w-full text-right text-xs border-collapse">
                <thead>
                    <tr class="bg-slate-800 text-white font-semibold">
                        <th class="p-1.5 border border-slate-700 text-center">م</th>
    `;
    list.headers.forEach(h => {
        containerHTML += `<th class="p-1.5 border border-slate-700">${h.name}</th>`;
    });
    containerHTML += `<th class="p-1.5 border border-slate-700 text-center">عدد</th></tr></thead><tbody>`;

    const mainRes = buildAggregatedTableSection(main, list.headers, filterText);
    containerHTML += mainRes.html;

    containerHTML += `</tbody><tfoot class="bg-slate-100 font-bold border-t-2 border-slate-300"><tr><td class="p-2 border border-slate-300 text-center">المجموع</td>`;
    list.headers.forEach(h => {
        if (h.role === 'sum') {
            const formattedTotal = formatCellValueWithUnit(mainRes.totals[h.id] || 0, h.name, true);
            containerHTML += `<td class="p-2 border border-slate-300 font-extrabold text-emerald-800">${formattedTotal}</td>`;
        } else {
            containerHTML += `<td class="p-2 border border-slate-300 text-slate-400">-</td>`;
        }
    });
    containerHTML += `<td class="p-2 border border-slate-300 text-center">-</td></tr></tfoot></table></div>`;

    // 2. Special Aggregated Table (If checked items exist)
    if (special.length > 0) {
        const specialTitle = list.specialTableTitle || 'الأصناف المحددة / الهوالك';
        containerHTML += `
            <div class="mt-4 pt-3 border-t-2 border-amber-300">
                <div class="flex justify-between items-center mb-2">
                    <h5 class="font-bold text-amber-800 text-xs flex items-center gap-1.5">
                        <i class="fa-solid fa-square-check text-amber-600"></i> ${specialTitle}
                        <i class="fa-solid fa-pen text-[9px] text-slate-400 hover:text-amber-700 cursor-pointer" onclick="updateSpecialTableTitle()" title="تعديل عنوان جدول الهوالك/الأصناف المحددة"></i>
                    </h5>
                    <span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">جدول منفصل</span>
                </div>
                <table class="w-full text-right text-xs border-collapse">
                    <thead>
                        <tr class="bg-amber-900 text-white font-semibold">
                            <th class="p-1.5 border border-amber-800 text-center">م</th>
        `;
        list.headers.forEach(h => {
            containerHTML += `<th class="p-1.5 border border-amber-800">${h.name}</th>`;
        });
        containerHTML += `<th class="p-1.5 border border-amber-800 text-center">عدد</th></tr></thead><tbody>`;

        const specialRes = buildAggregatedTableSection(special, list.headers, filterText);
        containerHTML += specialRes.html;

        containerHTML += `</tbody><tfoot class="bg-amber-50 font-bold border-t-2 border-amber-300"><tr><td class="p-2 border border-amber-300 text-center">مجموع المحددة</td>`;
        list.headers.forEach(h => {
            if (h.role === 'sum') {
                const formattedTotal = formatCellValueWithUnit(specialRes.totals[h.id] || 0, h.name, true);
                containerHTML += `<td class="p-2 border border-amber-300 font-extrabold text-amber-900">${formattedTotal}</td>`;
            } else {
                containerHTML += `<td class="p-2 border border-amber-300 text-slate-400">-</td>`;
            }
        });
        containerHTML += `<td class="p-2 border border-amber-300 text-center">-</td></tr></tfoot></table></div>`;
    }

    exportArea.innerHTML = containerHTML;
}

// Update Top Dashboard Stats Card
function updateStats() {
    const list = getActiveList();
    const { main, special } = computeAggregatedData();
    const totalAggregatedCount = main.length + special.length;
    
    const statRawCount = document.getElementById('statRawCount');
    const statMergedCount = document.getElementById('statMergedCount');
    const statTotalWeight = document.getElementById('statTotalWeight');

    if (statRawCount) statRawCount.innerText = formatEnglishNumber(list.items.length);
    if (statMergedCount) statMergedCount.innerText = formatEnglishNumber(totalAggregatedCount);

    const sumHeader = list.headers.find(h => h.role === 'sum');
    if (sumHeader && statTotalWeight) {
        const mainTotal = main.reduce((acc, curr) => acc + (curr.sumValues[sumHeader.id] || 0), 0);
        const specialTotal = special.reduce((acc, curr) => acc + (curr.sumValues[sumHeader.id] || 0), 0);
        const total = mainTotal + specialTotal;
        const formattedTotalWithUnit = formatCellValueWithUnit(total, sumHeader.name, true);
        statTotalWeight.innerText = `${formattedTotalWithUnit} (${sumHeader.name})`;
    } else if (statTotalWeight) {
        statTotalWeight.innerText = '0';
    }
}
