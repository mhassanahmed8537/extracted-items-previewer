import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Undo, 
  Layers, 
  AlertCircle, 
  Search, 
  Tag, 
  Flame, 
  CornerRightDown, 
  DollarSign, 
  Hash, 
  Compass, 
  Clock, 
  ListOrdered
} from 'lucide-react';
import { ExtractedItem, BeoSection } from '../types';
import { getConfidenceTier } from '../data';

interface GuidedFocusViewProps {
  items: ExtractedItem[];
  activeItemId: number | null;
  onSelectItem: (id: number) => void;
  onUpdateItem: (updated: ExtractedItem) => void;
  onKeepItem: (id: number) => void;
  onRemoveItem: (id: number) => void;
  onRestoreItem: (id: number) => void;
}

const SECTIONS: BeoSection[] = ['Food & Beverage', 'Audio Visual', 'Room Setup', 'Other'];

export default function GuidedFocusView({
  items,
  activeItemId,
  onSelectItem,
  onUpdateItem,
  onKeepItem,
  onRemoveItem,
  onRestoreItem,
}: GuidedFocusViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'needs-review' | 'manual' | 'kept' | 'removed'>('all');

  // Find currently active item or pick first
  const activeItem = items.find(i => i.id === activeItemId) || items[0] || null;

  // Filter queue sidebar items
  const filteredQueueItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.beo_section.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const tier = getConfidenceTier(item.confidence, item.match_status);
    if (filterType === 'needs-review') return item.status === 'PENDING' && (item.match_status === 'REVIEW' || item.confidence < 0.8);
    if (filterType === 'manual') return item.status === 'PENDING' && item.match_status === 'NOT_AVAILABLE';
    if (filterType === 'kept') return item.status === 'KEPT';
    if (filterType === 'removed') return item.status === 'REMOVED';
    return true; // 'all'
  });

  // Index of active item in the *full list*
  const activeIndex = items.findIndex(i => i.id === (activeItem?.id ?? -1));

  const handleNext = () => {
    if (items.length === 0) return;
    const nextIdx = (activeIndex + 1) % items.length;
    onSelectItem(items[nextIdx].id);
  };

  const handlePrev = () => {
    if (items.length === 0) return;
    const prevIdx = (activeIndex - 1 + items.length) % items.length;
    onSelectItem(items[prevIdx].id);
  };

  // Safe updates
  const updateName = (val: string) => {
    if (!activeItem) return;
    onUpdateItem({ ...activeItem, item_name: val, user_edited: true });
  };

  const updateQty = (val: string) => {
    if (!activeItem) return;
    const num = val === '' ? null : Number(val);
    onUpdateItem({ ...activeItem, extracted_quantity: num, user_edited: true });
  };

  const updatePrice = (val: string) => {
    if (!activeItem) return;
    const num = val === '' ? null : Number(val);
    onUpdateItem({ ...activeItem, extracted_unit_price: num, user_edited: true });
  };

  const updateSection = (sec: BeoSection) => {
    if (!activeItem) return;
    onUpdateItem({ ...activeItem, beo_section: sec, user_edited: true });
  };

  const getTriagePill = (item: ExtractedItem) => {
    const tier = getConfidenceTier(item.confidence, item.match_status);
    if (tier === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/25">
          <Check className="w-3 h-3" /> CONFIDENT ({Math.round(item.confidence * 100)}%)
        </span>
      );
    }
    if (tier === 'review') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 animate-pulse">
          <AlertCircle className="w-3 h-3 text-amber-500" /> REVIEW REQUIRED ({Math.round(item.confidence * 100)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/25">
        <Hash className="w-3 h-3" /> MANUAL ENTRY
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full" id="guided-focused-view-container">
      
      {/* Stream Queue Drawer (Left column, width=4) */}
      <div className="lg:col-span-4 flex flex-col bg-surface border border-border rounded-xl  overflow-hidden h-full">
        {/* Drawer Header */}
        <div className="p-3 bg-bg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ListOrdered className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-bold uppercase tracking-wide text-dim">Triage Stream</span>
          </div>
          <span className="text-[10px] font-mono bg-border px-1.5 py-0.5 rounded text-dim font-bold">
            {filteredQueueItems.length} items
          </span>
        </div>

        {/* Quick Filters */}
        <div className="p-2 border-b border-border bg-surface/50 space-y-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-muted">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search stream..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg text-xs border border-border rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue placeholder:text-muted"
            />
          </div>

          <div className="flex flex-wrap gap-1 pt-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${
                filterType === 'all'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-bg hover:bg-border text-muted border-border'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('needs-review')}
              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${
                filterType === 'needs-review'
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-bg hover:bg-border text-muted border-border'
              }`}
              title="Items needing manual verification"
            >
              ⚠️ Review
            </button>
            <button
              onClick={() => setFilterType('manual')}
              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${
                filterType === 'manual'
                  ? 'bg-slate-700 border-slate-700 text-white'
                  : 'bg-bg hover:bg-border text-muted border-border'
              }`}
              title="Items without matched catalog data"
            >
              ⚙️ Manual
            </button>
            <button
              onClick={() => setFilterType('kept')}
              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${
                filterType === 'kept'
                  ? 'bg-green-700 border-green-700 text-white'
                  : 'bg-bg hover:bg-border text-muted border-border'
              }`}
            >
              ✓ Kept
            </button>
          </div>
        </div>

        {/* List of queue items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border bg-surface">
          {filteredQueueItems.length === 0 ? (
            <div className="p-8 text-center text-muted flex flex-col items-center gap-1">
              <Compass className="w-5 h-5 text-muted animate-spin" />
              <span className="text-xs">No matching triage values</span>
            </div>
          ) : (
            filteredQueueItems.map((item) => {
              const fileTier = getConfidenceTier(item.confidence, item.match_status);
              const isActive = activeItem?.id === item.id;
              
              let highlightIndicatorColor = "bg-green-500";
              if (fileTier === 'review') highlightIndicatorColor = "bg-amber-500";
              if (fileTier === 'manual') highlightIndicatorColor = "bg-slate-500";
              
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className={`p-3 text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 hover:bg-bg ${
                    isActive ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full ${highlightIndicatorColor}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono truncate">
                        {item.beo_section}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-dim group-hover:text-text truncate">
                      {item.item_name}
                    </h4>
                    <p className="text-[10px] text-muted font-mono mt-0.5 truncate">
                      {item.extracted_quantity ?? '?'} × ${item.extracted_unit_price ?? '?'}
                    </p>
                  </div>

                  {/* Status Indicator bubble */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {item.status === 'KEPT' && (
                      <span className="text-[8px] bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold border border-green-300 dark:border-green-800 px-1 rounded uppercase">
                        Kept
                      </span>
                    )}
                    {item.status === 'REMOVED' && (
                      <span className="text-[8px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold border border-red-300 dark:border-red-800 px-1 rounded uppercase">
                        Omitted
                      </span>
                    )}
                    {item.status === 'PENDING' && (
                      <span className="text-[8px] bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 font-bold border border-amber-300 dark:border-slate-700 px-1 rounded uppercase animate-pulse">
                        Pending
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-muted">
                      #{item.id}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Guided Detail Card Column (Right column, width=8) */}
      <div className="lg:col-span-8 flex flex-col bg-surface border border-border rounded-xl shadow-sm overflow-hidden h-full">
        {activeItem ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Card Header & Triage indicator */}
            <div className="p-4 bg-bg border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-border px-2 py-0.5 rounded font-bold text-dim">
                  Item {activeIndex + 1} of {items.length}
                </span>
                <span className="text-xs text-muted">| ID #{activeItem.id}</span>
              </div>
              
              {/* Derived Triage tier tag */}
              {getTriagePill(activeItem)}
            </div>

            {/* Main Interactive Details Fields */}
            <div className="p-5 lg:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Provenance Document Source Fragment Header */}
              <div className="bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-1.5 text-blue-900 dark:text-blue-300 text-xs font-bold font-sans">
                  <CornerRightDown className="w-4 h-4 text-accent-blue" />
                  <span>Document Provenance Snippet:</span>
                </div>
                <blockquote className="font-mono text-xs p-3 bg-white dark:bg-black/35 rounded-lg border border-border border-dashed leading-relaxed text-dim italic">
                  "{activeItem.snippet}"
                </blockquote>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {/* Item Name (spans 4) */}
                <div className="md:col-span-6 space-y-1">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Extracted Item Name
                  </label>
                  <input
                    type="text"
                    value={activeItem.item_name}
                    onChange={(e) => updateName(e.target.value)}
                    className="w-full text-sm font-sans font-medium px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-text"
                    placeholder="Enter item name..."
                  />
                </div>

                {/* Quantity (spans 2) */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Quantity
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-muted">
                      <Hash className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="number"
                      value={activeItem.extracted_quantity === null ? '' : activeItem.extracted_quantity}
                      onChange={(e) => updateQty(e.target.value)}
                      className="w-full text-sm font-mono pl-7 pr-2.5 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-text"
                      placeholder="e.g. 1"
                    />
                  </div>
                </div>

                {/* Price (spans 2) */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Unit Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-muted">
                      <DollarSign className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="number"
                      value={activeItem.extracted_unit_price === null ? '' : activeItem.extracted_unit_price}
                      onChange={(e) => updatePrice(e.target.value)}
                      className="w-full text-sm font-mono pl-7 pr-2.5 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-text"
                      placeholder="e.g. 45"
                    />
                  </div>
                </div>

                {/* Calculated Line Value */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Calculated Total
                  </label>
                  <div className="w-full bg-bg font-mono font-bold text-sm text-dim px-3 py-2 rounded-lg border border-border flex items-center h-[38px]">
                    {activeItem.extracted_quantity !== null && activeItem.extracted_unit_price !== null ? (
                      <span className="text-accent-blue">
                        ${(activeItem.extracted_quantity * activeItem.extracted_unit_price).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted/65 italic text-xs">Awaiting Qty / Price</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Re-assign Section mapping buttons */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
                  Map to Banquet Event Order Section
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SECTIONS.map((sec) => {
                    const isSelected = activeItem.beo_section === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => updateSection(sec)}
                        className={`py-2 px-3 border text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/40 border-accent-blue text-accent-blue shadow-sm'
                            : 'bg-surface hover:bg-bg border-border text-dim'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{sec}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Bar (Keep / Reject / Restore + Navigator buttons) */}
            <div className="p-4 bg-bg border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Prev / Next Keyboard Navigation */}
              <div className="flex items-center space-x-1 order-2 sm:order-1">
                <button
                  onClick={handlePrev}
                  className="px-3 py-2 text-xs bg-surface border border-border rounded-lg hover:bg-bg text-dim font-bold flex items-center gap-1"
                  title="Previous Item"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={handleNext}
                  className="px-3 py-2 text-xs bg-surface border border-border rounded-lg hover:bg-bg text-dim font-bold flex items-center gap-1"
                  title="Next Item"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Triage Keep / Remove actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                {activeItem.status === 'KEPT' ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/25 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                      <Check className="w-4 h-4" /> KEPT & CONFIRMED
                    </span>
                    <button
                      onClick={() => onRestoreItem(activeItem.id)}
                      className="px-3 py-1.5 border border-border text-xs rounded-lg hover:bg-bg text-dim flex items-center gap-1 shadow-sm font-bold bg-surface"
                      title="Undo keep, return to pending"
                    >
                      <Undo className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>
                ) : activeItem.status === 'REMOVED' ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/25 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                      <X className="w-4 h-4" /> OMITTED FROM BOOKING
                    </span>
                    <button
                      onClick={() => onRestoreItem(activeItem.id)}
                      className="px-3 py-1.5 border border-border text-xs rounded-lg hover:bg-bg text-dim flex items-center gap-1 shadow-sm font-bold bg-surface"
                      title="Undo omit, return to pending"
                    >
                      <Undo className="w-3.5 h-3.5" /> Restore
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onRemoveItem(activeItem.id)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-red-50/80 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" /> Omit Line Item
                    </button>
                    <button
                      onClick={() => onKeepItem(activeItem.id)}
                      className="flex-1 sm:flex-initial px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow"
                    >
                      <Check className="w-4 h-4" /> Keep / Confirm Match
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center text-muted flex flex-col items-center justify-center gap-2 h-full">
            <Layers className="w-8 h-8 text-muted/65" />
            <span className="text-sm">No items in the booking queue.</span>
          </div>
        )}
      </div>

    </div>
  );
}
