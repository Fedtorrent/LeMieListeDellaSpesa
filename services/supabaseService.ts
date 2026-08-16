import { createClient } from '@supabase/supabase-js';
import { ShoppingList, ProductDatabaseEntry, GroceryItem } from '../types';

const SUPABASE_URL = 'https://yiyydxgyhagycxhxgoqx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpeXlkeGd5aGFneWN4aHhnb3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODgwMDQsImV4cCI6MjEwMTk2NDAwNH0.IWUeZp2JnSKWPI7tph2FwSxEJqkRTtGpoHDLmyhubw0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- UTILS ---

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getFamilyCode = () => localStorage.getItem('FAMILY_CODE');
export const setFamilyCode = (code: string) => localStorage.setItem('FAMILY_CODE', code.trim().toUpperCase());
export const clearFamilyCode = () => localStorage.removeItem('FAMILY_CODE');

// --- AUTH ---

export const getFamilyData = async (familyCode: string) => {
  const { data, error } = await supabase
    .from('families')
    .select('pin')
    .eq('id', familyCode.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return { exists: !!data, pin: data?.pin };
};

export const createFamily = async (familyCode: string, pin: string) => {
  const { error } = await supabase
    .from('families')
    .insert([{ id: familyCode.trim().toUpperCase(), pin }]);
  if (error) throw error;
};

// --- SYNC QUEUE (Offline Support) ---

interface SyncOperation {
  id: string;
  table: 'lists' | 'items' | 'catalog';
  action: 'upsert' | 'delete';
  payload: any;
}

let syncQueue: SyncOperation[] = JSON.parse(localStorage.getItem('sync_queue') || '[]');

const saveQueue = () => localStorage.setItem('sync_queue', JSON.stringify(syncQueue));

export const addToQueue = (op: SyncOperation) => {
  syncQueue = syncQueue.filter(x => !(x.id === op.id && x.table === op.table));
  syncQueue.push(op);
  saveQueue();
};

export const processQueue = async () => {
  if (syncQueue.length === 0 || !navigator.onLine) return;
  const currentQueue = [...syncQueue];
  syncQueue = [];
  saveQueue();
  for (const op of currentQueue) {
    try {
      if (op.action === 'upsert') await supabase.from(op.table).upsert(op.payload);
      else await supabase.from(op.table).delete().eq('id', op.id);
    } catch (e) {
      syncQueue.push(op);
      saveQueue();
    }
  }
};

window.addEventListener('online', processQueue);

// --- CORE REPOSITORY ---

export const repository = {
  async fetchAll() {
    const fId = getFamilyCode();
    if (!fId) return null;

    const [listsRes, catalogRes] = await Promise.all([
      supabase.from('lists').select('*, items(*)').eq('family_id', fId),
      supabase.from('catalog').select('*').or(`family_id.is.null,family_id.eq.${fId}`)
    ]);

    if (listsRes.error || catalogRes.error) throw new Error("Fetch failed");

    return {
      lists: (listsRes.data || []).map(l => ({
        id: l.id,
        name: l.name,
        updatedAt: Number(l.updated_at),
        isLocal: false,
        items: (l.items || []).map((it: any) => ({
          id: it.id,
          productId: it.product_id,
          isChecked: it.is_checked,
          quantity: it.quantity,
          unit: it.unit,
          notes: it.notes,
          updatedAt: Number(it.updated_at),
          customMetadata: it.custom_metadata
        }))
      })),
      catalog: (catalogRes.data || []).map((p: any) => ({
        id: p.id,
        normalizedName: p.name,
        category: p.category,
        emoji: p.emoji,
        usageCount: p.usage_count,
        updatedAt: Number(p.updated_at),
        familyId: p.family_id
      }))
    };
  },

  async upsertList(listId: string, data: { name: string, updatedAt: number }) {
    const fId = getFamilyCode();
    if (!fId) return;
    const payload = { id: listId, family_id: fId, name: data.name, updated_at: data.updatedAt };
    try {
      const { error } = await supabase.from('lists').upsert(payload);
      if (error) throw error;
    } catch (e) {
      addToQueue({ id: listId, table: 'lists', action: 'upsert', payload });
    }
  },

  async deleteList(listId: string) {
    try {
      const { error } = await supabase.from('lists').delete().eq('id', listId);
      if (error) throw error;
    } catch (e) {
      addToQueue({ id: listId, table: 'lists', action: 'delete', payload: null });
    }
  },

  async upsertItem(item: GroceryItem, listId: string) {
    const fId = getFamilyCode();
    if (!fId) return;
    const payload = {
      id: item.id, list_id: listId, family_id: fId, product_id: item.productId,
      is_checked: item.isChecked, quantity: item.quantity, unit: item.unit,
      notes: item.notes || null, updated_at: item.updatedAt, custom_metadata: item.customMetadata || null
    };
    try {
      const { error } = await supabase.from('items').upsert(payload);
      if (error) throw error;
    } catch (e) {
      addToQueue({ id: item.id, table: 'items', action: 'upsert', payload });
    }
  },

  async deleteItem(itemId: string) {
    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) throw error;
    } catch (e) {
      addToQueue({ id: itemId, table: 'items', action: 'delete', payload: null });
    }
  },

  async upsertCatalog(product: ProductDatabaseEntry) {
    const fId = getFamilyCode();
    if (!fId) return;
    const payload = {
      id: product.id, family_id: product.familyId !== undefined ? product.familyId : fId,
      name: product.normalizedName, category: product.category, emoji: product.emoji,
      usage_count: product.usageCount, updated_at: product.updatedAt
    };
    try {
      const { error } = await supabase.from('catalog').upsert(payload);
      if (error) throw error;
    } catch (e) {
      addToQueue({ id: product.id, table: 'catalog', action: 'upsert', payload });
    }
  },

  async deleteCatalog(productId: string) {
    const fId = getFamilyCode();
    try {
      // Aggiungiamo .eq('family_id', fId) per assicurarci di eliminare solo i nostri
      const { error } = await supabase
        .from('catalog')
        .delete()
        .eq('id', productId)
        .eq('family_id', fId);
      if (error) throw error;
    } catch (e) {
      addToQueue({ id: productId, table: 'catalog', action: 'delete', payload: null });
    }
  }
};

// --- REALTIME ---

export const subscribeToFamily = (
  familyId: string,
  onListChange: (payload: any) => void,
  onItemChange: (payload: any) => void
) => {
  return supabase
    .channel(`family-${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `family_id=eq.${familyId}` }, onListChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `family_id=eq.${familyId}` }, onItemChange)
    .subscribe();
};
