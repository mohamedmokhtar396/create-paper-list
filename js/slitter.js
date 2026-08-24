/**
 * Slitting Optimizer Module (حاسبة النشر)
 */

// View Switching Logic
window.switchAppView = function(view) {
    const invView = document.getElementById('inventoryView');
    const slitView = document.getElementById('slittingView');
    const navInv = document.getElementById('nav-inventory');
    const navSlit = document.getElementById('nav-slitting');

    if (view === 'inventory') {
        invView.classList.remove('hidden');
        slitView.classList.add('hidden');
        
        navInv.classList.replace('text-indigo-300', 'text-white');
        navInv.classList.replace('border-transparent', 'border-amber-400');
        
        navSlit.classList.replace('text-white', 'text-indigo-300');
        navSlit.classList.replace('border-amber-400', 'border-transparent');
    } else {
        invView.classList.add('hidden');
        slitView.classList.remove('hidden');
        
        navSlit.classList.replace('text-indigo-300', 'text-white');
        navSlit.classList.replace('border-transparent', 'border-amber-400');
        
        navInv.classList.replace('text-white', 'text-indigo-300');
        navInv.classList.replace('border-amber-400', 'border-transparent');
        
        // Initialize slitter data when opened
        slitter.init();
    }
};

const slitter = {
    currentListId: null,
    currentRollId: null,
    
    init() {
        this.populateListSelect();
        this.populateRollSelect();
        this.calculateSlit();
    },

    populateListSelect() {
        const select = document.getElementById('slitListSelect');
        if (!select) return;
        select.innerHTML = '';
        
        appData.lists.forEach(list => {
            const opt = document.createElement('option');
            opt.value = list.id;
            opt.textContent = list.title;
            // Pre-select the currently active list from inventory
            if (list.id === appData.activeListId) {
                opt.selected = true;
                this.currentListId = list.id;
            }
            select.appendChild(opt);
        });

        if (!this.currentListId && appData.lists.length > 0) {
            this.currentListId = appData.lists[0].id;
        }
    },

    onListChange() {
        const select = document.getElementById('slitListSelect');
        this.currentListId = select.value;
        this.populateRollSelect();
        this.calculateSlit();
        this.searchRollForTargets();
    },

    populateRollSelect() {
        const select = document.getElementById('slitRollSelect');
        if (!select) return;
        select.innerHTML = '<option value="">-- اختر بكرة من القائمة --</option>';
        
        const list = appData.lists.find(l => l.id === this.currentListId);
        if (!list || !list.items || list.items.length === 0) return;

        // Use the same aggregation logic as the main inventory
        const aggregatedList = aggregateItemArray(list.items, list.headers);
        const sizeHeader = list.headers.find(h => h.name.includes('مقاس') || h.name.includes('عرض') || h.name.includes('Size'));
        const typeHeader = list.headers.find(h => h.name.includes('نوع') || h.name.includes('Type'));

        aggregatedList.forEach(group => {
            // Because group.groupValues might contain the size and type, let's extract them
            let widthStr = sizeHeader ? (group.groupValues[sizeHeader.id] || group.infoValues[sizeHeader.id]?.[0] || '0') : '0';
            let typeStr = typeHeader ? (group.groupValues[typeHeader.id] || group.infoValues[typeHeader.id]?.[0] || 'بكرة عامة') : 'بكرة عامة';
            
            let numericWidth = parseFloat(toEnglishDigits(widthStr.toString()));
            
            if (numericWidth > 0) {
                const opt = document.createElement('option');
                opt.value = numericWidth;
                let codesStr = group.originalSerials ? group.originalSerials.join(' , ') : '-';
                opt.textContent = `[أكواد: ${codesStr}] ${typeStr} - مقاس: ${numericWidth} سم (الكمية: ${group.count})`;
                select.appendChild(opt);
            }
        });
    },

    onRollChange() {
        document.getElementById('slitManualRoll').value = '';
        this.calculateSlit();
    },

    onManualRollInput() {
        document.getElementById('slitRollSelect').value = '';
        this.calculateSlit();
    },

    getRollWidth() {
        const manual = document.getElementById('slitManualRoll').value;
        if (manual && !isNaN(parseFloat(manual))) return parseFloat(manual);
        const selected = document.getElementById('slitRollSelect').value;
        if (selected && !isNaN(parseFloat(selected))) return parseFloat(selected);
        return 0;
    },

    calculateSlit() {
        const container = document.getElementById('slittingResultContainer');
        const rollWidth = this.getRollWidth();
        let parts = parseInt(document.getElementById('slitParts').value) || 2;
        let wastePerCut = parseFloat(document.getElementById('slitWaste').value) || 0;

        if (rollWidth <= 0) {
            container.innerHTML = '<p class="text-indigo-300 text-sm">قم بتحديد بكرة من القائمة أو إدخال مقاس لعرض النتيجة...</p>';
            return;
        }

        if (parts < 1) parts = 1;

        // Calculate cuts and total waste
        const cuts = parts - 1;
        const totalWaste = cuts * wastePerCut;
        const usableWidth = rollWidth - totalWaste;
        
        if (usableWidth <= 0) {
            container.innerHTML = `<p class="text-rose-400 font-bold text-sm"><i class="fa-solid fa-triangle-exclamation"></i> الهادر الإجمالي أكبر من أو يساوي عرض البكرة!</p>`;
            return;
        }

        const sizePerPart = (usableWidth / parts).toFixed(2);
        
        let html = `
            <div class="flex flex-col gap-4 w-full text-white">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-indigo-800/50 p-3 rounded-lg border border-indigo-500/30">
                        <span class="block text-indigo-300 text-xs mb-1">عرض البكرة الأصلي</span>
                        <span class="font-bold text-xl">${rollWidth} <small class="text-sm">سم</small></span>
                    </div>
                    <div class="bg-rose-900/30 p-3 rounded-lg border border-rose-500/30">
                        <span class="block text-rose-300 text-xs mb-1">إجمالي الهادر (${cuts} نشرة)</span>
                        <span class="font-bold text-xl text-rose-400">${totalWaste} <small class="text-sm">سم</small></span>
                    </div>
                    <div class="bg-emerald-900/40 p-3 rounded-lg border border-emerald-500/30">
                        <span class="block text-emerald-300 text-xs mb-1">مقاس كل جزء (عدد ${parts})</span>
                        <span class="font-bold text-2xl text-emerald-400">${sizePerPart} <small class="text-sm">سم</small></span>
                    </div>
                </div>

                <div class="mt-2 text-center bg-black/20 rounded-lg p-3">
                    <p class="text-sm text-indigo-200">
                        <i class="fa-solid fa-check-circle text-emerald-400 ml-1"></i>
                        المعادلة: (${rollWidth} سم - ${totalWaste} سم هادر كلي) ÷ ${parts} أجزاء = ${sizePerPart} سم لكل جزء.
                    </p>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },

    searchRollForTargets() {
        const container = document.getElementById('slittingSearchContainer');
        const targetStr = document.getElementById('slitTargets').value;
        const wastePerCut = parseFloat(document.getElementById('slitWaste').value) || 0;
        
        if (!targetStr.trim()) {
            container.innerHTML = '<p class="text-slate-400 text-sm">أدخل مقاسات مطلوبة للبحث عن بكرة مناسبة...</p>';
            return;
        }

        const targetSizes = targetStr.split(/[,،]+/).map(s => parseFloat(toEnglishDigits(s.trim()))).filter(n => !isNaN(n) && n > 0);
        
        if (targetSizes.length === 0) {
            container.innerHTML = '<p class="text-rose-500 text-sm font-bold">يرجى إدخال أرقام صحيحة مفصولة بفاصلة.</p>';
            return;
        }

        const cuts = targetSizes.length > 0 ? targetSizes.length - 1 : 0;
        const totalWaste = cuts * wastePerCut;
        const requiredUsableWidth = targetSizes.reduce((a, b) => a + b, 0);
        const totalRequiredWidth = requiredUsableWidth + totalWaste;

        const list = appData.lists.find(l => l.id === this.currentListId);
        if (!list) return;

        const sizeHeader = list.headers.find(h => h.name.includes('مقاس') || h.name.includes('عرض') || h.name.includes('Size'));
        const typeHeader = list.headers.find(h => h.name.includes('نوع') || h.name.includes('Type'));

        if (!sizeHeader) {
            container.innerHTML = '<p class="text-rose-500 text-sm font-bold">لا يوجد عمود للمقاس في القائمة المحددة للبحث فيه.</p>';
            return;
        }

        let suitableRolls = [];

        // Search within aggregated items to avoid duplicates
        const aggregatedList = aggregateItemArray(list.items, list.headers);

        aggregatedList.forEach(group => {
            let widthStr = group.groupValues[sizeHeader.id] || group.infoValues[sizeHeader.id]?.[0] || '0';
            let numericWidth = parseFloat(toEnglishDigits(widthStr.toString()));
            
            if (numericWidth >= totalRequiredWidth) {
                let typeStr = group.groupValues[typeHeader.id] || group.infoValues[typeHeader.id]?.[0] || 'غير محدد';
                let wasteProduced = numericWidth - requiredUsableWidth; // Actual leftover/waste
                
                suitableRolls.push({
                    count: group.count,
                    codes: group.originalSerials ? group.originalSerials.join(' , ') : '-',
                    width: numericWidth,
                    type: typeStr,
                    waste: wasteProduced
                });
            }
        });

        // Sort by least waste (best fit)
        suitableRolls.sort((a, b) => a.waste - b.waste);

        if (suitableRolls.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <p class="text-rose-600 font-bold mb-1"><i class="fa-solid fa-circle-xmark"></i> لم يتم العثور على أي بكرة تناسب المقاسات المطلوبة.</p>
                    <p class="text-xs text-slate-500">إجمالي المقاس المطلوب: ${totalRequiredWidth} سم (بما في ذلك الهادر المحدد ${waste} سم).</p>
                </div>
            `;
            return;
        }

        // Render best options
        let html = `
            <div class="w-full text-right">
                <p class="text-sm font-bold text-slate-700 mb-3">
                    المقاس الإجمالي المطلوب = <span class="text-emerald-600">${totalRequiredWidth} سم</span> (بما في ذلك الهادر)
                </p>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-right border-collapse">
                        <thead>
                            <tr class="bg-emerald-50 text-emerald-800 border-b border-emerald-200">
                                <th class="p-2 border border-slate-200">أكواد البكرات</th>
                                <th class="p-2 border border-slate-200">النوع</th>
                                <th class="p-2 border border-slate-200">مقاس البكرة</th>
                                <th class="p-2 border border-slate-200">الباقي (الهادر الفعلي)</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Show top 5 best fits
        suitableRolls.slice(0, 5).forEach((match, idx) => {
            const isBest = idx === 0;
            html += `
                <tr class="${isBest ? 'bg-emerald-100/50 font-bold' : 'bg-white'}">
                    <td class="p-2 border border-slate-200 text-indigo-700 text-xs">
                        <span class="font-bold">أكواد: [${match.codes}]</span> <br>
                        <span class="text-[10px] text-slate-500">(الكمية المتاحة: ${match.count})</span>
                    </td>
                    <td class="p-2 border border-slate-200">${match.type}</td>
                    <td class="p-2 border border-slate-200">${match.width} سم</td>
                    <td class="p-2 border border-slate-200 text-rose-600">${match.waste.toFixed(2)} سم</td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }
};
