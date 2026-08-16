import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GroceryItem, ProductDatabaseEntry, Category, ProductMetadata, ShoppingList, SortMode } from './types';
import { classifyProduct } from './services/geminiService';
import {
  repository,
  generateUUID,
  getFamilyCode,
  clearFamilyCode,
  subscribeToFamily,
  supabase
} from './services/supabaseService';

import { ListItem } from './components/ListItem';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { EditItemModal } from './components/EditItemModal';
import { ProductIcon } from './components/ProductIcon';
import { UsageGuideModal } from './components/UsageGuideModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { UpdateLogModal } from './components/UpdateLogModal';

import { Plus, Search, Loader2, X, Trash2, BookHeart, Check, Menu, Smartphone, Cloud, ArrowUpDown, ArrowLeft, RefreshCw, Bell, HelpCircle, CloudLightning, LogOut, Users } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, TouchSensor, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

const DEFAULT_EMOJI_LIBRARY = [
  '🍎', '🍌', '🍐', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🥔', '🥖', '🍞', '🥐', '🥨', '🥯', '🥞', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍪', '🍩', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🍺', '🍷', '🥃', '🥤', '🧃', '🧉', '🧊', '🧂', '🧼', '🧽', '🧻', '🧹', '🧺', '🧴'
];

