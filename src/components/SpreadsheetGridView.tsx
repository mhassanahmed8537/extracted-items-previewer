import React from 'react';
import { 
  Check, 
  X, 
  Sparkles, 
  ArrowUpDown, 
  AlertCircle, 
  Trash2, 
  Layers, 
  RefreshCw, 
  DollarSign, 
  Eye,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { ExtractedItem, BeoSection } from '../types';
import { getConfidenceTier } from '../data';

interface SpreadsheetGridViewProps {
  items: ExtractedItem[];
  activeItemId: number | null;
  onSelectItem: (id: number) => void;
  onUpdateItem: (updated: ExtractedItem) => void;
  onKeepItem: (id: number) => void;
  onRemoveItem: (id: number) => void;
  onRestoreItem: (id: number) => void;
  onBulkAction: (ids: number[], action: 'KEEP' | 'REMOVE' | 'REASSIGN', section?: BeoSection) => void;
}

type SortField = 'id' | 'item_name' | 'beo_section' | 'confidence' | 'extracted_quantity' | 'extracted_unit_price' | 'status';
type SortOrder = 'asc' | 'desc';

const SECTIONS: BeoSection[] = ['Food & Beverage', 'Audio Visual', 'Room Setup', 'Other'];

export default function SpreadsheetGridView({
  items,
  activeItemId,
  onSelectItem,
  onUpdateItem,
  onKeepItem,
  onRemoveItem,
  onRestoreItem,
  onBulkAction,
}: SpreadsheetGridViewProps) {
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [sortField, setSortField] = React.useState<SortField>('confidence');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState<'ALL' | 'HIGH' | 'REVIEW' | 'MANUAL'>('ALL');
  const [sectionFilter, setSectionFilter] = React.useState<string>('ALL');

  // Multi-select actions
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(item => item.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Safe updates for inline editing in table cells
  const handleInlineChange = (item: ExtractedItem, field: string, value: any) => {
    const updated = { ...item, user_edited: true };
    if (field === 'item_name') {
      updated.item_name = value;
    } else if (field === 'extracted_quantity') {
      updated.extracted_quantity = value === '' ? null : Number(value);
    } else if (field === 'extracted_unit_price') {
      updated.extracted_unit_price = value === '' ? null : Number(value);
    } else if (field === 'beo_section') {
      updated.beo_section = value as BeoSection;
    }
    onUpdateItem(updated);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.beo_section.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    const tier = getConfidenceTier(item.confidence, item.match_status);
    if (tierFilter === 'HIGH' && tier !== 'high') return false;
    if (tierFilter === 'REVIEW' && tier !== 'review') return false;
    if (tierFilter === 'MANUAL' && tier !== 'manual') return false;

    if (sectionFilter !== 'ALL' && item.beo_section !== sectionFilter) return false;

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let rawA = a[sortField];
    let rawB = b[sortField];

    if (rawA === null || rawA === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (rawB === null || rawB === undefined) return sortOrder === 'asc' ? 1 : -1;

    if (typeof rawA === 'string') {
      return sortOrder === 'asc' 
        ? rawA.localeCompare(rawB as string) 
        : (rawB as string).localeCompare(rawA);
    }

    // Number comparisons
    return sortOrder === 'asc' 
      ? (rawA as number) - (rawB as number) 
      : (rawB as number) - (rawA as number);
  });

  const getConfidenceLevelBadge = (item: ExtractedItem) => {
    const tier = getConfidenceTier(item.confidence, item.match_status);
    if (tier === 'high') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/25">
          {(item.confidence * 100).toFixed(0)}% Match
        </span>
      );
    }
    if (tier === 'review') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
          {(item.confidence * 100).toFixed(0)}% Review
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/25">
        Manual
      </span>
    );
  };

  const triggerBulkKeep = () => {
    if (selectedIds.length === 0) return;
    onBulkAction(selectedIds, 'KEEP');
    setSelectedIds([]);
  };

  const triggerBulkOmit = () => {
    if (selectedIds.length === 0) return;
    onBulkAction(selectedIds, 'REMOVE');
    setSelectedIds([]);
  };

  const triggerBulkReassign = (sec: BeoSection) => {
    if (selectedIds.length === 0) return;
    onBulkAction(selectedIds, 'REASSIGN', sec);
    setSelectedIds([]);
  };

  return (
    <div className="flex flex-col bg-surface border border-border rounded-xl shadow-sm overflow-hidden h-full" id="spreadsheet-grid-review-card">
      {/* Spreadsheet Filter Toolbar */}
      <div className="p-3 bg-bg border-b border-border flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search spreadsheet cells..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-text w-48"
          />

          {/* Tier select */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-dim font-sans font-medium"
          >
            <option value="ALL">All Confidence Tiers</option>
            <option value="HIGH">Highly Confident (≥ 80%)</option>
            <option value="REVIEW">Needs human review (&lt; 80%)</option>
            <option value="MANUAL">Manual / Catalog Missing</option>
          </select>

          {/* Section filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-dim font-sans font-medium"
          >
            <option value="ALL">All Sections</option>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Counter Summary */}
        <span className="text-[11px] text-muted font-mono bg-surface border border-border px-2 py-1 rounded">
          Filtered: <strong>{sortedItems.length}</strong> / <strong>{items.length}</strong>
        </span>
      </div>

      {/* Bulk actions Floating Bar if rows selected */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-accent-blue">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected:
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={triggerBulkKeep}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" /> Confirm Match
            </button>
            <button
              onClick={triggerBulkOmit}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs"
            >
              <X className="w-3.5 h-3.5" /> Omit Selection
            </button>
            
            <div className="h-4 w-px bg-border my-auto mx-1" />
            
            {/* Quick map to section dropdown equivalent */}
            <span className="text-[11px] text-dim font-medium hidden md:inline">Reassign Section:</span>
            {SECTIONS.map((sec) => (
              <button
                key={sec}
                onClick={() => triggerBulkReassign(sec)}
                className="px-2 py-1 bg-surface border border-border hover:bg-bg rounded text-[10px] text-dim font-bold font-sans"
              >
                {sec.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spreadsheet Main Grid Table */}
      <div className="flex-1 overflow-auto min-h-[350px]">
        <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
          <thead className="bg-bg text-[11px] text-muted uppercase tracking-wider font-sans font-bold border-b border-border sticky top-0 z-20">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded text-accent-blue focus:ring-accent-blue cursor-pointer"
                />
              </th>
              
              {/* ID Sort Header */}
              <th className="p-3 w-16 cursor-pointer hover:bg-border transition-colors group" onClick={() => handleSort('id')}>
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3 text-muted group-hover:text-dim" />
                </div>
              </th>

              {/* Match Score Sort Header */}
              <th className="p-3 w-28 cursor-pointer hover:bg-border transition-colors group" onClick={() => handleSort('confidence')}>
                <div className="flex items-center space-x-1">
                  <span>Match Status</span>
                  <ArrowUpDown className="w-3 h-3 text-muted group-hover:text-dim" />
                </div>
              </th>

              {/* Item Name Sort Header */}
              <th className="p-3 w-56 cursor-pointer hover:bg-border transition-colors group" onClick={() => handleSort('item_name')}>
                <div className="flex items-center space-x-1">
                  <span>Item Name</span>
                  <ArrowUpDown className="w-3 h-3 text-muted group-hover:text-dim" />
                </div>
              </th>

              {/* Section Sort Header */}
              <th className="p-3 w-40 cursor-pointer hover:bg-border transition-colors group" onClick={() => handleSort('beo_section')}>
                <div className="flex items-center space-x-1">
                  <span>Section Map</span>
                  <ArrowUpDown className="w-3 h-3 text-muted group-hover:text-dim" />
                </div>
              </th>

              {/* Qty Sort Header */}
              <th className="p-3 w-20 cursor-pointer hover:bg-border transition-colors group" onClick={() => handleSort('extracted_quantity')}>
                <div className="flex items-center space-x-1">
                  <span>Qty</span>
                  <ArrowUpDown className="w-3 h-3 text-muted group-hover:text-dim" />
                </div>
              </th>

              {/* Unit Price Sort Header */}
              <th className="p-3 w-24 cursor-pointer hover:bg-border transition-colors group" onClick={() => handleSort('extracted_unit_price')}>
                <div className="flex items-center space-x-1">
                  <span>Unit Price</span>
                  <ArrowUpDown className="w-3 h-3 text-muted group-hover:text-dim" />
                </div>
              </th>

              {/* Total Calculation */}
              <th className="p-3 w-24">
                <span>Row Total</span>
              </th>

              {/* Keep / Omit state button triggers */}
              <th className="p-3 w-36 text-right">
                <span>Triage Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border text-xs bg-surface">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-muted">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Layers className="w-6 h-6 text-muted" />
                    <span>No items match current filters. Try resetting search criteria.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isActive = activeItemId === item.id;
                
                // Row total
                const itemTotal = (item.extracted_quantity !== null && item.extracted_unit_price !== null)
                  ? item.extracted_quantity * item.extracted_unit_price
                  : null;

                // Color tint depending on review status
                let rowBg = isActive 
                  ? 'bg-blue-50/50 dark:bg-blue-950/20' 
                  : (item.status === 'KEPT' 
                      ? 'bg-green-500/5 dark:bg-green-950/10' 
                      : (item.status === 'REMOVED' ? 'bg-red-500/5 dark:bg-red-950/10' : ''));

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item.id)}
                    className={`hover:bg-bg group/row transition-all ${rowBg} cursor-pointer`}
                  >
                    {/* Checkbox cell */}
                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(item.id)}
                        className="rounded text-accent-blue focus:ring-accent-blue cursor-pointer"
                      />
                    </td>

                    {/* ID Cell */}
                    <td className="p-2 font-mono text-[11px] text-muted">
                      #{item.id}
                    </td>

                    {/* Confidence Chips Cell */}
                    <td className="p-2">
                      {getConfidenceLevelBadge(item)}
                    </td>

                    {/* Inline Item Name Input */}
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => handleInlineChange(item, 'item_name', e.target.value)}
                        className="w-full text-xs bg-transparent hover:bg-bg border border-transparent hover:border-border rounded px-1.5 py-1 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-text truncate"
                        title={item.snippet}
                      />
                    </td>

                    {/* Destination Section Selector Dropdown */}
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.beo_section}
                        onChange={(e) => handleInlineChange(item, 'beo_section', e.target.value)}
                        className="w-full text-xs font-sans text-dim bg-transparent hover:bg-bg border border-transparent hover:border-border rounded px-1 py-1 focus:bg-surface focus:ring-1 focus:ring-accent-blue"
                      >
                        {SECTIONS.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Inline Qty Input */}
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        value={item.extracted_quantity === null ? '' : item.extracted_quantity}
                        onChange={(e) => handleInlineChange(item, 'extracted_quantity', e.target.value)}
                        className="w-full text-xs font-mono bg-transparent hover:bg-bg border border-transparent hover:border-border rounded px-1 py-1 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-text"
                        placeholder="?"
                      />
                    </td>

                    {/* Inline Price Input */}
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-1 text-[10px] text-muted">$</span>
                        <input
                          type="number"
                          value={item.extracted_unit_price === null ? '' : item.extracted_unit_price}
                          onChange={(e) => handleInlineChange(item, 'extracted_unit_price', e.target.value)}
                          className="w-full text-xs font-mono bg-transparent hover:bg-bg border border-transparent hover:border-border rounded pl-4 pr-1 py-1 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-text"
                          placeholder="?"
                        />
                      </div>
                    </td>

                    {/* Computed Total Cell */}
                    <td className="p-2 font-mono font-bold text-dim">
                      {itemTotal !== null ? (
                        <span>${itemTotal.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted/60 text-[10px] italic">Awaiting inputs</span>
                      )}
                    </td>

                    {/* Status Triage Controls */}
                    <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {item.status === 'KEPT' ? (
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-[10px] font-bold text-green-700 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            ✓ Confirmed
                          </span>
                          <button
                            onClick={() => onRestoreItem(item.id)}
                            className="bg-surface hover:bg-bg text-dim border border-border p-1 rounded transition-all"
                            title="Undo action"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : item.status === 'REMOVED' ? (
                        <div className="flex items-center justify-end space-x-1">
                          <span className="text-[10px] font-bold text-red-700 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            Omitted
                          </span>
                          <button
                            onClick={() => onRestoreItem(item.id)}
                            className="bg-surface hover:bg-bg text-dim border border-border p-1 rounded transition-all"
                            title="Restore item"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1 px-2 border border-red-200 hover:bg-red-50 text-red-600 rounded bg-surface transition-all font-bold text-[11px]"
                            title="Omit this line item"
                          >
                            Omit
                          </button>
                          <button
                            onClick={() => onKeepItem(item.id)}
                            className="p-1 px-2.5 bg-green-600 hover:bg-green-700 text-white rounded transition-all font-bold text-[11px] shadow-sm"
                            title="Keep line item"
                          >
                            Keep
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Row details preview shown contextually */}
      {activeItemId && (
        <div className="p-3 bg-bg border-t border-border flex items-center justify-between text-[11px] text-dim">
          <div className="truncate pr-10">
            <span>📚 Selected Item Provenance: </span>
            <strong className="text-black dark:text-white">"{items.find(i=>i.id===activeItemId)?.snippet}"</strong>
          </div>
          <button 
            type="button" 
            onClick={() => onSelectItem(activeItemId)} 
            className="text-accent-blue font-bold hover:underline shrink-0 flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" /> Highlighting on PDF
          </button>
        </div>
      )}
    </div>
  );
}
