import React, { useState, useEffect } from 'react';
import { GroceryItem } from '../types';
import { X, Check, Plus, Palette, Copy, Smile, Tag, Info, Edit2 } from 'lucide-react';
import { getCategoryColor } from './ProductIcon';

interface EditItemModalProps {
  item: any; // Può essere GroceryItem o ProductDatabaseEntry
  availableCategories: string[];
  emojiLibrary: string[];
  initialColor?: string;
  currentCategoryColors?: Record<string, string>;
  catalogMode?: 'global' | 'list';
  onClose: () => void;
  onSave: (id: string, updates: any, newCategoryColor?: string, isCopy?: boolean) => void;
}

const UNITS = ['pz', 'kg', 'hg', 'g', 'L', 'ml', 'conf', 'bt', 'scatola'];

const COLORS = [
  { name: 'Rosso', class: 'bg-red-100 text-red-600' },
  { name: 'Arancio', class: 'bg-orange-100 text-orange-600' },
  { name: 'Giallo', class: 'bg-yellow-100 text-yellow-600' },
  { name: 'Verde', class: 'bg-green-100 text-green-600' },
  { name: 'Smeraldo', class: 'bg-emerald-100 text-emerald-600' },
  { name: 'Teal', class: 'bg-teal-100 text-teal-600' },
  { name: 'Ciano', class: 'bg-cyan-100 text-cyan-600' },
  { name: 'Blu', class: 'bg-blue-100 text-blue-600' },
  { name: 'Indaco', class: 'bg-indigo-100 text-indigo-600' },
  { name: 'Viola', class: 'bg-violet-100 text-violet-600' },
  { name: 'Fucsia', class: 'bg-fuchsia-100 text-fuchsia-600' },
  { name: 'Rosa', class: 'bg-pink-100 text-pink-600' },
  { name: 'Grigio', class: 'bg-gray-100 text-gray-600' },
];

