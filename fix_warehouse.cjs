const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/ItemsWarehouse.tsx');
let c = fs.readFileSync(f, 'utf8');

// 1. Add translation function
const translateFunc = `
  const handleTranslate = async (text: string, context: string, field: 'itemNameEn' | 'descriptionEn') => {
    if (!text || editingItem[field]) return; // Only translate if English is empty
    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          setEditingItem(prev => ({ ...prev, [field]: data.translatedText }));
        }
      }
    } catch(e) { console.error(e); }
  };
`;
c = c.replace(/const generateItemCode = \(\) => {/, translateFunc + '\n  const generateItemCode = () => {');

// 2. Fix image upload bug
const imgUploadFuncOld = `const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = ev => {
        setEditingItem({ ...editingItem, imageUrl: ev.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };`;

const imgUploadFuncNew = `const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = ev => {
        setEditingItem(prev => ({ ...prev, imageUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };`;
c = c.replace(imgUploadFuncOld, imgUploadFuncNew);

// 3. Fix handleSave and closeModal
const handleSaveOld = `const handleSave = (isDraft: boolean) => {
    // Validate uniqueness if not draft
    if (!isDraft && items.some(i => i.itemCode === editingItem.itemCode && i.id !== editingItem.id)) {
      alert('رمز الصنف موجود مسبقاً!');
      return;
    }
    
    if (editingItem.id) {
      setItems(items.map(i => i.id === editingItem.id ? { ...editingItem, isDraft } as WarehouseItem : i));
    } else {
      setItems([{ ...editingItem, id: Date.now().toString(), dateCreated: new Date().toISOString(), isDraft } as WarehouseItem, ...items]);
    }
    closeModal();
  };

  const closeModal = () => {
    if (!editingItem.id && Object.keys(editingItem).length > 0 && !editingItem.isDraft) {
       // auto save as draft
       handleSave(true);
    } else {
       setIsModalOpen(false);
       setEditingItem({});
    }
  };`;

const handleSaveNew = `const handleSave = (isDraft: boolean) => {
    // Validate required fields if NOT a draft
    if (!isDraft) {
      if (!editingItem.itemGroup || !editingItem.itemCode || !editingItem.itemNameAr || !editingItem.defaultUnit || !editingItem.warehouse || editingItem.isPurchaseItem === undefined || !editingItem.descriptionAr) {
        alert('يرجى تعبئة جميع الحقول المطلوبة (يتضمن المجموعة، رمز الصنف، الاسم، الوحدة، المستودع، صنف شراء، الوصف).');
        return;
      }
    }

    if (items.some(i => i.itemCode && i.itemCode === editingItem.itemCode && i.id !== editingItem.id)) {
      alert('رمز الصنف موجود مسبقاً!');
      return;
    }
    
    let newItem = { ...editingItem, isDraft } as WarehouseItem;
    if (editingItem.id) {
      setItems(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      newItem = { ...newItem, id: Date.now().toString(), dateCreated: new Date().toISOString() };
      setItems([newItem, ...items]);
    }
    
    setIsModalOpen(false);
    setEditingItem({});
  };

  const handleCloseIcon = () => {
    // If not saved and no ID and has content, save as draft. 
    const hasContent = Object.values(editingItem).some(v => typeof v === 'string' ? v.trim() !== '' : v !== undefined);
    
    if (!editingItem.id && hasContent) {
       handleSave(true);
    } else {
       setIsModalOpen(false);
       setEditingItem({});
    }
  };`;
c = c.replace(handleSaveOld, handleSaveNew);

// Fix button for close icon
c = c.replace(/<button onClick=\{closeModal\} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition">/, '<button onClick={handleCloseIcon} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition">');

// 4. Add "Duplicate Selected" button next to "Add New"
const buttonsOld = `<button onClick={() => { setEditingItem({}); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition">
            <PlusCircle className="w-5 h-5" />
            {lang === 'ar' ? 'إضافة صنف جديد' : 'Add New Item'}
          </button>
          <button onClick={handleExportSelected} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition">`;

const buttonsNew = `<button onClick={() => { setEditingItem({}); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition">
            <PlusCircle className="w-5 h-5" />
            {lang === 'ar' ? 'إضافة صنف جديد' : 'Add New Item'}
          </button>
          {selectedItems.length === 1 && (
            <button onClick={() => {
              const selectedItem = items.find(i => i.id === selectedItems[0]);
              if (selectedItem) {
                const { id, itemCode, dateCreated, ...rest } = selectedItem;
                setEditingItem(rest as Partial<WarehouseItem>);
                setIsModalOpen(true);
              }
            }} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-sm font-bold transition">
              <PlusCircle className="w-5 h-5" />
              {lang === 'ar' ? 'تكرار الصنف المحدد' : 'Duplicate Selected'}
            </button>
          )}
          <button onClick={handleExportSelected} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition">`;
c = c.replace(buttonsOld, buttonsNew);


// 5. Add onBlur triggers for translation
// Because the regexes might fail if there's whitespace diffs, we'll replace specifically

c = c.replace(/onChange=\{e => setEditingItem\(\{\.\.\.editingItem, itemNameAr: e\.target\.value\}\)\}/g, `onChange={e => setEditingItem({...editingItem, itemNameAr: e.target.value})}
                          onBlur={e => handleTranslate(e.target.value, 'Warehouse item name', 'itemNameEn')}`);

c = c.replace(/onChange=\{e => setEditingItem\(\{\.\.\.editingItem, descriptionAr: e\.target\.value\}\)\}/g, `onChange={e => setEditingItem({...editingItem, descriptionAr: e.target.value})}
                          onBlur={e => handleTranslate(e.target.value, 'Warehouse item description', 'descriptionEn')}`);


fs.writeFileSync(f, c, 'utf8');
