// Export Engine: Fixed PDF Generation, Image, Word & Telegram PDF Sending with Preview & Custom Filename

let currentExportType = null;

// Open Preview Modal
function triggerExportPreview(type) {
    currentExportType = type;
    const modal = document.getElementById('previewModal');
    const titleEl = document.getElementById('previewModalTitle');
    const badgeEl = document.getElementById('previewModalBadge');
    const actionBtn = document.getElementById('previewModalActionBtn');
    const previewContent = document.getElementById('previewModalContent');
    const fileNameInput = document.getElementById('exportFileName');

    if (!modal || !previewContent) return;

    const list = getActiveList();
    if (fileNameInput) {
        fileNameInput.value = `${list.title}_المدمجة`;
    }

    // Configure Modal Header and Action Button depending on export type
    if (type === 'pdf') {
        titleEl.innerText = 'معاينة ملف PDF قبل التنزيل';
        badgeEl.innerText = 'تصدير PDF';
        badgeEl.className = 'bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold';
        actionBtn.className = 'px-5 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5';
        actionBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> تحميل PDF الأن';
        actionBtn.onclick = executePDFExport;
    } else if (type === 'image') {
        titleEl.innerText = 'معاينة صورة التقرير قبل التنزيل';
        badgeEl.innerText = 'تصدير صورة';
        badgeEl.className = 'bg-sky-100 text-sky-800 text-xs px-2.5 py-1 rounded-full font-bold';
        actionBtn.className = 'px-5 py-2 text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5';
        actionBtn.innerHTML = '<i class="fa-solid fa-file-image"></i> تحميل الصورة الأن';
        actionBtn.onclick = executeImageExport;
    } else if (type === 'word') {
        titleEl.innerText = 'معاينة مستند Word قبل التنزيل';
        badgeEl.innerText = 'تصدير Word';
        badgeEl.className = 'bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold';
        actionBtn.className = 'px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5';
        actionBtn.innerHTML = '<i class="fa-solid fa-file-word"></i> تحميل مستند Word';
        actionBtn.onclick = executeWordExport;
    } else if (type === 'telegram') {
        titleEl.innerText = 'معاينة ملف PDF قبل الإرسال للتليجرام';
        badgeEl.innerText = 'إرسال تليجرام (PDF)';
        badgeEl.className = 'bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold';
        actionBtn.className = 'px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5';
        actionBtn.innerHTML = '<i class="fa-paper-plane"></i> إرسال ملف PDF عبر التليجرام';
        actionBtn.onclick = executeTelegramPDFExport;
    }

    // Render Clean Preview HTML
    const cleanElement = buildCleanExportHTML();
    previewContent.innerHTML = '';
    previewContent.appendChild(cleanElement);

    // Show Modal
    modal.classList.remove('hidden');
}

// Close Preview Modal
function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.classList.add('hidden');
}