export const EditItemModal: React.FC<EditItemModalProps> = ({ 
  item, 
  availableCategories,
  emojiLibrary,
  initialColor,
  currentCategoryColors = {},
  catalogMode = 'list',
  onClose, 
  onSave 
}) => {
  // Determiniamo se stiamo editando un prodotto del catalogo o un item della lista
  const isGlobalCatalogEdit = item.id?.startsWith('CATALOG_EDIT_') && catalogMode === 'global';
  const isAddingFromCatalog = item.id?.startsWith('ADD_FROM_CATALOG_');
  
  // Risoluzione dei metadati iniziali
  const initialMetadata = isGlobalCatalogEdit || isAddingFromCatalog 
    ? item 
    : (item.customMetadata || item.metadata || item); // item.metadata viene iniettato da hydratedItems

  const [name, setName] = useState(initialMetadata.normalizedName || '');
  const [quantity, setQuantity] = useState((item.quantity ?? 1).toString());
  const [unit, setUnit] = useState(item.unit || 'pz');
  const [notes, setNotes] = useState(item.notes || '');
  const [category, setCategory] = useState(initialMetadata.category || '');
  const [emoji, setEmoji] = useState(initialMetadata.emoji || '🛒');
  
  const [selectedColor, setSelectedColor] = useState(() => {
    if (initialColor) return initialColor;
    const cat = initialMetadata.category || '';
    if (currentCategoryColors[cat]) return currentCategoryColors[cat];
    return getCategoryColor(cat);
  });

  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCopy, setIsCopy] = useState(false);

  const isPersonalization = !isGlobalCatalogEdit;
  const isEditingExisting = !isAddingFromCatalog && !isGlobalCatalogEdit;
  const isNameEditable = !isAddingFromCatalog;

  // Se la categoria cambia nel tempo (es. digitando), aggiorna il colore suggerito se non è stato bloccato dall'utente
  const handleCategorySelect = (cat: string) => {
    const trimmedCat = cat.trim();
    setCategory(trimmedCat);
    const newColor = currentCategoryColors[trimmedCat] || getCategoryColor(trimmedCat);
    setSelectedColor(newColor);
    setShowCategorySuggestions(false);
  };

  const handleSave = () => {
    const qty = parseFloat(quantity.replace(',', '.'));
    onSave(
      item.id, 
      {
        normalizedName: name.trim(),
        quantity: isNaN(qty) ? 1 : qty,
        unit: unit,
        notes: notes.trim(),
        category: category.trim(),
        emoji: emoji || '🛒'
      },
      selectedColor,
      isCopy
    );
    onClose();
  };

  const emojiButtonClass = selectedColor 
    ? `w-full h-full rounded-xl flex items-center justify-center text-3xl transition-all shadow-sm ${selectedColor}`
    : `w-full h-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl flex items-center justify-center text-3xl transition-all shadow-sm`;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200 h-fit max-h-[95vh] overflow-hidden">
        
        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100">
               {isGlobalCatalogEdit ? 'Modifica Master' : 'Personalizza Articolo'}
            </h3>
            {isPersonalization && (
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Info size={10} /> Solo per questa lista
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* NOME E ICONA */}
          <div className="flex gap-4">
             <div className="w-24 relative shrink-0">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Icona</label>
                <div className="relative w-full h-16">
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={emojiButtonClass}
                  >
                    {emoji || '🛒'}
                  </button>
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-md pointer-events-none">
                    <Edit2 size={10} />
                  </div>
                </div>
                
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-[100] p-4 animate-in zoom-in-95 duration-200">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Smile size={14} /> Modifica Icona</span>
                        <button onClick={() => setShowEmojiPicker(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={16} className="text-gray-400"/></button>
                     </div>

                     {/* INPUT MANUALE / INCOLLA */}
                     <div className="mb-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1.5 px-1">Incolla o digita (emoji/lettera)</p>
                        <input 
                           autoFocus
                           type="text" 
                           placeholder="Icona..." 
                           maxLength={10}
                           value={emoji}
                           onFocus={(e) => e.currentTarget.select()}
                           onChange={(e) => setEmoji(e.target.value)}
                           className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-center text-2xl focus:outline-none focus:border-blue-500 shadow-inner dark:text-white"
                        />
                     </div>

                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 px-1">Suggeriti</p>
                     <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                        {emojiLibrary.map((e, idx) => (
                          <button 
                            key={`${e}-${idx}`}
                            onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                            className={`w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${emoji === e ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : ''}`}
                          >
                            {e}
                          </button>
                        ))}
                     </div>
                  </div>
                )}
             </div>
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome</label>
                <input 
                  type="text" 
                  value={name} 
                  readOnly={!isNameEditable}
                  onFocus={(e) => isNameEditable && e.currentTarget.select()}
                  onChange={(e) => isNameEditable && setName(e.target.value)} 
                  className={`w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none transition-all text-lg font-bold shadow-sm ${
                    isNameEditable 
                      ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none'
                  }`} 
                />
             </div>
          </div>

          {/* NOTE */}
          {isPersonalization && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi una nota (es. marca, variante...)"
                rows={2}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 text-base resize-none"
              />
            </div>
          )}

          {/* QUANTITÀ E UNITÀ */}
          {!isGlobalCatalogEdit && (
            <div className="flex gap-4">
              <div className="flex-1">
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Quantità</label>
                 <input type="number" inputMode="decimal" value={quantity} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setQuantity(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 text-center font-bold text-xl" />
              </div>
              <div className="w-1/3 shrink-0">
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Unità</label>
                 <div className="relative">
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full p-4 appearance-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 font-medium">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><Tag size={14}/></div>
                 </div>
              </div>
            </div>
          )}

          {/* CATEGORIA E COLORE */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoria</label>
              <input
                type="text"
                value={category}
                onFocus={(e) => {
                    e.currentTarget.select();
                    setShowCategorySuggestions(true);
                }}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setShowCategorySuggestions(true);
                }}
                placeholder="Scegli categoria..."
                className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none transition-all text-base bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 shadow-sm"
              />

              {showCategorySuggestions && (
                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl max-h-72 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2">
                  <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between sticky top-0 z-10">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Tag size={10} /> Suggerite
                     </div>
                     <button onClick={() => setShowCategorySuggestions(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400"><X size={14} /></button>
                  </div>
                  <div className="p-3 grid grid-cols-1 gap-1">
                     {availableCategories.map(cat => (
                       <button
                         key={cat}
                         onClick={() => handleCategorySelect(cat)}
                         className={`text-left px-3.5 py-3 rounded-xl text-sm transition-all border ${category === cat ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-bold' : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-50'}`}
                       >
                         {cat}
                       </button>
                     ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-1/3 shrink-0">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Colore</label>
              <div className="relative">
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className={`w-full p-4 appearance-none border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 font-medium ${selectedColor || 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'}`}
                >
                  <option value="">Nessuno</option>
                  {COLORS.map(color => (
                    <option key={color.name} value={color.class} className={color.class}>
                      {color.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><Palette size={14}/></div>
              </div>
            </div>
          </div>

          {isEditingExisting && (
            <div className="pt-4 border-t dark:border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={isCopy} 
                    onChange={(e) => setIsCopy(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-bold">Crea come copia in lista</div>
              </label>
            </div>
          )}
        </div>

        <div className="p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-4 shrink-0">
           <button onClick={onClose} className="flex-1 py-4 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all active:scale-95">Annulla</button>
           <button onClick={handleSave} className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 flex items-center justify-center gap-2"><Check size={20} /> Salva</button>
        </div>
      </div>
    </div>
  );
};