const fs = require('fs');
const path = require('path');

let f = path.join(__dirname, 'src/components/ItemsWarehouse.tsx');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/import React, \{ useState, useRef, useMemo \} from 'react';/, "import React, { useState, useRef, useMemo, useEffect } from 'react';");

const fetchCode = `
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/warehouse_items');
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error('Failed to load items', e);
    }
  };
`;
c = c.replace(/const fileInputRef = useRef<HTMLInputElement>\(null\);/, `const fileInputRef = useRef<HTMLInputElement>(null);\n${fetchCode}`);


const handleSaveOld = `const handleSave = (isDraft: boolean) => {
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
  };`;

const handleSaveNew = `const handleSave = async (isDraft: boolean) => {
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
    try {
      if (editingItem.id) {
        const res = await fetch(\`/api/warehouse_items/\${editingItem.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem)
        });
        if (res.ok) {
           setItems(items.map(i => i.id === editingItem.id ? newItem : i));
        }
      } else {
        newItem = { ...newItem, dateCreated: new Date().toISOString() };
        const res = await fetch('/api/warehouse_items', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(newItem)
        });
        if (res.ok) {
           const json = await res.json();
           setItems([json.item, ...items]);
        }
      }
      setIsModalOpen(false);
      setEditingItem({});
    } catch(e) {
      alert('حدث خطأ في حفظ الصنف');
      console.error(e);
    }
  };`;
c = c.replace(handleSaveOld, handleSaveNew);

const deleteOld = `onClick={() => setItems(items.filter(i => i.id !== item.id))}`;
const deleteNew = `onClick={async () => {
                          try {
                            const res = await fetch(\`/api/warehouse_items/\${item.id}\`, { method: 'DELETE' });
                            if (res.ok) setItems(items.filter(i => i.id !== item.id));
                          } catch(e) {}
                       }}`;
c = c.replace(deleteOld, deleteNew);


const deleteBtnOld = `<button onClick={() => { if(editingItem.id) setItems(items.filter(i => i.id !== editingItem.id)); setIsModalOpen(false); }} className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-2 transition">
                  <Trash2 className="w-4 h-4" />
                  حذف الصنف
                </button>`;

const deleteBtnNew = `<button onClick={async () => { 
                  if(editingItem.id) {
                     try {
                        const res = await fetch(\`/api/warehouse_items/\${editingItem.id}\`, { method: 'DELETE' });
                        if (res.ok) setItems(items.filter(i => i.id !== editingItem.id));
                     } catch(e) {}
                  }
                  setIsModalOpen(false); 
                }} className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-2 transition">
                  <Trash2 className="w-4 h-4" />
                  حذف الصنف
                </button>`;
c = c.replace(deleteBtnOld, deleteBtnNew);

fs.writeFileSync(f, c, 'utf8');
