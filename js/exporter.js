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

// Helper: Clean Cell Value Formatter for PDF & Canvas (Uses non-breaking spaces for zero text overlap)
function formatPdfCellValueWithUnit(value, headerName, isSum = false) {
    if (value === null || value === undefined || value === '') return '-';
    
    const suffix = getUnitSuffix(headerName);
    let strVal = toEnglishDigits(value.toString());

    if (isSum) {
        const numVal = parseFloat(strVal) || 0;
        const formattedNum = formatEnglishNumber(numVal);
        return suffix ? `${formattedNum}\u00A0${suffix}` : formattedNum;
    }

    if (suffix) {
        if (strVal.endsWith(suffix)) {
            strVal = strVal.replace(suffix, '').trim();
        }
        return `${strVal}\u00A0${suffix}`;
    }
    return strVal;
}

// Helper: Build Clean Dynamic-Width A4 HTML Element for Printing & PDF Exports
function buildCleanExportHTML() {
    const list = getActiveList();
    const resultCategories = computeAggregatedData();
    const sumHeaders = list.headers.filter(h => h.role === 'sum');
    const sumHeader = list.headers.find(h => h.role === 'sum');

    const wrapper = document.createElement('div');
    wrapper.id = 'pdfExportContainer';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.color = '#1e293b';
    wrapper.style.padding = '16px';
    wrapper.style.fontFamily = "Tahoma, Arial, sans-serif";
    wrapper.style.direction = 'rtl';
    wrapper.style.width = '750px'; // Fits A4 portrait perfectly
    wrapper.style.margin = '0 auto';
    wrapper.style.boxSizing = 'border-box';

    // Title & Metadata Header
    let html = `
        <div style="text-align: center; margin-bottom: 16px; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px;">
            <h2 style="margin: 0 0 4px 0; color: #0f172a; font-size: 18px; font-weight: 800;">${list.title}</h2>
            <p style="margin: 0 0 4px 0; color: #475569; font-size: 11px; font-weight: 600;">${list.subTitle || 'تقرير الأصناف واللوائح المدمجة'}</p>
            <p style="margin: 0; color: #64748b; font-size: 10px;">تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
    `;

    let grandTotalWeight = 0;
    let grandTotalCount = 0;

    // Loop through each active table category
    resultCategories.forEach((catGroup) => {
        if (catGroup.rawItemCount === 0 && resultCategories.length > 1) return;

        grandTotalWeight += catGroup.totalWeight;
        grandTotalCount += catGroup.rawItemCount;

        const isSpecial = catGroup.isSpecial;
        const tableHeaderBg = isSpecial ? '#78350f' : '#1e293b';
        const titleColor = isSpecial ? '#92400e' : '#0f172a';

        html += `
            <div style="margin-bottom: 20px; width: 100%; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <h3 style="margin: 0; color: ${titleColor}; font-size: 13px; font-weight: 800;">${catGroup.name}</h3>
                    <span style="font-size: 10px; font-weight: bold; color: ${isSpecial ? '#78350f' : '#4338ca'}; background-color: ${isSpecial ? '#fef3c7' : '#e0e7ff'}; padding: 2px 8px; border-radius: 4px;">
                        إجمالي الجدول: ${sumHeader ? formatCellValueWithUnit(catGroup.totalWeight, sumHeader.name, true) : formatEnglishNumber(catGroup.totalWeight)}
                    </span>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; table-layout: auto; box-sizing: border-box;">
                    <thead>
                        <tr style="background-color: ${tableHeaderBg}; color: #ffffff;">
                            <th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px; white-space: nowrap; width: 35px;">م</th>
        `;

        // Dynamic auto-sizing headers
        list.headers.forEach(h => {
            const isNum = h.role === 'sum' || h.name.includes('الجرام') || h.name.includes('المقاس') || h.name.includes('الوزن');
            const align = isNum ? 'center' : 'right';
            html += `<th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: ${align}; font-size: 11px; white-space: nowrap;">${h.name}</th>`;
        });

        html += `<th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px; white-space: nowrap; width: 45px;">عدد</th></tr></thead><tbody>`;

        const totals = {};
        sumHeaders.forEach(h => totals[h.id] = 0);

        if (catGroup.aggregated.length === 0) {
            html += `<tr><td colspan="${list.headers.length + 2}" style="border: 1px solid #cbd5e1; text-align: center; color: #94a3b8; padding: 12px; font-size: 10px;">لا توجد بيانات.</td></tr>`;
        } else {
            catGroup.aggregated.forEach((row, idx) => {
                html += `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : (isSpecial ? '#fffbeb' : '#f8fafc')};">`;
                html += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: #475569; font-size: 11px; white-space: nowrap;">${formatEnglishNumber(idx + 1, false)}</td>`;
                
                list.headers.forEach(h => {
                    const isNum = h.role === 'sum' || h.name.includes('الجرام') || h.name.includes('المقاس') || h.name.includes('الوزن');
                    const align = isNum ? 'center' : 'right';

                    if (h.role === 'group') {
                        const val = row.groupValues[h.id] || '';
                        const formatted = formatPdfCellValueWithUnit(val, h.name, false);
                        html += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: ${align}; font-weight: 600; font-size: 11px; white-space: normal; word-break: break-word; line-height: 1.4;">${formatted}</td>`;
                    } else if (h.role === 'sum') {
                        const val = row.sumValues[h.id] || 0;
                        totals[h.id] += val;
                        const formatted = formatPdfCellValueWithUnit(val, h.name, true);
                        html += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: 700; color: ${isSpecial ? '#92400e' : '#4338ca'}; font-size: 11px; white-space: nowrap;">${formatted}</td>`;
                    } else {
                        const valArr = (row.infoValues[h.id] || []).filter(Boolean);
                        const valStr = valArr.map(v => formatPdfCellValueWithUnit(v, h.name, false)).join(', ');
                        html += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: ${align}; color: #64748b; font-size: 10px; white-space: normal; word-break: break-word;">${valStr || '-'}</td>`;
                    }
                });

                html += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: #b45309; background-color: #fef3c7; font-size: 11px; white-space: nowrap;">${formatEnglishNumber(row.count, false)}</td></tr>`;
            });
        }

        html += `</tbody><tfoot><tr style="background-color: ${isSpecial ? '#fef3c7' : '#f1f5f9'}; font-weight: bold;"><td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px;">المجموع</td>`;

        list.headers.forEach(h => {
            const isNum = h.role === 'sum' || h.name.includes('الجرام') || h.name.includes('المقاس') || h.name.includes('الوزن');
            const align = isNum ? 'center' : 'right';

            if (h.role === 'sum') {
                const formattedTotal = formatPdfCellValueWithUnit(totals[h.id], h.name, true);
                html += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: 800; color: ${isSpecial ? '#78350f' : '#047857'}; font-size: 11px;">${formattedTotal}</td>`;
            } else {
                html += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: ${align}; color: #94a3b8; font-size: 11px;">-</td>`;
            }
        });

        html += `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px;">-</td></tr></tfoot></table></div>`;
    });

    // Grand Total Footer Banner
    html += `
        <div style="background-color: #0f172a; color: #ffffff; padding: 10px 14px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px; box-sizing: border-box; width: 100%;">
            <span style="font-size: 11px; font-weight: bold; color: #facc15;">إجمالي الشحنة الكلي (جميع الجداول):</span>
            <div style="font-size: 11px;">
                <span style="margin-left: 15px;">عدد البكرات: <strong>${formatEnglishNumber(grandTotalCount)}</strong></span>
                <span style="color: #6ee7b7;">الوزن الإجمالي الكلي: <strong>${sumHeader ? formatCellValueWithUnit(grandTotalWeight, sumHeader.name, true) : formatEnglishNumber(grandTotalWeight)}</strong></span>
            </div>
        </div>
    `;

    wrapper.innerHTML = html;
    return wrapper;
}

