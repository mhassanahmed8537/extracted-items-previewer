import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  Trash, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  FolderSync, 
  Tag
} from 'lucide-react';
import { ExtractedItem, BeoSection } from '../types';
import { getConfidenceTier } from '../data';

interface KanbanBoardViewProps {
  items: ExtractedItem[];
  activeItemId: number | null;
  onSelectItem: (id: number) => void;
  onUpdateItem: (updated: ExtractedItem) => void;
  onKeepItem: (id: number) => void;
  onRemoveItem: (id: number) => void;
  onRestoreItem: (id: number) => void;
}

const SECTIONS: BeoSection[] = ['Food & Beverage', 'Audio Visual', 'Room Setup', 'Other'];

export default function KanbanBoardView({
  items,
  activeItemId,
  onSelectItem,
  onUpdateItem,
  onKeepItem,
  onRemoveItem,
  onRestoreItem,
}: KanbanBoardViewProps) {

  // Shift section to the left or right in the array index
  const shiftSection = (item: ExtractedItem, dir: 'left' | 'right') => {
    const currIdx = SECTIONS.indexOf(item.beo_section);
    let nextIdx = currIdx;
    if (dir === 'left') {
      nextIdx = currIdx > 0 ? currIdx - 1 : SECTIONS.length - 1;
    } else {
      nextIdx = currIdx < SECTIONS.length - 1 ? currIdx + 1 : 0;
    }
    const updated = {
      ...item,
      beo_section: SECTIONS[nextIdx],
      user_edited: true
    };
    onUpdateItem(updated);
  };

  const getConfidenceLevelPill = (item: ExtractedItem) => {
    const tier = getConfidenceTier(item.confidence, item.match_status);
    if (tier === 'high') {
      return (
        <span className="text-[9px] font-mono bg-green-500/10 text-green-700 dark:text-green-400 font-bold px-1.5 py-0.5 rounded border border-green-500/20">
          ★ CONFIDENT
        </span>
      );
    }
    if (tier === 'review') {
      return (
        <span className="text-[9px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
          ⚠ REVIEW
        </span>
      );
    }
    return (
      <span className="text-[9px] font-mono bg-slate-500/10 text-slate-700 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded border border-slate-500/20">
        MANUAL
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full" id="kanban-kanban-board-container">
      {SECTIONS.map((sec) => {
        const sectionItems = items.filter((item) => item.beo_section === sec);
        
        return (
          <div 
            key={sec} 
            className="flex flex-col bg-bg border border-border rounded-xl min-h-[450px] overflow-hidden"
          >
            {/* Column Header */}
            <div className="p-3 bg-surface border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-accent-blue" />
                <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-dim">
                  {sec}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-bg border border-border px-1.5 py-0.5 rounded text-dim">
                {sectionItems.length}
              </span>
            </div>

            {/* List area */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3 max-h-[550px]">
              {sectionItems.length === 0 ? (
                <div className="py-12 text-center text-muted flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-border/80 rounded-lg bg-surface/30">
                  <FolderSync className="w-5 h-5 text-muted/50" />
                  <span className="text-[11px] font-medium">None for {sec.split(' ')[0]}</span>
                </div>
              ) : (
                sectionItems.map((item) => {
                  const isActive = activeItemId === item.id;
                  const itemTier = getConfidenceTier(item.confidence, item.match_status);
                  
                  // Active class and styles
                  const outlineClass = isActive 
                    ? 'ring-2 ring-accent-blue scale-[1.01] shadow-md bg-surface z-10 border-accent-blue' 
                    : 'bg-surface hover:border-muted/80 shadow-xs border-border';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item.id)}
                      className={`p-3.5 rounded-lg border text-left transition-all duration-150 cursor-pointer relative group flex flex-col justify-between ${outlineClass}`}
                    >
                      {/* Top Row with ID & confidence tier badge */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-mono font-bold text-muted">
                          #{item.id}
                        </span>
                        {getConfidenceLevelPill(item)}
                      </div>

                      {/* Content Name and Subtext snippet */}
                      <h4 className="text-xs font-bold text-dim mb-1 group-hover:text-text truncate line-clamp-2 white-space-normal">
                        {item.item_name}
                      </h4>
                      
                      <div className="text-[10px] text-muted italic font-mono bg-bg/60 p-1.5 rounded border border-border/60 mb-2 truncate" title={item.snippet}>
                        "{item.snippet}"
                      </div>

                      {/* Item Pricing calculation */}
                      <div className="flex items-center justify-between text-[11px] font-mono mb-2 bg-bg px-2 py-1 rounded">
                        <span className="text-muted text-[10px]">
                          {item.extracted_quantity !== null ? `${item.extracted_quantity}x` : '—'} @ {item.extracted_unit_price !== null ? `$${item.extracted_unit_price}` : '—'}
                        </span>
                        <strong className="text-accent-blue font-bold">
                          {item.extracted_quantity !== null && item.extracted_unit_price !== null 
                            ? `$${(item.extracted_quantity * item.extracted_unit_price).toLocaleString()}`
                            : '$—'
                          }
                        </strong>
                      </div>

                      {/* Actions & Section Swap Arrow Controllers */}
                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-border mt-1">
                        {/* Shifter directional buttons */}
                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => shiftSection(item, 'left')}
                            className="p-1 hover:bg-bg border border-border rounded text-muted hover:text-dim transition-all"
                            title="Shift to left category"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <span className="text-[9px] font-bold text-muted uppercase tracking-wider font-mono px-1">
                            MOVE
                          </span>
                          <button
                            onClick={() => shiftSection(item, 'right')}
                            className="p-1 hover:bg-bg border border-border rounded text-muted hover:text-dim transition-all"
                            title="Shift to right category"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Status Keep/Omit switcher buttons */}
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          {item.status === 'KEPT' ? (
                            <button
                              onClick={() => onRestoreItem(item.id)}
                              className="px-2 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/25 rounded text-[9px] font-bold flex items-center gap-0.5"
                              title="Undo Confirmation"
                            >
                              <Check className="w-3 h-3" /> Kept
                            </button>
                          ) : item.status === 'REMOVED' ? (
                            <button
                              onClick={() => onRestoreItem(item.id)}
                              className="px-2 py-0.5 bg-red-400/10 text-red-600 dark:text-red-400 border border-red-500/25 rounded text-[9px] font-bold flex items-center gap-0.5"
                              title="Restore Item"
                            >
                              <X className="w-3 h-3" /> Omitted
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onRemoveItem(item.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-all font-bold text-[9px] uppercase font-mono"
                                title="Omit Item"
                              >
                                Omit
                              </button>
                              <button
                                onClick={() => onKeepItem(item.id)}
                                className="p-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all font-bold text-[9px] uppercase font-mono px-2"
                                title="Keep Item"
                              >
                                Keep
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
