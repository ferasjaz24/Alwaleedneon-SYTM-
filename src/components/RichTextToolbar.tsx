import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, ChevronDown } from 'lucide-react';

export default function RichTextToolbar() {
  const [fontSize, setFontSize] = useState('16');
  const [isSizeOpen, setIsSizeOpen] = useState(false);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent losing focus on the contenteditable
  };

  const applyCustomFontSize = (size: string) => {
    setFontSize(size);
    const uniqueFont = "temp-font-xyz";
    
    // Enable CSS styling
    document.execCommand("styleWithCSS", false, "true");
    // Apply a temporary unique font name
    document.execCommand("fontName", false, uniqueFont);
    
    // Find all elements that had this temporary font applied
    const elements1 = document.querySelectorAll(`font[face="${uniqueFont}"]`);
    const elements2 = document.querySelectorAll(`span[style*="${uniqueFont}"]`);
    
    // Replace the temporary font with our intended pixel size
    elements1.forEach(el => {
        el.removeAttribute('face');
        (el as HTMLElement).style.fontSize = `${size}px`;
    });
    
    elements2.forEach(el => {
        (el as HTMLElement).style.fontFamily = (el as HTMLElement).style.fontFamily.replace(/"?temp-font-xyz"?/g, '').replace(/temp-font-xyz/g, '');
        if ((el as HTMLElement).style.fontFamily.trim() === '') {
            (el as HTMLElement).style.removeProperty('font-family');
        }
        (el as HTMLElement).style.fontSize = `${size}px`;
    });
  };

  // Standard Microsoft Word font size variations
  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72, 96, 120, 144];

  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-t-2xl shadow-sm print:hidden">
      <button onMouseDown={handleMouseDown} onClick={() => execCommand('bold')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="عريض">
        <Bold className="w-4 h-4" />
      </button>
      <button onMouseDown={handleMouseDown} onClick={() => execCommand('italic')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="مائل">
        <Italic className="w-4 h-4" />
      </button>
      <button onMouseDown={handleMouseDown} onClick={() => execCommand('underline')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="تسطير">
        <Underline className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-slate-300 mx-1"></div>

      <button onMouseDown={handleMouseDown} onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="محاذاة لليمين">
        <AlignRight className="w-4 h-4" />
      </button>
      <button onMouseDown={handleMouseDown} onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="توسيط">
        <AlignCenter className="w-4 h-4" />
      </button>
      <button onMouseDown={handleMouseDown} onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="محاذاة لليسار">
        <AlignLeft className="w-4 h-4" />
      </button>
      <button onMouseDown={handleMouseDown} onClick={() => execCommand('justifyFull')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="ضبط">
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-slate-300 mx-1"></div>

      <button onMouseDown={handleMouseDown} onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="قائمة نقطية">
        <List className="w-4 h-4" />
      </button>
      <button onMouseDown={handleMouseDown} onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-slate-200 rounded text-slate-700" title="قائمة رقمية">
        <ListOrdered className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-slate-300 mx-1"></div>

      <div className="flex items-center gap-2 relative z-50">
        <label className="text-xs text-slate-500 font-bold">حجم الخط</label>
        <div className="relative">
          <button 
            onMouseDown={(e) => { e.preventDefault(); setIsSizeOpen(!isSizeOpen); }}
            className="bg-white border border-slate-300 text-slate-700 text-xs rounded py-1.5 px-3 w-16 flex items-center justify-between font-bold cursor-pointer"
          >
            <span>{fontSize}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          
          {isSizeOpen && (
            <div className="absolute top-full mt-1 left-0 w-full bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto">
              {fontSizes.map((size) => (
                <div 
                  key={size} 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyCustomFontSize(size.toString());
                    setIsSizeOpen(false);
                  }}
                  className="p-2 text-center hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer text-xs font-bold transition"
                >
                  {size}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-px h-6 bg-slate-300 mx-1"></div>

      <div className="flex items-center gap-1">
        <label className="text-xs text-slate-500 font-bold">اللون</label>
        <input 
          type="color" 
          onMouseDown={handleMouseDown}
          onChange={(e) => execCommand('foreColor', e.target.value)}
          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent transition-all hover:scale-105 active:scale-95"
          title="اختر لون الخط"
        />
      </div>
    </div>
  );
}