// Native Printable Vector PDF Engine (100% Identical to Preview Modal, ZERO text overlap)
function executeNativePrintPDF() {
    const list = getActiveList();
    const fileName = getExportFileName(`${list.title}_المدمجة`, '');
    const cleanElement = buildCleanExportHTML();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة والتنزيل.');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${fileName}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
                body { font-family: 'Cairo', Tahoma, Arial, sans-serif; direction: rtl; margin: 0; padding: 15px; background: #ffffff; color: #1e293b; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: auto; }
                th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-size: 11px; }
                th { background-color: #1e293b !important; color: #ffffff !important; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                tfoot td { background-color: #f1f5f9 !important; font-weight: 800; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @media print {
                    body { padding: 0; }
                    @page { size: A4 portrait; margin: 8mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            </style>
        </head>
        <body>
            ${cleanElement.innerHTML}
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 250);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
    closePreviewModal();
}

// Direct PDF File Download Execution (Uses high quality rendering with auto table layout)
async function executePDFExport() {
    const listTitle = getActiveList().title;
    const fileName = getExportFileName(`${listTitle}_المدمجة`, '.pdf');
    const actionBtn = document.getElementById('previewModalActionBtn');
    const originalText = actionBtn.innerHTML;

    try {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التوليد والتحميل...';

        const element = buildCleanExportHTML();
        // Append behind everything at top-left to avoid viewport cropping and -9999px issues
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.zIndex = '-9999';
        element.style.width = '750px';
        document.body.appendChild(element);

        const opt = {
            margin:       [6, 6, 6, 6],
            filename:     fileName,
            image:        { type: 'jpeg', quality: 1.0 },
            html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: 800 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(element).save();
        document.body.removeChild(element);
        closePreviewModal();
    } catch (err) {
        console.error('PDF export error:', err);
        executeNativePrintPDF();
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

        const element = buildCleanExportHTML();
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.zIndex = '-9999';
        element.style.width = '750px';
        document.body.appendChild(element);

        const canvas = await html2canvas(element, { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, windowWidth: 800 });
        document.body.removeChild(element);

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
        body { font-family: Cairo, Tahoma, Arial, sans-serif; direction: rtl; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 15px; }
        th, td { border: 1px solid #333; padding: 6px 10px; text-align: right; font-size: 12px; white-space: normal !important; word-break: break-word !important; }
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

// Optimized Telegram PDF File Sending Execution
async function executeTelegramPDFExport() {
    const list = getActiveList();
    const resultCategories = computeAggregatedData();
    let totalCount = 0;
    let totalWeight = 0;
    resultCategories.forEach(c => {
        totalCount += c.rawItemCount;
        totalWeight += c.totalWeight;
    });

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

        // 1. Optimized Fast PDF Blob Generation with Dynamic Auto Table Layout
        const element = buildCleanExportHTML();
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.zIndex = '-9999';
        element.style.width = '750px';
        document.body.appendChild(element);

        const opt = {
            margin:       [6, 6, 6, 6],
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.95 },
            html2canvas:  { scale: 1.5, useCORS: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: 800 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfWorker = html2pdf().set(opt).from(element);
        const pdfBlob = await pdfWorker.output('blob');
        document.body.removeChild(element);

        // 2. Prepare Telegram FormData payload
        const sumHeader = list.headers.find(h => h.role === 'sum');
        let totalSumStr = '';
        if (sumHeader) {
            totalSumStr = `\n📊 إجمالي الوزن الكلي: ${formatCellValueWithUnit(totalWeight, sumHeader.name, true)}`;
        }

        const caption = `📦 *تقرير الأصناف المدمجة*: ${list.title}\n📅 *التاريخ*: ${new Date().toLocaleDateString('en-GB')}\n📋 *عدد الجداول المخصصة*: ${resultCategories.length}\n🔢 *عدد الرولات الكلي*: ${formatEnglishNumber(totalCount)}${totalSumStr}`;

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