function App() {
  // --- IDENTITÀ & TEMA ---
  const [deviceId] = useState<string>(() => {
    let id = localStorage.getItem('device_id');
    if (!id) { id = generateUUID(); localStorage.setItem('device_id', id); }
    return id;
  });
  const [familyCode, setFamilyCodeState] = useState<string | null>(() => getFamilyCode());
  const isCloudActive = !!familyCode;

  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  const [lists, setLists] = useState<ShoppingList[]>(() => JSON.parse(localStorage.getItem('shopping_lists') || '[]'));
  const [activeListId, setActiveListId] = useState<string>(() => localStorage.getItem('active_list_id') || '');
  const [db, setDb] = useState<ProductDatabaseEntry[]>(() => JSON.parse(localStorage.getItem('product_db') || '[]'));
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('category_colors') || '{}'));
  const [manualEmojiLibrary, setManualEmojiLibrary] = useState<string[]>(() => JSON.parse(localStorage.getItem('emoji_library') || '[]'));

  // --- STATO UI ---
  const [currentView, setCurrentView] = useState<'home' | 'list'>('home');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>(() => (localStorage.getItem('sort_mode') as SortMode) || 'alpha');
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogMode, setCatalogMode] = useState<'global' | 'list'>('global');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [listToDeleteId, setListToDeleteId] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showClearPurchasedConfirm, setShowClearPurchasedConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMaintaining, setIsMaintaining] = useState(false);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showUpdateLog, setShowUpdateLog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => localStorage.getItem('is_sound_enabled') !== 'false');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [lastSyncTime, setLastSyncTime] = useState<number>(() => parseInt(localStorage.getItem('last_sync_time') || '0'));

  // Refs per evitare loop di aggiornamento
  const isRemoteUpdate = useRef(false);

  const activeList = useMemo(() => lists.find(l => l.id === activeListId) || lists[0], [lists, activeListId]);

  // --- SYNC ENGINE (Snapshot) ---
  const refreshData = useCallback(async (silent = false) => {
    if (!isCloudActive) return;
    if (!silent) setSyncStatus('syncing');
    try {
      const data = await repository.fetchAll();
      if (data) {
        isRemoteUpdate.current = true;
        setDb(data.catalog);

        setLists(prev => {
          const merged = new Map<string, ShoppingList>();
          prev.forEach(l => merged.set(l.id, l));
          data.lists.forEach(rl => {
             const existing = merged.get(rl.id);
             if (!existing) merged.set(rl.id, { ...rl, isLocal: false });
             else merged.set(rl.id, { ...rl, isLocal: existing.isLocal });
          });
          return Array.from(merged.values());
        });

        if (!silent) setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      }
    } catch (e) {
      setSyncStatus('error');
    } finally {
      isRemoteUpdate.current = false;
    }
  }, [isCloudActive]);

  // --- REALTIME ENGINE ---
  useEffect(() => {
    if (!isCloudActive || !familyCode) return;

    const channel = subscribeToFamily(familyCode,
      (payload) => { // LISTS
        if (isRemoteUpdate.current) return;
        const { eventType, new: next, old } = payload;
        const listId = next?.id || old?.id;

        if (eventType === 'DELETE') {
          // Rimuoviamo la lista se non è locale
          setLists(prev => prev.filter(l => l.id !== listId || l.isLocal));
        } else if (next) {
          setLists(prev => {
            const exists = prev.find(l => l.id === listId);
            if (exists?.isLocal) return prev;
            if (!exists) return [...prev, { ...next, items: [], isLocal: false, updatedAt: Number(next.updated_at) }];
            return prev.map(l => l.id === listId ? { ...l, name: next.name, updatedAt: Number(next.updated_at) } : l);
          });
        }
      },
      (payload) => { // ITEMS
        if (isRemoteUpdate.current) return;
        const { eventType, new: next, old } = payload;
        const itemId = next?.id || old?.id;
        const listId = next?.list_id || old?.list_id;

        setLists(prev => prev.map(l => {
          if (l.isLocal) return l;

          // Se è una eliminazione, rimuoviamo l'item da qualsiasi lista lo contenga
          if (eventType === 'DELETE') {
            return { ...l, items: l.items.filter(it => it.id !== itemId) };
          }

          // Se è un inserimento o aggiornamento, verifichiamo la lista corretta
          if (l.id !== listId) return l;

          const itemExists = l.items.find(it => it.id === itemId);
          const mapped: GroceryItem = {
            id: next.id, productId: next.product_id, isChecked: next.is_checked,
            quantity: next.quantity, unit: next.unit, notes: next.notes,
            updatedAt: Number(next.updated_at), customMetadata: next.custom_metadata
          };

          if (itemExists) {
            if (itemExists.updatedAt >= mapped.updatedAt) return l;
            return { ...l, items: l.items.map(it => it.id === itemId ? mapped : it) };
          }
          return { ...l, items: [mapped, ...l.items] };
        }));
      }
    );

    return () => { supabase.removeChannel(channel); };
  }, [isCloudActive, familyCode]);

  // --- AUTOMAZIONI ---
  useEffect(() => { if (isCloudActive) refreshData(true); }, [isCloudActive]);
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') refreshData(true); };
    window.addEventListener('visibilitychange', onFocus);
    return () => window.removeEventListener('visibilitychange', onFocus);
  }, [refreshData]);

  useEffect(() => {
    localStorage.setItem('shopping_lists', JSON.stringify(lists));
    localStorage.setItem('product_db', JSON.stringify(db));
    localStorage.setItem('category_colors', JSON.stringify(categoryColors));
    localStorage.setItem('emoji_library', JSON.stringify(manualEmojiLibrary));
    localStorage.setItem('active_list_id', activeListId);
    localStorage.setItem('sort_mode', sortMode);
  }, [lists, db, categoryColors, manualEmojiLibrary, activeListId, sortMode]);

  // --- LOGICA BUSINESS ---

  const handleSelectList = (id: string) => {
    setActiveListId(id);
    setCurrentView('list');
  };

  const handleFactoryReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setActiveListId('');
  };

  const createList = async (name: string) => {
    const newList: ShoppingList = {
      id: generateUUID(),
      name: name.trim() || 'Nuova Lista',
      items: [],
      isLocal: true, // Le nuove liste nascono SEMPRE locali
      updatedAt: Date.now()
    };
    setLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    setCurrentView('list');
  };

  const toggleListType = async (id: string) => {
    const target = lists.find(l => l.id === id);
    if (!target) return;

    const now = Date.now();

    if (target.isLocal) {
      // Passaggio da LOCALE a CLOUD: Carichiamo l'originale
      setLists(prev => prev.map(l => l.id === id ? { ...l, isLocal: false, updatedAt: now } : l));
      if (isCloudActive) {
        setSyncStatus('syncing');
        try {
          await repository.upsertList(id, { name: target.name, updatedAt: now });
          for (const it of target.items) {
            await repository.upsertItem(it, id);
          }
          showToast("Lista condivisa");
          setSyncStatus('saved');
        } catch (e) { setSyncStatus('error'); }
      }
    } else {
      // Passaggio da CLOUD a LOCALE: CREIAMO UNA COPIA
      const newId = generateUUID();
      const newList: ShoppingList = {
        ...target,
        id: newId,
        name: target.name + "_copy",
        isLocal: true,
        updatedAt: now,
        items: target.items.map(it => ({ ...it, id: generateUUID(), updatedAt: now }))
      };

      setLists(prev => [...prev, newList]);
      showToast("Copia locale creata");
    }
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const deleteList = async (id: string) => {
    const list = lists.find(l => l.id === id);
    setLists(prev => prev.filter(l => l.id !== id));
    if (isCloudActive && list && !list.isLocal) {
      try { await repository.deleteList(id); } catch (e) {}
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const clearActiveList = useCallback(async () => {
    if (!activeListId) return;
    const now = Date.now();
    const idsToDelete = (activeList?.items || []).map(i => i.id);

    setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: [], updatedAt: now } : l));

    if (isCloudActive && !activeList?.isLocal && idsToDelete.length > 0) {
      try {
        for (const id of idsToDelete) {
          await repository.deleteItem(id);
        }
      } catch (e) { setSyncStatus('error'); }
    }
    showToast("Lista svuotata completamente");
  }, [activeListId, activeList, isCloudActive]);

  const clearPurchasedItems = useCallback(async () => {
    if (!activeListId) return;
    const now = Date.now();
    const purchasedIds = (activeList?.items || []).filter(i => i.isChecked).map(i => i.id);

    if (purchasedIds.length === 0) return;

    // Update Locale
    setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.filter(i => !i.isChecked), updatedAt: now } : l));

    // Update Cloud
    if (isCloudActive && !activeList?.isLocal) {
      try {
        for (const id of purchasedIds) {
          await repository.deleteItem(id);
        }
      } catch (e) { setSyncStatus('error'); }
    }
    showToast("Prodotti acquistati rimossi");
  }, [activeListId, activeList, isCloudActive]);

  const addItem = async (name: string, q: number, u: string, meta?: any, notes?: string) => {
    setIsAdding(true);
    let p = db.find(p => p.normalizedName.toLowerCase() === name.toLowerCase());
    const now = Date.now();

    if (!p) {
      const m = meta || await classifyProduct(name);
      // I prodotti nuovi creati dall'app appartengono alla famiglia corrente
      p = { ...m, id: generateUUID(), usageCount: 1, updatedAt: now, familyId: familyCode };
      setDb(prev => [...prev, p!]);
      if (isCloudActive) repository.upsertCatalog(p!);
    } else {
      p = { ...p, usageCount: p.usageCount + 1, updatedAt: now };
      setDb(prev => prev.map(x => x.id === p!.id ? p! : x));
      if (isCloudActive) repository.upsertCatalog(p!);
    }

    const it: GroceryItem = { id: generateUUID(), productId: p!.id, isChecked: false, quantity: q, unit: u, notes: notes || null, updatedAt: now };

    setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: [it, ...l.items], updatedAt: now } : l));

    if (isCloudActive && activeList && !activeList.isLocal) {
      repository.upsertItem(it, activeList.id).catch(() => setSyncStatus('error'));
    }

    setIsAdding(false); setInputValue('');
  };

  const updateItem = async (id: string, up: any, color?: string, isCopy = false) => {
    const now = Date.now();
    if (id.startsWith('ADD_FROM_CATALOG_')) {
      const m = { normalizedName: (up.normalizedName || id.replace('ADD_FROM_CATALOG_', '')).trim(), category: (up.category || 'Altro').trim(), emoji: up.emoji || '🛒' };
      addItem(m.normalizedName, up.quantity, up.unit, m, up.notes);
      if (up.category && color) setCategoryColors(prev => ({ ...prev, [up.category]: color }));
    } else if (id.startsWith('CATALOG_EDIT_')) {
      const pid = id.replace('CATALOG_EDIT_', '');
      const product = db.find(x => x.id === pid);
      if (product) {
        const updatedP = { ...product, ...up, updatedAt: now };
        setDb(prev => prev.map(x => x.id === pid ? updatedP : x));
        if (isCloudActive) {
          repository.upsertCatalog(updatedP);
        }
      }
      if (up.category && color) setCategoryColors(prev => ({ ...prev, [up.category]: color }));
    } else {
      let finalUpdatedItem: GroceryItem | null = null;
      setLists(prev => prev.map(l => {
        if (l.id !== activeListId) return l;
        const target = l.items.find(x => x.id === id);
        if (!target) return l;
        const master = db.find(x => x.id === target.productId);
        const meta = { normalizedName: up.normalizedName ?? (master?.normalizedName || ''), category: up.category ?? (master?.category || ''), emoji: up.emoji ?? (master?.emoji || '') };
        const isDiff = !master || meta.normalizedName !== master.normalizedName || meta.category !== master.category || meta.emoji !== master.emoji;
        const updated = { ...target, isChecked: up.isChecked ?? target.isChecked, quantity: up.quantity ?? target.quantity, unit: up.unit ?? target.unit, notes: up.notes ?? target.notes, updatedAt: now, customMetadata: isDiff ? meta : undefined };
        finalUpdatedItem = updated;
        return { ...l, items: isCopy ? [...l.items, { ...updated, id: generateUUID(), isChecked: false }] : l.items.map(x => x.id === id ? updated : x) };
      }));

      if (isCloudActive && activeList && !activeList.isLocal && finalUpdatedItem) {
        repository.upsertItem(finalUpdatedItem, activeList.id).catch(console.error);
      }

      if (up.category && color) {
        setCategoryColors(prev => ({ ...prev, [up.category]: color }));
      }
    }
    setEditingItem(null);
  };

  // --- RENDER HELPERS ---
  const resolveProductMetadata = useCallback((item: GroceryItem): ProductMetadata => {
    const master = db.find(p => p.id === item.productId);

    // Se l'utente ha personalizzato questo specifico acquisto, usiamo i suoi dati
    if (item.customMetadata) {
      return {
        normalizedName: item.customMetadata.normalizedName || (master?.normalizedName || 'Sconosciuto'),
        category: item.customMetadata.category || (master?.category || 'Altro'),
        emoji: item.customMetadata.emoji || (master?.emoji || '🛒')
      };
    }

    // Altrimenti usiamo il catalogo master
    if (master) return master;

    return { normalizedName: 'Sconosciuto', category: 'Altro', emoji: '🛒' };
  }, [db]);

  const hydratedItems = useMemo(() => (activeList?.items || []).map(it => ({ ...it, metadata: resolveProductMetadata(it) })), [activeList?.items, resolveProductMetadata]);

  const sortedItems = useMemo(() => {
    let sorted = [...hydratedItems];
    const basic = (a: any, b: any) => (a.isChecked === b.isChecked ? 0 : a.isChecked ? 1 : -1);
    sorted.sort((a, b) => {
      const check = basic(a, b);
      if (check !== 0) return check;
      if (sortMode === 'alpha') return a.metadata.normalizedName.localeCompare(b.metadata.normalizedName);
      if (sortMode === 'category') return a.metadata.category.localeCompare(b.metadata.category) || a.metadata.normalizedName.localeCompare(b.metadata.normalizedName);
      return 0;
    });
    return sorted;
  }, [hydratedItems, sortMode]);

  const filteredCatalog = useMemo(() => {
    const unique = new Map();
    db.filter(Boolean).forEach(p => {
      const name = p.normalizedName || "";
      const cat = p.category || "Altro";
      const k = `${name.toLowerCase()}_${cat.toLowerCase()}`;
      if (!unique.has(k) || (p.usageCount || 0) > unique.get(k).usageCount) unique.set(k, p);
    });
    let f = Array.from(unique.values());
    if (inputValue.trim()) f = f.filter(p => p.normalizedName.toLowerCase().includes(inputValue.toLowerCase().trim()));
    f.sort((a, b) => a.normalizedName.localeCompare(b.normalizedName));
    return f;
  }, [db, inputValue]);

  const allCategories = useMemo(() => {
    const standard = Object.values(Category);
    const fromDb = db.filter(Boolean).map(p => p.category);
    const custom = Object.keys(categoryColors);
    return Array.from(new Set([...standard, ...fromDb, ...custom])).filter(Boolean).sort() as string[];
  }, [db, categoryColors]);

  const dynamicEmojiLibrary = useMemo(() => {
    const fromDb = db.filter(Boolean).map(p => p.emoji);
    return Array.from(new Set([...fromDb, ...manualEmojiLibrary, ...DEFAULT_EMOJI_LIBRARY])).filter(e => e && e.trim() !== '');
  }, [db, manualEmojiLibrary]);

  // --- DRAG & DROP ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (over && active.id !== over.id) {
      setLists(prev => prev.map(l => {
        if (l.id !== activeListId) return l;
        const oldIndex = l.items.findIndex(i => i.id === active.id);
        const newIndex = l.items.findIndex(i => i.id === over.id);
        return { ...l, items: arrayMove(l.items, oldIndex, newIndex), updatedAt: Date.now() };
      }));
    }
  };

  const handleRenameList = async (id: string, newName: string) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, name: newName, updatedAt: Date.now() } : l));
    if (isCloudActive) {
      const list = lists.find(l => l.id === id);
      if (list && !list.isLocal) {
        try {
          await repository.upsertList(id, { name: newName, updatedAt: Date.now() });
        } catch (e) { setSyncStatus('error'); }
      }
    }
  };

  // --- WELCOME GUARD ---
  if (!familyCode) {
    return <WelcomeScreen onConfigured={() => setFamilyCodeState(getFamilyCode())} />;
  }

  return (
    <div className="fixed inset-0 h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100">
      {toastMessage && <div className="absolute top-4 left-4 right-4 z-[100] bg-blue-600 text-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4" onClick={() => setToastMessage(null)}><Bell size={20} />{toastMessage}</div>}

      <Sidebar
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
        isCloudActive={isCloudActive} isConnectionValid={syncStatus !== 'error'}
        isMasterUser={true} deviceId={deviceId}
        theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        isSoundEnabled={isSoundEnabled} onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
        onOpenCloudSettings={() => {}}
        onDisconnectCloud={() => { clearFamilyCode(); setFamilyCodeState(null); }}
        onOpenUsageGuide={() => setShowUsageGuide(true)}
        onOpenUpdateLog={() => setShowUpdateLog(true)}
        onFactoryReset={() => setShowResetConfirm(true)}
        onOpenCatalog={() => { setCatalogMode('global'); setShowCatalog(true); }}
      />

      <header className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {currentView !== 'home' && <button onClick={handleGoHome} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mr-1 shrink-0"><ArrowLeft size={24} /></button>}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600 shadow-sm shrink-0">
             <img src="/Carrello.png" className="w-full h-full object-cover scale-110" alt="Logo" />
          </div>
          <h1 className="text-xl font-bold truncate">{currentView === 'home' ? 'Le mie liste' : activeList?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {currentView === 'list' && activeList?.isLocal && (
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`p-2 rounded-full transition-all active:scale-90 ${showSortMenu ? 'bg-blue-100 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Ordina lista"
            >
              <ArrowUpDown size={24} />
            </button>
          )}

          <button onClick={() => setIsSidebarOpen(true)} className="bg-blue-600 p-3 rounded-lg text-white relative shadow-md active:scale-95 transition-transform">
            <Menu size={24} />
            {isCloudActive && <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${syncStatus==='syncing'?'bg-yellow-400 animate-pulse':syncStatus==='error'?'bg-red-500':'bg-green-500'}`} />}
          </button>
        </div>

        {showSortMenu && (
          <div className="absolute top-16 right-4 z-[70] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 min-w-[180px] animate-in slide-in-from-top-4">
            <div className="px-3 py-2 border-b dark:border-gray-700 mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ordina per</p>
            </div>
            {[
              { id: 'alpha', label: 'Nome A-Z' },
              { id: 'category', label: 'Per Categoria' },
              { id: 'custom', label: 'Manuale (Drag)' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => { setSortMode(opt.id as SortMode); setShowSortMenu(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${sortMode === opt.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-44">
        {currentView === 'home' ? (
          <HomePage
            lists={lists} isCloudActive={isCloudActive} currentDeviceId={deviceId}
            onSelectList={handleSelectList} onCreateList={createList}
            onDeleteList={(id) => setListToDeleteId(id)} onRenameList={handleRenameList} onToggleListType={toggleListType}
          />
        ) : (
          <div className="p-4 relative min-h-full">
            {sortedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 animate-in fade-in duration-500">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-full mb-4">
                  <BookHeart size={48} className="opacity-20" />
                </div>
                <h3 className="font-bold text-lg">La lista è vuota</h3>
                <p className="text-sm">Aggiungi un prodotto dal catalogo</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {sortedItems.map(it => (
                      <ListItem
                        key={it.id} item={it} metadata={it.metadata} sortMode={sortMode}
                        onToggle={async (id) => {
                            const next = !it.isChecked;
                            const updated = { ...it, isChecked: next, updatedAt: Date.now() };
                            setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.map(x => x.id === id ? updated : x), updatedAt: Date.now() } : l));
                            if (isCloudActive && !activeList?.isLocal) {
                              repository.upsertItem(updated, activeListId).catch(() => setSyncStatus('error'));
                            }
                        }}
                        onDelete={async (id) => {
                            setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.filter(x => x.id !== id), updatedAt: Date.now() } : l));
                            if (isCloudActive && !activeList?.isLocal) {
                              repository.deleteItem(id).catch(() => setSyncStatus('error'));
                            }
                        }}
                        onUpdate={async (id, up) => {
                            const item = activeList?.items.find(x => x.id === id);
                            if (!item) return;
                            const updated = { ...item, ...up, updatedAt: Date.now() };
                            setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.map(x => x.id === id ? updated : x), updatedAt: Date.now() } : l));
                            if (isCloudActive && !activeList?.isLocal) {
                              repository.upsertItem(updated, activeListId).catch(() => setSyncStatus('error'));
                            }
                        }}
                        onEdit={(item, meta) => setEditingItem({ ...item, metadata: meta })}
                        readOnly={false}
                        isDraggable={activeList?.isLocal && sortMode === 'custom'}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '0.5' } },
                  }),
                }}>
                  {activeDragId ? (
                    <ListItem
                      item={hydratedItems.find(i => i.id === activeDragId)!}
                      metadata={resolveProductMetadata(hydratedItems.find(i => i.id === activeDragId)!)}
                      sortMode={sortMode}
                      isOverlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
            {/* Spacer per evitare che l'ultima scheda sia coperta dalla barra inferiore */}
            <div className="h-32" />
          </div>
        )}
      </main>

      {currentView === 'list' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setShowClearPurchasedConfirm(true)}
            disabled={!activeList?.items.some(i => i.isChecked)}
            className="p-3 rounded-xl text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 active:scale-90 transition-all disabled:opacity-30"
            title="Elimina acquistati"
          >
            <Check size={24} />
          </button>

          <button
            onClick={() => { setInputValue(''); setCatalogMode('list'); setShowCatalog(true); }}
            className="w-16 h-16 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center -mt-12 border-4 border-white dark:border-gray-900 active:scale-90 transition-transform"
          >
            <Plus size={32} />
          </button>

          <button
            onClick={() => setShowClearAllConfirm(true)}
            disabled={!activeList?.items.length}
            className="p-3 rounded-xl text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 active:scale-90 transition-all disabled:opacity-30"
            title="Svuota lista"
          >
            <Trash2 size={24} />
          </button>
        </div>
      )}

      {showClearPurchasedConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h3 className="font-bold mb-2 text-lg">Rimuovere acquistati?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              I prodotti spuntati verranno rimossi dalla lista.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearPurchasedConfirm(false)} className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold active:scale-95 transition-transform">Annulla</button>
              <button onClick={() => { clearPurchasedItems(); setShowClearPurchasedConfirm(false); }} className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Sì, elimina</button>
            </div>
          </div>
        </div>
      )}

      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="font-bold mb-2 text-lg text-red-600">Svuotare tutto?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Questa azione eliminerà <strong>tutti</strong> i prodotti dalla lista, anche quelli non acquistati.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearAllConfirm(false)} className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold active:scale-95 transition-transform">Annulla</button>
              <button onClick={() => { clearActiveList(); setShowClearAllConfirm(false); }} className="flex-1 p-3 bg-red-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Sì, svuota</button>
            </div>
          </div>
        </div>
      )}

      {listToDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="font-bold mb-2 text-lg text-red-600">Eliminare la lista?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              L'azione è irreversibile e rimuoverà la lista da tutti i dispositivi se condivisa.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setListToDeleteId(null)} className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold active:scale-95 transition-transform">Annulla</button>
              <button onClick={() => { deleteList(listToDeleteId); setListToDeleteId(null); }} className="flex-1 p-3 bg-red-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Sì, elimina</button>
            </div>
          </div>
        </div>
      )}
      {editingItem && <EditItemModal item={editingItem} availableCategories={allCategories} emojiLibrary={dynamicEmojiLibrary} currentCategoryColors={categoryColors} catalogMode={catalogMode} onClose={() => setEditingItem(null)} onSave={updateItem} />}

      {showCatalog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl h-[90vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="p-4 border-b dark:border-gray-700 flex flex-col gap-4">
              <div className="flex justify-between items-center"><h2 className="font-bold text-lg">Catalogo Prodotti</h2><button onClick={() => setShowCatalog(false)}><X /></button></div>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 p-3 pl-10 rounded-xl" placeholder="Cerca nel catalogo..." /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {inputValue.trim() && !filteredCatalog.some(p => p.normalizedName.toLowerCase() === inputValue.toLowerCase().trim()) && (
                <button onClick={() => { setEditingItem({ id: catalogMode === 'global' ? 'CATALOG_ADD_NEW' : 'ADD_FROM_CATALOG_' + inputValue, normalizedName: inputValue, category: 'Altro', emoji: '🛒', quantity: 1, unit: 'pz' }); setInputValue(''); }} className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> Aggiungi "{inputValue}"</button>
              )}
              {filteredCatalog.map(p => (
                <div key={p.id} onClick={() => { setEditingItem(catalogMode === 'list' ? { ...p, id: 'ADD_FROM_CATALOG_' + p.normalizedName, quantity: 1, unit: 'pz' } : { ...p, id: 'CATALOG_EDIT_' + p.id }); setInputValue(''); }} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 cursor-pointer active:scale-95 transition-transform">
                  <ProductIcon emoji={p.emoji} category={p.category} customColorClass={categoryColors[p.category]} />
                  <div className="flex-1"><p className="font-bold">{p.normalizedName}</p><p className="text-xs text-gray-400">{p.category}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw size={32} />
            </div>
            <h3 className="font-bold mb-2 text-lg text-red-600">Ripristino App?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Tutti i dati locali, le preferenze e il codice famiglia verranno cancellati definitivamente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold active:scale-95 transition-transform">Annulla</button>
              <button onClick={handleFactoryReset} className="flex-1 p-3 bg-red-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Sì, ripristina</button>
            </div>
          </div>
        </div>
      )}

      {showUsageGuide && <UsageGuideModal onClose={() => setShowUsageGuide(false)} />}
      {showUpdateLog && <UpdateLogModal onClose={() => setShowUpdateLog(false)} />}
    </div>
  );
}

export default App;
