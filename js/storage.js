// LocalStorage & Data Backup Management

function saveToLocalStorage() {
    try {
        if (appData) {
            localStorage.setItem('inventory_app_data', JSON.stringify(appData));
        }
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('inventory_app_data');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.lists && Array.isArray(parsed.lists) && parsed.lists.length > 0) {
                appData = parsed;
                // Verify all lists have items and headers
                appData.lists.forEach(l => {
                    if (!l.headers || !Array.isArray(l.headers)) l.headers = JSON.parse(JSON.stringify(defaultState.lists[0].headers));
                    if (!l.items || !Array.isArray(l.items)) l.items = [];
                });
                return;
            }
        } catch (e) {
            console.error('Error parsing localStorage data:', e);
        }
    }
    appData = JSON.parse(JSON.stringify(defaultState));
}

function exportFullJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `inventory_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importFullJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            let importedLists = [];
            
            if (imported && imported.lists && Array.isArray(imported.lists)) {
                importedLists = imported.lists;
            } else if (imported && Array.isArray(imported)) {
                importedLists = [{ id: 'list_' + Date.now(), title: 'قائمة مسترجعة', items: imported, headers: getActiveList().headers }];
            } else if (imported && imported.items && Array.isArray(imported.items)) {
                importedLists = [imported];
            } else {
                alert('صيغة ملف JSON غير معروفة.');
                return;
            }

            // Ask user where to load/import the data
            const choice = prompt(
                'اختر طريقة تحميل واسترجاع البيانات:\n\n' +
                '1 - فتح البيانات في قائمة جديدة (صفحة جديدة) لتكملة العمل عليها 📄\n' +
                '2 - دمج البيانات مع القائمة الحالية النشطة ➕\n' +
                '3 - استبدال وتحديث كافة البيانات والقوائم 🔄\n\n' +
                'أدخل رقم الخيار (1 أو 2 أو 3):',
                '1'
            );

            if (!choice) return;

            if (choice.trim() === '1') {
                // Open in new list tabs
                importedLists.forEach((l, idx) => {
                    const newList = {
                        id: 'list_' + Date.now() + '_' + idx,
                        title: l.title ? `${l.title} (مسترجعة)` : `قائمة مسترجعة ${idx + 1}`,
                        subTitle: l.subTitle || 'تقرير الأصناف واللوائح المدمجة',
                        specialTableTitle: l.specialTableTitle || 'الأصناف المختلفة / الهوالك',
                        createdAt: l.createdAt || new Date().toLocaleDateString('en-GB'),
                        headers: l.headers || JSON.parse(JSON.stringify(getActiveList().headers)),
                        items: l.items || []
                    };
                    appData.lists.push(newList);
                    appData.activeListId = newList.id;
                });
                renderApp();
                alert('تم فتح البيانات في قائمة جديدة بنجاح! يمكنك إكمال العمل عليها الآن. 🚀');
            } else if (choice.trim() === '2') {
                // Merge into current active list
                const activeList = getActiveList();
                let addedCount = 0;
                importedLists.forEach(l => {
                    if (l.items && Array.isArray(l.items)) {
                        let startOrder = activeList.items.length > 0 
                            ? Math.max(...activeList.items.map(i => i.originalOrder || 0)) + 1 
                            : 1;
                        l.items.forEach(it => {
                            const newItem = {
                                ...it,
                                id: 'i_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                                originalOrder: startOrder,
                                serialNo: startOrder
                            };
                            startOrder++;
                            activeList.items.push(newItem);
                            addedCount++;
                        });
                    }
                });
                renderApp();
                alert(`تم دمج ${addedCount} صنفاً مع القائمة الحالية بنجاح! 🚀`);
            } else if (choice.trim() === '3') {
                // Replace all data
                appData = {
                    activeListId: importedLists[0].id || 'list_' + Date.now(),
                    lists: importedLists
                };
                renderApp();
                alert('تم استبدال البيانات واللوائح بنجاح!');
            }
        } catch(err) {
            console.error('Error importing JSON:', err);
            alert('خطأ في قراءة أو فك ملف JSON.');
        } finally {
            event.target.value = ''; // Reset input
        }
    };
    reader.readAsText(file);
}