// Helper: Get sanitized export file name
function getExportFileName(fallbackName = 'تقرير_الأصناف', extension = '') {
    const input = document.getElementById('exportFileName');
    let name = input && input.value.trim() ? input.value.trim() : fallbackName;
    name = name.replace(/[/\\?%*:|"<>]/g, '-'); // Sanitize filename
    if (extension && !name.endsWith(extension)) {
        name += extension;
    }
    return name;
}

// Helper: Build a Clean, Full-Width HTML Element for Printing & Exporting
function buildCleanExportHTML() {
    const list = getActiveList();
    const { main, special } = computeAggregatedData();
    const sumHeaders = list.headers.filter(h => h.role === 'sum');

    const wrapper = document.createElement('div');
    wrapper.id = 'pdfExportContainer';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.color = '#1e293b';
    wrapper.style.padding = '20px';
    wrapper.style.fontFamily = "'Cairo', sans-serif";
    wrapper.style.direction = 'rtl';
    wrapper.style.width = '750px';
    wrapper.style.margin = '0 auto';
    wrapper.style.boxSizing = 'border-box';

    // Title & Metadata
    let html = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px;">
            <h2 style="margin: 0 0 6px 0; color: #0f172a; font-size: 20px; font-weight: 800;">${list.title}</h2>
            <p style="margin: 0 0 4px 0; color: #475569; font-size: 12px; font-weight: 600;">${list.subTitle || 'تقرير الأصناف واللوائح المدمجة'}</p>
            <p style="margin: 0; color: #64748b; font-size: 11px;">تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
    `;

    // Function to render table HTML string for an aggregated set
    const renderTableHTML = (items, tableTitle = '', isSpecialTable = false) => {
        let tableHTML = '';
        if (tableTitle) {
            tableHTML += `<h3 style="margin: 16px 0 8px 0; color: ${isSpecialTable ? '#92400e' : '#1e293b'}; font-size: 14px; font-weight: 800;">${tableTitle}</h3>`;
        }

        tableHTML += `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <thead>
                    <tr style="background-color: ${isSpecialTable ? '#78350f' : '#1e293b'}; color: #ffffff;">
                        <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 35px; font-size: 11px;">م</th>
        `;

        list.headers.forEach(h => {
            tableHTML += `<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-size: 11px;">${h.name}</th>`;
        });

        tableHTML += `<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 50px; font-size: 11px;">عدد</th></tr></thead><tbody>`;

        const totals = {};
        sumHeaders.forEach(h => totals[h.id] = 0);

        if (items.length === 0) {
            tableHTML += `<tr><td colspan="${list.headers.length + 2}" style="border: 1px solid #cbd5e1; text-align: center; color: #94a3b8; padding: 15px; font-size: 11px;">لا توجد بيانات.</td></tr>`;
        } else {
            items.forEach((row, idx) => {
                tableHTML += `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : (isSpecialTable ? '#fffbeb' : '#f8fafc')};">`;
                tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: #475569; font-size: 11px;">${formatEnglishNumber(idx + 1, false)}</td>`;
                
                list.headers.forEach(h => {
                    if (h.role === 'group') {
                        const val = row.groupValues[h.id] || '';
                        const formatted = formatCellValueWithUnit(val, h.name, false);
                        tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: 600; font-size: 11px;">${formatted}</td>`;
                    } else if (h.role === 'sum') {
                        const val = row.sumValues[h.id] || 0;
                        totals[h.id] += val;
                        const formatted = formatCellValueWithUnit(val, h.name, true);
                        tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: 700; color: ${isSpecialTable ? '#92400e' : '#4338ca'}; font-size: 11px;">${formatted}</td>`;
                    } else {
                        const valArr = (row.infoValues[h.id] || []).filter(Boolean);
                        const valStr = valArr.map(v => formatCellValueWithUnit(v, h.name, false)).join(', ');
                        tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; color: #64748b; font-size: 10px;">${valStr || '-'}</td>`;
                    }
                });

                tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: #b45309; background-color: #fef3c7; font-size: 11px;">${formatEnglishNumber(row.count, false)}</td></tr>`;
            });
        }

        tableHTML += `</tbody><tfoot><tr style="background-color: ${isSpecialTable ? '#fef3c7' : '#f1f5f9'}; font-weight: bold;"><td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11px;">المجموع</td>`;

        list.headers.forEach(h => {
            if (h.role === 'sum') {
                const formattedTotal = formatCellValueWithUnit(totals[h.id], h.name, true);
                tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; font-weight: 800; color: ${isSpecialTable ? '#78350f' : '#047857'}; font-size: 11px;">${formattedTotal}</td>`;
            } else {
                tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #94a3b8; font-size: 11px;">-</td>`;
            }
        });

        tableHTML += `<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 11px;">-</td></tr></tfoot></table>`;
        return tableHTML;
    };

    // Render Main Table
    html += renderTableHTML(main, 'الأصناف المدمجة الرئيسية', false);

    // Render Special Table if checked items exist
    if (special.length > 0) {
        html += renderTableHTML(special, list.specialTableTitle || 'الأصناف المحددة / الهوالك', true);
    }

    wrapper.innerHTML = html;
    return wrapper;
}

