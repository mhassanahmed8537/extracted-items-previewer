import React from 'react';
import { FileText, Radio, HelpCircle, Eye, CornerDownRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { ExtractedItem, EventInfo } from '../types';
import { getConfidenceTier } from '../data';

interface SourcePreviewProps {
  sourceText: string;
  items: ExtractedItem[];
  activeItemId: number | null;
  activeEvent: EventInfo | null;
  onSelectItem: (id: number) => void;
}

export default function SourcePreview({
  sourceText,
  items,
  activeItemId,
  activeEvent,
  onSelectItem,
}: SourcePreviewProps) {
  const [activeTab, setActiveTab] = React.useState<'annotated' | 'raw'>('annotated');

  // Let's parse or reconstruct paragraphs of text and replace known snippets with highlighted segments
  const renderInteractiveText = () => {
    const lines = sourceText.split('\n');
    return (
      <div className="space-y-3 font-mono text-xs leading-relaxed max-h-[580px] overflow-y-auto pr-2">
        {lines.map((line, idx) => {
          // Check if this line matches any item's snippet completely or partially
          const matchingItem = items.find(
            (item) => line.trim().toLowerCase().includes(item.snippet.trim().toLowerCase()) || 
                      item.snippet.trim().toLowerCase().includes(line.trim().toLowerCase())
          );

          if (matchingItem && line.trim().length > 3) {
            const isCurrentlyActive = activeItemId === matchingItem.id;
            const tier = getConfidenceTier(matchingItem.confidence, matchingItem.match_status);
            
            let badgeBg = "bg-green-100 dark:bg-green-950/40 hover:bg-green-200 dark:hover:bg-green-900/40 border-green-300 dark:border-green-800";
            let txtColor = "text-green-800 dark:text-green-300";
            let indicatorColor = "bg-green-500";
            
            if (tier === 'review') {
              badgeBg = "bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/40 border-amber-300 dark:border-amber-800";
              txtColor = "text-amber-800 dark:text-amber-300";
              indicatorColor = "bg-amber-500";
            } else if (tier === 'manual') {
              badgeBg = "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600";
              txtColor = "text-gray-800 dark:text-gray-300";
              indicatorColor = "bg-gray-500";
            }

            // Let's highlight if user selected
            const activeClass = isCurrentlyActive 
              ? 'ring-2 ring-primary-blue ring-offset-2 ring-offset-surface scale-[1.01] shadow-md border-l-4 border-l-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 z-10' 
              : `border-l-2 ${badgeBg} ${txtColor}`;

            return (
              <div 
                key={idx}
                id={`snippet-line-${matchingItem.id}`}
                onClick={() => onSelectItem(matchingItem.id)}
                className={`p-3 rounded-md border transition-all duration-200 cursor-pointer relative group flex items-start space-x-2 ${activeClass}`}
              >
                <div className="flex flex-col items-center pt-0.5">
                  <span className={`w-2 h-2 rounded-full ${indicatorColor}`} />
                  <span className="text-[9px] font-bold text-muted mt-1 uppercase">
                    {matchingItem.beo_section.slice(0, 3)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-mono">{line}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-muted flex items-center gap-1 font-sans">
                      <CornerDownRight className="w-3 h-3" />
                      Extracted item: <strong className="text-dim">{matchingItem.item_name}</strong>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/60 dark:bg-black/30">
                      AI Con: {(matchingItem.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                {matchingItem.status === 'KEPT' && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 self-center shrink-0" />
                )}
                {matchingItem.status === 'REMOVED' && (
                  <span className="text-[9px] font-bold text-red-500 border border-red-300 px-1 rounded uppercase self-center shrink-0">
                    Omit
                  </span>
                )}
              </div>
            );
          }

          // Headers or sections
          const isHeader = line.startsWith('—') || line.startsWith('Client:') || line.startsWith('Date:') || line.toUpperCase() === line && line.trim().length > 0;
          return (
            <p 
              key={idx} 
              className={`py-1 px-2 font-mono ${isHeader ? 'text-blue-900 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/20 border-b border-dashed border-border py-2 my-2' : 'text-muted'}`}
            >
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl shadow-sm overflow-hidden" id="source-preview-card">
      {/* Container Header */}
      <div className="px-4 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-accent-blue" />
          <h2 className="text-xs font-bold font-sans tracking-wide uppercase text-dim">
            Source Document Preview
          </h2>
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" /> OCR Auto-Linked
          </span>
        </div>
        
        {/* Toggle between Annotated/Text and Raw */}
        <div className="flex items-center bg-bg p-0.5 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('annotated')}
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
              activeTab === 'annotated'
                ? 'bg-surface shadow text-accent-blue'
                : 'text-muted hover:text-dim'
            }`}
            title="Show extracted highlights map"
          >
            Annotated Map
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
              activeTab === 'raw'
                ? 'bg-surface shadow text-accent-blue'
                : 'text-muted hover:text-dim'
            }`}
            title="Show natural plain text draft"
          >
            Raw Draft
          </button>
        </div>
      </div>

      {/* Tabs panels */}
      <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden bg-surface">
        {activeTab === 'annotated' ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="mb-3 p-2.5 bg-blue-50/55 dark:bg-blue-900/10 text-[11px] text-dim rounded-lg border border-blue-100 dark:border-blue-950/40 flex items-start gap-2">
              <Eye className="w-4 h-4 text-accent-blue mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                <strong>Click any highlighted block</strong> on this document preview to inspect, edit, or categorize its mapped value in the Review workspace.
              </p>
            </div>
            
            {renderInteractiveText()}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="mb-2.5 flex items-center justify-between text-[11px] text-muted">
              <span>BEO Draft File Version v1.02</span>
              <span>Enc: UTF-8 PlainText</span>
            </div>
            <pre className="p-4 bg-bg rounded-lg border border-border text-[11px] text-muted font-mono leading-relaxed overflow-auto pr-2 max-h-[580px] flex-1">
              {sourceText}
            </pre>
          </div>
        )}

        {/* Footer Provenance Info */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            <span>Active Section Focus: <strong className="text-dim">{activeEvent ? activeEvent.name : 'All Events'}</strong></span>
          </div>
          <span className="font-mono text-[10px] uppercase">
            Confidence Guided Triage
          </span>
        </div>
      </div>
    </div>
  );
}
