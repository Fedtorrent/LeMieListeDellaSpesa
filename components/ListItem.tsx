import React, { useState, useEffect, memo } from 'react';
import { GroceryItem, SortMode, ProductMetadata } from '../types';
import { ProductIcon } from './ProductIcon';
import { Check, Trash2, Minus, Plus, Pencil, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ListItemProps {
  item: GroceryItem;
  metadata: ProductMetadata;
  sortMode: SortMode;
  categoryColor?: string;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, changes: Partial<GroceryItem>) => void;
  onEdit?: (item: GroceryItem, metadata: ProductMetadata) => void;
  readOnly?: boolean;
  isDraggable?: boolean;
  isOverlay?: boolean;
}

const UNITS = ['pz', 'kg', 'hg', 'g', 'L', 'ml', 'conf', 'bt', 'scatola'];

// Componente base per evitare re-render non necessari e gestire l'Overlay
const ListItemContent = memo(({
  item, metadata, categoryColor, onToggle, onDelete, onUpdate, onEdit, readOnly, isDraggable, isOverlay,
  attributes, listeners
}: any) => {
  const [localQuantity, setLocalQuantity] = useState((item.quantity ?? 1).toString());

  useEffect(() => {
    setLocalQuantity((item.quantity ?? 1).toString());
  }, [item.quantity]);

  const handleQuantityChange = (delta: number) => {
    if (readOnly) return;
    const currentQty = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity as any) || 0;
    const newQty = Math.max(0.1, parseFloat((currentQty + delta).toFixed(1)));
    onUpdate?.(item.id, { quantity: newQty });
  };

  const commitInput = () => {
    if (readOnly) return;
    let val = parseFloat(localQuantity.replace(',', '.'));
    if (isNaN(val) || val <= 0) val = 1;
    val = Math.round(val * 100) / 100;
    onUpdate?.(item.id, { quantity: val });
  };

  return (
    <div className={`group flex flex-col p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-200 ${item.isChecked ? 'border-transparent bg-gray-50 dark:bg-gray-800/50 opacity-60' : 'border-gray-100 dark:border-gray-700'} ${isOverlay ? 'shadow-2xl ring-2 ring-blue-500 scale-[1.02] opacity-100 z-[100]' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-3 flex-1 min-w-0 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`} onClick={() => !readOnly && onToggle?.(item.id)}>
          <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.isChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
            {item.isChecked && <Check size={14} className="text-white" />}
          </div>
          <ProductIcon emoji={metadata.emoji} category={metadata.category} customColorClass={categoryColor} />
          <div className="flex flex-col min-w-0">
            <span className={`font-semibold text-base truncate ${item.isChecked ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>{metadata.normalizedName}</span>
            <span className="text-xs text-gray-400 truncate">{metadata.category}</span>
            {item.notes && !item.isChecked && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 italic">
                {item.notes}
              </p>
            )}
          </div>
        </div>

        {isDraggable && !readOnly && (
          <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing touch-none text-blue-600 shrink-0">
            <GripVertical size={22} />
          </div>
        )}
      </div>

      {!item.isChecked && !readOnly && !isOverlay && (
        <div className="flex items-center justify-between mt-2 pl-12 gap-2">
          <div className="flex items-center gap-2">
             <button onClick={() => onEdit?.(item, metadata)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50"><Pencil size={18} /></button>
             <button onClick={() => onDelete?.(item.id)} className="p-2 text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={18} /></button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(-1); }} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md" disabled={item.quantity <= 0.1}><Minus size={14} /></button>
              <input type="number" inputMode="decimal" value={localQuantity} onClick={e => e.stopPropagation()} onChange={e => setLocalQuantity(e.target.value)} onBlur={commitInput} className="w-10 text-center text-xs font-bold bg-transparent outline-none" />
              <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(1); }} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md"><Plus size={14} /></button>
            </div>
            <select value={item.unit} onChange={e => onUpdate?.(item.id, { unit: e.target.value })} onClick={e => e.stopPropagation()} className="bg-gray-100 dark:bg-gray-700 text-xs font-medium py-1.5 px-2 rounded-lg outline-none">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
});

export const ListItem = memo((props: ListItemProps) => {
  const { id } = props.item;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !props.isDraggable || props.readOnly
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // L'elemento originale diventa semitrasparente mentre trascini
    willChange: 'transform',
  };

  if (props.isOverlay) {
    return <ListItemContent {...props} />;
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ListItemContent {...props} attributes={attributes} listeners={listeners} />
    </div>
  );
});
