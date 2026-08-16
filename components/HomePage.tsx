import React, { useState, useMemo } from 'react';
import { ShoppingList, GroceryItem } from '../types';
import { Plus, Smartphone, Cloud, Trash2, Pencil, Check, X, ArrowRight, ShieldCheck, Share2, CloudOff } from 'lucide-react';

interface HomePageProps {
  lists: ShoppingList[];
  isCloudActive: boolean;
  currentDeviceId?: string;
  onSelectList: (id: string) => void;
  onCreateList: (name: string, isLocal: boolean) => void;
  onDeleteList: (id: string) => void;
  onRenameList: (id: string, newName: string) => void;
  onToggleListType: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  lists,
  isCloudActive,
  currentDeviceId,
  onSelectList,
  onCreateList,
  onDeleteList,
  onRenameList,
  onToggleListType
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Ordinamento Fisso: manteniamo le liste bloccate in base all'ID (ordine di creazione UUID)
  const displayLists = useMemo(() => [...lists].sort((a, b) => a.id.localeCompare(b.id)), [lists]);

  const checkDuplicate = (name: string, excludeId?: string) => {
    return lists.some(l => 
      l.name.toLowerCase() === name.toLowerCase() && l.id !== excludeId
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newListName.trim();
    if (!cleanName) return;
    onCreateList(cleanName, true);
    setNewListName('');
    setIsCreating(false);
    setError(null);
  };

  const startEditing = (e: React.MouseEvent, list: ShoppingList) => {
    e.stopPropagation();
    setEditingId(list.id);
    setEditName(list.name);
    setError(null);
  };

  const saveEdit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingId && editName.trim()) {
      const cleanName = editName.trim();
      if (checkDuplicate(cleanName, editingId)) {
         setError('Nome esistente');
         return;
      }
      onRenameList(editingId, cleanName);
      setEditingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full relative transition-colors duration-500 bg-blue-50/30 dark:bg-slate-900/90">
      <div className="flex-1 px-[5px] overflow-y-auto pb-28 no-scrollbar pt-2">
        <div className="space-y-4">
          {/* Create Form Inline */}
          {isCreating && (
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg animate-in slide-in-from-top-2 border border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-bold mb-2 uppercase tracking-widest text-blue-500">Nuova Lista</h3>
              <form onSubmit={handleCreate}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome della lista..."
                  value={newListName}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => { setNewListName(e.target.value); setError(null); }}
                  className={`w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-4 mb-3 transition-all ${
                    error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {error && <p className="text-xs text-red-500 mb-2 font-medium px-1">{error}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setIsCreating(false); setError(null); }} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium">Annulla</button>
                  <button type="submit" disabled={!newListName.trim()} className="flex-1 py-3 text-white rounded-xl font-bold bg-blue-600 disabled:opacity-50">Crea</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {displayLists.length === 0 && !isCreating ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-gray-400 dark:text-gray-500">
                  <div className="bg-blue-100 dark:bg-blue-900/20 w-24 h-24 rounded-full mb-4 shadow-inner flex items-center justify-center overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                     <img src="/Carrello.png" className="w-full h-full object-cover scale-110" alt="Icona" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">Nessuna Lista</h3>
                  <p className="text-sm max-w-[280px] leading-relaxed">Inizia creando la tua prima lista personale premendo il tasto "+" in basso.</p>
              </div>
            ) : (
              displayLists.map((list: ShoppingList) => (
                <div
                  key={list.id}
                  onClick={() => { if(editingId !== list.id) onSelectList(list.id); }}
                  className={`group p-4 rounded-2xl shadow-sm border-2 transition-all cursor-pointer relative ${
                    list.isLocal ? 'bg-white dark:bg-slate-800 border-blue-500' : 'bg-white dark:bg-stone-800 border-orange-500'
                  }`}
                >
                  {editingId === list.id ? (
                     <div className="flex items-center gap-[5px] pr-2" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editName}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={e => setEditName(e.target.value)}
                          className={`flex-1 min-w-0 p-2 bg-gray-50 dark:bg-gray-700 border rounded-lg outline-none text-gray-900 dark:text-white ${list.isLocal ? 'border-blue-300' : 'border-orange-300'}`}
                        />
                        <button onClick={saveEdit} className="p-2 bg-green-100 text-green-600 rounded-lg"><Check size={20} /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-red-100 text-red-600 rounded-lg"><X size={20} /></button>
                     </div>
                  ) : (
                     <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                             <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate pr-2">{list.name}</h3>
                             {!list.isLocal && <Cloud size={14} className="text-orange-500" />}
                           </div>
                           <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                             {list.items.filter((i: GroceryItem) => !i.isChecked).length} prodotti da acquistare
                           </p>
                        </div>

                      <div className="flex items-center gap-0.5 opacity-100 transition-opacity shrink-0">
                         {isCloudActive && (
                           <button
                             onClick={(e) => { e.stopPropagation(); onToggleListType(list.id); }}
                             className={`p-1.5 rounded-lg transition-colors ${list.isLocal ? 'text-blue-500 hover:bg-blue-50' : 'text-orange-500 hover:bg-orange-50'}`}
                             title={list.isLocal ? "Condividi nel Cloud" : "Sposta in Locale (Rendi Editabile)"}
                           >
                              {list.isLocal ? <Share2 size={18} /> : <CloudOff size={18} />}
                           </button>
                         )}
                         <button onClick={(e) => startEditing(e, list)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50">
                            <Pencil size={18} />
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                            <Trash2 size={18} />
                         </button>
                         <div className={`pl-0.5 ${list.isLocal ? 'text-blue-200' : 'text-orange-200'}`}>
                            <ArrowRight size={18} />
                         </div>
                      </div>
                     </div>
                  )}
                  {editingId === list.id && error && <p className="text-xs text-red-500 mt-1 font-medium px-1">{error}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white bg-blue-600 hover:scale-105 active:scale-95 transition-all z-40"
        >
           <Plus size={32} />
        </button>
      )}
    </div>
  );
};