// PDF Download Execution
async function executePDFExport() {
    const listTitle = getActiveList().title;
    const fileName = getExportFileName(`${listTitle}_المدمجة`, '.pdf');
    const actionBtn = document.getElementById('previewModalActionBtn');
    const originalText = actionBtn.innerHTML;

    try {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري توليد PDF...';

        const element = document.getElementById('pdfExportContainer') || document.getElementById('previewModalContent');

        const opt = {
            margin:       [8, 8, 8, 8],
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.95 },
            html2canvas:  { scale: 1.5, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(element).save();
        closePreviewModal();
    } catch (err) {
        console.error('PDF export error:', err);
        alert('حدث خطأ أثناء تصدير ملف PDF.');
    } finally {
        actionBtn.disabled = false;
        actionBtn.innerHTML = originalText;
    }
}

// Image Download Execution
async function executeImageExport() {
    const listTitle = getActiveList().title;
    const fileName = getExportFileName(`${listTitle}_المدمجة`, '.png');
    const actionBtn = document.getElementById('previewModalActionBtn');
    const originalText = actionBtn.innerHTML;

    try {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التوليد...';

        const element = document.getElementById('pdfExportContainer') || document.getElementById('previewModalContent');

        const canvas = await html2canvas(element, { scale: 1.8, useCORS: true, scrollX: 0, scrollY: 0 });

        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL("image/png");
        link.click();
        closePreviewModal();
    } catch (err) {
        console.error('Image export error:', err);
        alert('حدث خطأ أثناء تصدير الصورة.');
    } finally {
        actionBtn.disabled = false;
        actionBtn.innerHTML = originalText;
    }
}

// Word Download Execution
function executeWordExport() {
    const list = getActiveList();
    const fileName = getExportFileName(`${list.title}_المدمجة`, '.doc');
    const cleanElement = buildCleanExportHTML();
    
    let htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${list.title}</title>
    <style>
        body { font-family: Cairo, Arial, sans-serif; direction: rtl; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th, td { border: 1px solid #333; padding: 6px 10px; text-align: right; font-size: 12px; }
        th { background-color: #1e293b; color: #fff; }
        tfoot td { background-color: #f1f5f9; font-weight: bold; }
    </style>
    </head><body>
    ${cleanElement.innerHTML}
    </body></html>`;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    closePreviewModal();
}

// Optimized Telegram PDF File Sending Execution with 20s timeout and fast rendering
async function executeTelegramPDFExport() {
    const list = getActiveList();
    const { main, special } = computeAggregatedData();
    const totalCount = main.length + special.length;
    const fileName = getExportFileName(`${list.title}_المدمجة`, '.pdf');

    const actionBtn = document.getElementById('previewModalActionBtn');
    const originalText = actionBtn.innerHTML;

    if (totalCount === 0) {
        alert('لا توجد بيانات مدمجة لإرسالها.');
        return;
    }

    try {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التجهيز والرفع...';

        // 1. Optimized Fast PDF Blob Generation
        const element = document.getElementById('pdfExportContainer') || document.getElementById('previewModalContent');

        const opt = {
            margin:       [8, 8, 8, 8],
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.90 },
            html2canvas:  { scale: 1.2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfWorker = html2pdf().set(opt).from(element);
        const pdfBlob = await pdfWorker.output('blob');

        // 2. Prepare Telegram FormData payload
        const sumHeader = list.headers.find(h => h.role === 'sum');
        let totalSumStr = '';
        if (sumHeader) {
            const mainTotal = main.reduce((acc, curr) => acc + (curr.sumValues[sumHeader.id] || 0), 0);
            const specialTotal = special.reduce((acc, curr) => acc + (curr.sumValues[sumHeader.id] || 0), 0);
            const grandTotal = mainTotal + specialTotal;
            totalSumStr = `\n📊 إجمالي ${sumHeader.name}: ${formatCellValueWithUnit(grandTotal, sumHeader.name, true)}`;
        }

        const caption = `📦 *تقرير الأصناف المدمجة*: ${list.title}\n📅 *التاريخ*: ${new Date().toLocaleDateString('en-GB')}\n📋 *عدد الأصناف المدمجة*: ${formatEnglishNumber(totalCount)}${totalSumStr}`;

        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('document', pdfBlob, fileName);
        formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');

        // 3. Send to Telegram sendDocument API with 20s Abort Controller timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const resData = await response.json();
        if (resData.ok) {
            alert('تم إرسال ملف الـ PDF عبر التليجرام بنجاح! 🚀');
            closePreviewModal();
        } else {
            alert('تعذر الإرسال عبر التليجرام: ' + (resData.description || 'تأكد من الاتصال بالشبكة'));
        }
    } catch (err) {
        console.error('Telegram send document error:', err);
        if (err.name === 'AbortError') {
            alert('استغرق الاتصال بالتليجرام وقتاً طويلاً. يرجى التأكد من جودة الاتصال بالإنترنت، أو استخدام زر "تحميل PDF" مباشرة.');
        } else {
            alert('عفواً، فشل الاتصال بخدمة التليجرام. يمكنك استخدام زر "تحميل PDF" وتنزيل الملف على جهازك.');
        }
    } finally {
        actionBtn.disabled = false;
        actionBtn.innerHTML = originalText;
    }
}
