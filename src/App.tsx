import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  HelpCircle, 
  Sparkles, 
  Check, 
  X, 
  Search, 
  Maximize2, 
  Columns, 
  Tag, 
  Utensils, 
  Monitor, 
  Layout, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  RotateCcw, 
  Trash2, 
  DollarSign, 
  CheckCircle2, 
  FolderSync, 
  Hash, 
  MessageSquare,
  Sparkle,
  Undo,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Maximize,
  ClipboardCheck,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

import { ExtractedItem, BeoSection, EventInfo } from './types';
import { INITIAL_LEADERSHIP_SUMMIT_DATA, getConfidenceTier } from './data';

export default function App() {
  const presetData = INITIAL_LEADERSHIP_SUMMIT_DATA;

  // Persistence local storage key
  const storageKey = 'beo_review_items';

  // Core items state
  const [items, setItems] = useState<ExtractedItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return presetData.items;
  });

  // Source layout mode: Excel, PDF, or Plain Text
  const [sourceMode, setSourceMode] = useState<'EXCEL' | 'PDF' | 'TEXT'>('EXCEL');

  // Currently selected event (1-indexed matching the screenshot "Event 1 / 10")
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const activeEvent = presetData.events[activeEventIndex] || presetData.events[0];

  // Currently focused item in Column 3 or Source Row
  const [activeItemId, setActiveItemId] = useState<number | null>(() => {
    return presetData.items[0]?.id || null;
  });

  // Search event queries
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Dark/Light State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('beo_dark_mode') === 'true';
  });

  // Workspace Accordion states
  const [accordions, setAccordions] = useState<Record<string, boolean>>({
    'Audio Visual': true,
    'Food & Beverage': true,
    'Room Setup': true,
    'Other': true,
  });

  // Excel Row Hover state to bind OCR to items
  const [hoveredSourceId, setHoveredSourceId] = useState<number | null>(null);

  // Keyboard shortcut overlay state
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Succesful submission toast overlay
  const [successToast, setSuccessToast] = useState(false);

  // Reset confirmation modal overlay
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Undo snackbar status
  const [lastAction, setLastAction] = useState<{ id: number; status: 'PENDING' | 'KEPT' | 'REMOVED'; field?: string; prevVal?: any } | null>(null);

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  // Sync Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('beo_dark_mode', String(darkMode));
  }, [darkMode]);

  // Listen to global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disregard keyboard triggers if currently focused in an input box
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') {
        return;
      }

      const activeItem = items.find(i => i.id === activeItemId);
      if (!activeItem) return;

      if (e.key === 'a' || e.key === 'A') {
        // KEEP shortcut
        e.preventDefault();
        handleKeep(activeItem.id);
      } else if (e.key === 'r' || e.key === 'R') {
        // REMOVE shortcut
        e.preventDefault();
        handleRemove(activeItem.id);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Move active focus down
        const eventItems = items.filter(i => i.event_id === activeEvent.id);
        const idx = eventItems.findIndex(i => i.id === activeItemId);
        if (idx !== -1 && idx < eventItems.length - 1) {
          setActiveItemId(eventItems[idx + 1].id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Move active focus up
        const eventItems = items.filter(i => i.event_id === activeEvent.id);
        const idx = eventItems.findIndex(i => i.id === activeItemId);
        if (idx > 0) {
          setActiveItemId(eventItems[idx - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, activeItemId, activeEventIndex]);



  // Keep single item action
  const handleKeep = (id: number) => {
    const original = items.find(i => i.id === id);
    if (!original) return;
    setLastAction({ id, status: original.status });
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'KEPT' } : item));
  };

  // Remove single item action
  const handleRemove = (id: number) => {
    const original = items.find(i => i.id === id);
    if (!original) return;
    setLastAction({ id, status: original.status });
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'REMOVED' } : item));
  };

  // Restore line item to pending
  const handleRestore = (id: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'PENDING' } : item));
  };

  // Undo triggers
  const handleUndo = () => {
    if (!lastAction) return;
    setItems(prev => prev.map(item => item.id === lastAction.id ? { ...item, status: lastAction.status } : item));
    setActiveItemId(lastAction.id);
    setLastAction(null);
  };

  // Batch bulk confirm highly-confident matches (≥ 0.8)
  const handleBulkConfirmMatches = () => {
    const targetItems = items.filter(i => 
      i.event_id === activeEvent.id && 
      i.status === 'PENDING' && 
      getConfidenceTier(i.confidence, i.match_status) === 'high'
    );
    if (targetItems.length === 0) return;

    setItems(prev => prev.map(item => {
      const isMatch = targetItems.some(t => t.id === item.id);
      return isMatch ? { ...item, status: 'KEPT' } : item;
    }));
  };

  // Bulk Keep all items in a single category
  const handleCategoryKeepAll = (section: BeoSection) => {
    setItems(prev => prev.map(item => {
      if (item.event_id === activeEvent.id && item.beo_section === section && item.status === 'PENDING') {
        return { ...item, status: 'KEPT' };
      }
      return item;
    }));
  };

  // Footer bulk quick buttons
  const handleKeepAllRemaining = () => {
    setItems(prev => prev.map(item => {
      if (item.event_id === activeEvent.id && item.status === 'PENDING') {
        return { ...item, status: 'KEPT' };
      }
      return item;
    }));
  };

  const handleOmitAllRemaining = () => {
    setItems(prev => prev.map(item => {
      if (item.event_id === activeEvent.id && item.status === 'PENDING') {
        return { ...item, status: 'REMOVED' };
      }
      return item;
    }));
  };

  // Reset entire preset to starting mock data
  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const performReset = () => {
    localStorage.removeItem(storageKey);
    setItems(presetData.items);
    setActiveItemId(presetData.items[0]?.id || null);
    setLastAction(null);
    setShowResetConfirm(false);
  };

  // Manual inline edits inside input fields of the card
  const handleFieldChange = (itemId: number, field: 'extracted_quantity' | 'extracted_unit_price' | 'item_name', value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          [field]: value === '' ? null : (field === 'item_name' ? value : Number(value)),
          user_edited: true
        };
      }
      return item;
    }));
  };

  // Category change reassignment trigger (Column 2 links)
  const handleReassignSection = (itemId: number, newSection: BeoSection) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          beo_section: newSection,
          user_edited: true
        };
      }
      return item;
    }));
  };

  // Toggle category section accordion
  const toggleAccordion = (sec: string) => {
    setAccordions(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toggleAllAccordions = (expand: boolean) => {
    setAccordions({
      'Audio Visual': expand,
      'Food & Beverage': expand,
      'Room Setup': expand,
      'Other': expand,
    });
  };

  // Derived state analytics for active selected event
  const currentEventItems = items.filter(i => i.event_id === activeEvent.id);
  const eventReviewedCount = currentEventItems.filter(i => i.status !== 'PENDING').length;
  const eventTotalCount = currentEventItems.length;

  const eventHighConfidenceUnreviewed = currentEventItems.filter(i => 
    i.status === 'PENDING' && getConfidenceTier(i.confidence, i.match_status) === 'high'
  );

  const eventNeedsReviewCount = currentEventItems.filter(i => 
    getConfidenceTier(i.confidence, i.match_status) === 'review'
  ).length;

  const eventManualCount = currentEventItems.filter(i => 
    getConfidenceTier(i.confidence, i.match_status) === 'manual'
  ).length;

  // Global calculations for current active event
  const activeEventKeptCount = currentEventItems.filter(i => i.status === 'KEPT').length;

  // Filter events list based on Search events input box
  const filteredEventsList = presetData.events.filter(e => 
    e.name.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f0f2f6] dark:bg-[#12141a] text-[#1a1f2e] dark:text-[#e8eaef] font-sans antialiased flex flex-col pb-16 transition-all duration-200">
      
      {/* 1. PROFESSIONAL PLATFORM HEADER */}
      <header className="w-full bg-white dark:bg-[#1a1d24] border-b border-[#d8dde8]/70 dark:border-[#282f3a] px-6 h-14 flex items-center justify-between shadow-xs transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-[#2563eb] dark:text-[#4a9eff]" />
          <span className="font-sans font-extrabold tracking-tight text-sm text-[#1a1f2e] dark:text-white uppercase">
            BEO Platform
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-xs text-[#7a8498] dark:text-[#8891a5] font-semibold"> Banquet Event Operations</span>
        </div>

        {/* Header Right Workspace Controls */}
        <div className="flex items-center space-x-4">
          {/* High-Contrast Theme Switcher */}
          <div className="bg-slate-100 dark:bg-black/20 p-1 rounded-lg flex items-center space-x-0.5 border border-slate-200/60 dark:border-slate-800/60">
            <button
              onClick={() => setDarkMode(false)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!darkMode ? 'bg-white dark:bg-[#1a1d24] text-[#2563eb] shadow-2xs font-extrabold' : 'text-[#7a8498] hover:text-white'}`}
            >
              Light
            </button>
            <button
              onClick={() => setDarkMode(true)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${darkMode ? 'bg-white dark:bg-[#1a1d24] text-[#4a9eff] shadow-2xs font-extrabold' : 'text-[#7a8498] hover:text-[#1a1f2e]'}`}
            >
              Dark
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>

          {/* Reset Template Default Data Button */}
          <button 
            onClick={handleResetData}
            title="Reset OCR simulator metrics"
            className="p-1 px-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg border border-[#d8dde8] dark:border-[#282f3a] text-muted text-xs flex items-center gap-1 font-semibold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#4a9eff]" /> 
            <span>Reset</span>
          </button>
        </div>
      </header>

      <div className="max-w-[1550px] mx-auto w-full px-5 pt-4 flex-1 flex flex-col space-y-4">
        
        {/* 2. TITLE BAR */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
          <div className="flex items-baseline space-x-3.5">
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#1a1f2e] dark:text-white">
              Review extracted items
            </h2>
            <p className="text-xs text-[#7a8498] dark:text-[#8891a5]">
              Keep what's correct, remove what isn't, and commit your changes.
            </p>
          </div>
        </div>

        {/* 3. CONFIDENCE TRIAGE NOTIFICATION BAR (Matching mock exact color layout) */}
        <section className="bg-amber-500/5 dark:bg-amber-500/10 border-l-4 border-[#b45309] dark:border-[#e5a84a] rounded-xl p-4 flex flex-col xl:flex-row items-center justify-between gap-5 shadow-xs">
          <div className="flex items-start space-x-3.5 w-full xl:w-auto">
            <div className="p-2 bg-[#b45309]/10 text-[#b45309] dark:text-[#e5a84a] rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1a1f2e] dark:text-white flex items-center gap-2">
                AI matched {items.filter(i => getConfidenceTier(i.confidence, i.match_status) === 'high').length} items with high confidence.
              </h3>
              <p className="text-xs text-[#4a5568] dark:text-[#8891a5] mt-0.5 leading-relaxed">
                {eventHighConfidenceUnreviewed.length} match{eventHighConfidenceUnreviewed.length === 1 ? 'es' : 'es'} in the current session need closer inspection — the rest can be verified in a single step.
              </p>
            </div>
          </div>

          {/* Central progress slider bar matching mockup precisely */}
          <div className="flex items-center space-x-4 w-full xl:w-[45%] shrink-0">
            <span className="text-[11px] text-[#7a8498] dark:text-[#8891a5] font-medium whitespace-nowrap min-w-[100px]">
              {eventReviewedCount} of {eventTotalCount} reviewed
            </span>
            <div className="relative w-full h-1.5 bg-[#d8dde8] dark:bg-[#282f3a] rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 bg-[#2563eb] dark:bg-[#4a9eff] h-full rounded-full transition-all duration-300"
                style={{ width: `${(eventReviewedCount / (eventTotalCount || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Badges and big blue primary action button "Confirm matches" */}
          <div className="flex items-center justify-end space-x-3.5 w-full xl:w-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#dim] dark:text-dim bg-white dark:bg-[#1a1d24] border border-[#d8dde8] dark:border-[#282f3a] px-2.5 py-1.5 rounded-lg text-[11px] font-medium shadow-2xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b45309] dark:bg-[#e5a84a]" />
              {eventNeedsReviewCount} to review
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#dim] dark:text-dim bg-white dark:bg-[#1a1d24] border border-[#d8dde8] dark:border-[#282f3a] px-2.5 py-1.5 rounded-lg text-[11px] font-medium shadow-2xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-[#505868] dark:bg-[#505868]" />
              {eventManualCount} manual
            </span>

            <button
              onClick={handleBulkConfirmMatches}
              disabled={eventHighConfidenceUnreviewed.length === 0}
              className={`px-5 py-2.5 text-xs font-bold font-sans rounded-lg shadow transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                eventHighConfidenceUnreviewed.length > 0
                  ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white'
                  : 'bg-[#d8dde8] dark:bg-[#282f3a] text-[#7a8498] dark:text-[#505868] cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirm {eventHighConfidenceUnreviewed.length} matches</span>
            </button>
          </div>
        </section>

        {/* 4. HORIZONTAL EVENTS TAB NAVIGATION LIST */}
        <section className="bg-white dark:bg-[#1a1d24] border border-[#d8dde8]/70 dark:border-[#282f3a] rounded-xl p-3 flex flex-col md:flex-row items-center gap-4 shadow-sm">
          
          {/* Tracker pagination indicator + Arrow selectors */}
          <div className="flex items-center space-x-2 shrink-0 border-r border-[#d8dde8]/70 dark:border-[#282f3a] pr-4">
            <span className="text-xs font-bold text-dim font-mono tracking-wide">
              Event <strong className="text-black dark:text-white">{activeEventIndex + 1}</strong> / {presetData.events.length}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveEventIndex(prev => prev > 0 ? prev - 1 : presetData.events.length - 1)}
                className="p-1 px-1.5 rounded border border-[#d8dde8] dark:border-[#282f3a] bg-bg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-dim"
                title="Previous event card"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveEventIndex(prev => (prev + 1) % presetData.events.length)}
                className="p-1 px-1.5 rounded border border-[#d8dde8] dark:border-[#282f3a] bg-bg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-dim"
                title="Next event card"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Find events search box */}
          <div className="relative w-full md:w-56 shrink-0">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search events..."
              value={eventSearchQuery}
              onChange={(e) => setEventSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#f0f2f6] dark:bg-[#12141a] text-xs border border-[#d8dde8] dark:border-[#282f3a] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] placeholder-muted"
            />
          </div>

          {/* Scrolling card lists containing BEO events */}
          <div className="flex-1 flex gap-2 items-center overflow-x-auto pb-1 md:pb-0 scroll-smooth max-w-full">
            {filteredEventsList.map((evt, idx) => {
              const fullIndex = presetData.events.findIndex(e => e.id === evt.id);
              const isSelected = fullIndex === activeEventIndex;
              const hasUnreviewed = items.some(i => i.event_id === evt.id && i.status === 'PENDING');
              
              return (
                <button
                  key={evt.id}
                  onClick={() => {
                    setActiveEventIndex(fullIndex);
                    const associated = items.filter(i => i.event_id === evt.id);
                    if (associated.length > 0) setActiveItemId(associated[0].id);
                  }}
                  className={`px-4 py-2 text-left rounded-lg transition-all border duration-150 relative shrink-0 ${
                    isSelected
                      ? 'border-[#2563eb] bg-blue-50/75 dark:bg-[#2563eb]/10 text-[#2563eb] dark:text-[#4a9eff] shadow-2xs font-bold ring-2 ring-[#2563eb]/10'
                      : 'border-[#d8dde8]/75 dark:border-[#282f3a] bg-bg/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-dim text-xs font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {/* Circle Dot identifier mapping the mockup active event */}
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#2563eb] dark:bg-[#4a9eff]' : 'bg-[#7a8498]'}`} />
                    <div className="min-w-0">
                      <div className="text-[11px] line-clamp-1 max-w-[170px] truncate leading-tight font-sans">
                        {evt.name}
                      </div>
                      <div className="text-[9px] font-mono mt-0.5 text-[#7a8498] dark:text-[#8891a5] flex justify-between items-center pr-1">
                        <span>Jul 15</span>
                        {hasUnreviewed && (
                          <span className="w-1 h-1 rounded-full bg-amber-500 ml-2" title="Unreviewed items inside" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </section>

        {/* 6. PRIMARY WORKSPACE SPLIT (THREE COLUMNS EXACT MATCH) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* ================ PANEL 1: SOURCE DOCUMENT (SPANS 4) ================ */}
          <div className="lg:col-span-4 flex flex-col bg-white dark:bg-[#1a1d24] border border-[#d8dde8] dark:border-[#282f3a] rounded-xl shadow-xs overflow-hidden h-full min-h-[550px]">
            {/* Header section with formats switches and fullscreens */}
            <div className="px-4 py-3 bg-[#f0f2f6] dark:bg-[#12141a]/50 border-b border-[#d8dde8]/80 dark:border-[#282f3a] flex items-center justify-between animate-fade-in">
              <span className="text-[11px] font-mono tracking-wider font-bold text-dim uppercase">
                SOURCE DOCUMENT
              </span>
              <div className="flex items-center space-x-2">
                <span className="p-1 px-2.5 bg-[#2563eb]/10 text-[#2563eb] text-[10px] font-mono font-bold rounded">
                  {sourceMode} Format
                </span>
                <button 
                  onClick={() => setSourceMode(prev => prev === 'EXCEL' ? 'PDF' : prev === 'PDF' ? 'TEXT' : 'EXCEL')} 
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[#7a8498]" 
                  title="Cycle view medium"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document body formats renderers */}
            <div className="p-4 flex-1 overflow-auto bg-white dark:bg-[#1a1d24] select-text">
              {sourceMode === 'EXCEL' ? (
                <div className="space-y-4">
                  {/* Excel Sheet Simulator table */}
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                    <table className="w-full text-left border-collapse font-mono text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 uppercase tracking-tight text-[10px] border-b border-slate-200 dark:border-slate-800">
                          <th className="p-2 w-28">Section</th>
                          <th className="p-2">Item Name</th>
                          <th className="p-2 w-12 text-center">Qty</th>
                          <th className="p-2 w-16 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentEventItems.map((item) => {
                          const isActive = activeItemId === item.id;
                          const isHovered = hoveredSourceId === item.id;
                          
                          let cellBg = "";
                          if (isActive) cellBg = "bg-blue-500/10 text-blue-900 dark:text-blue-200 font-bold border-l-2 border-l-[#2563eb]";
                          else if (isHovered) cellBg = "bg-slate-100 dark:bg-slate-800/50";

                          return (
                            <tr
                              key={item.id}
                              onMouseEnter={() => setHoveredSourceId(item.id)}
                              onMouseLeave={() => setHoveredSourceId(null)}
                              onClick={() => {
                                setActiveItemId(item.id);
                                // Open accordion if closed
                                setAccordions(prev => ({ ...prev, [item.beo_section]: true }));
                              }}
                              className={`cursor-pointer transition-all duration-100 ${cellBg} hover:bg-slate-50 dark:hover:bg-slate-800/30`}
                            >
                              <td className="p-2 truncate max-w-[100px] text-slate-500" title={item.beo_section}>
                                {item.beo_section}
                              </td>
                              <td className="p-2 truncate font-sans font-medium text-dim max-w-[140px]" title={item.item_name}>
                                {item.item_name}
                              </td>
                              <td className="p-2 text-center text-dim">
                                {item.extracted_quantity ?? '—'}
                              </td>
                              <td className="p-2 text-right text-dim font-bold">
                                {item.extracted_unit_price ? `$${item.extracted_unit_price}` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Header text info replica showing Highgate BEO Client header exactly */}
                  <div className="bg-bg dark:bg-[#12141a]/40 p-4 rounded-lg space-y-2 mt-4 text-[11px] border border-[#d8dde8]/60 dark:border-slate-800 font-mono">
                    <div className="flex justify-between border-b pb-1 border-dashed">
                      <span className="text-muted">CLIENT:</span>
                      <span className="font-bold text-dim">Northwind Annual Summit</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 border-dashed">
                      <span className="text-muted">DATE:</span>
                      <span className="font-bold text-dim">2026-07-15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">FUNCTION ROOM:</span>
                      <span className="font-bold text-dim">Grand Ballroom A</span>
                    </div>
                  </div>
                </div>
              ) : sourceMode === 'PDF' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 rounded-lg text-[11px] text-[#dc2626] dark:text-[#f87171] leading-relaxed flex items-center gap-1.5 font-mono">
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>Viewing original Banquet Event Order PDF facsimile. Highlight lines represent extracted segments.</span>
                  </div>

                  <div className="bg-[#f0f2f6] dark:bg-[#12141a]/60 p-5 rounded-lg border border-slate-300 dark:border-slate-800 text-xs text-[#1a1f2e] dark:text-[#8891a5] font-mono leading-relaxed space-y-3 min-h-[350px]">
                    <div className="border-b pb-3 border-dashed border-[#d8dde8] dark:border-slate-800 text-center">
                      <h4 className="font-bold uppercase tracking-wide text-dim">HIGHGATE HOTEL BANQUET AGREEMENT</h4>
                      <p className="text-[10px] text-muted">909 Las Olas Blvd, Fort Lauderdale, FL</p>
                    </div>

                    <div className="space-y-2">
                      <p><strong>BEO Group Number:</strong> #92019A</p>
                      <p><strong>Primary Contact:</strong> Alice Vance, Operations Dir</p>
                      
                      <div className="my-4 border border-dashed border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-[#1a1d24] rounded">
                        <p className="font-bold text-dim mb-1">Extracted Line Provenance:</p>
                        {currentEventItems.map(item => {
                          const isActive = item.id === activeItemId;
                          return (
                            <div 
                              key={item.id}
                              onClick={() => {
                                setActiveItemId(item.id);
                                setAccordions(prev => ({ ...prev, [item.beo_section]: true }));
                              }}
                              className={`p-1 rounded cursor-pointer text-[10px] my-1 transition-all ${
                                isActive 
                                  ? 'bg-[#2563eb]/15 border-l-2 border-l-[#2563eb] text-[#2563eb] font-bold' 
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              ✓ {item.snippet}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted mb-1 font-mono">
                    <span>Parsed UTF-8 raw agenda.txt</span>
                    <span>912 characters read</span>
                  </div>
                  <pre className="p-4 bg-slate-50 dark:bg-black/30 rounded-xl leading-relaxed text-[11px] text-dim font-mono overflow-auto max-h-[440px] border border-[#d8dde8]/60 dark:border-slate-800">
                    {presetData.sourceText}
                  </pre>
                </div>
              )}
            </div>

            {/* Document totals summary footer matching mockup style */}
            <div className="p-3 bg-[#f0f2f6] dark:bg-[#12141a]/50 text-[11px] font-mono border-t border-[#d8dde8]/80 dark:border-[#282f3a] text-muted flex justify-between items-center">
              <span>ACTIVE PRESET SUM</span>
              <strong className="text-dim">${
                currentEventItems.reduce((curr, i) => curr + ((i.extracted_quantity ?? 0) * (i.extracted_unit_price ?? 0)), 0).toLocaleString()
              } USD</strong>
            </div>
          </div>


          {/* ================ PANEL 2: SECTIONS (SPANS 3) ================ */}
          <div className="lg:col-span-3 flex flex-col bg-white dark:bg-[#1a1d24] border border-[#d8dde8] dark:border-[#282f3a] rounded-xl shadow-xs overflow-hidden h-full">
            <div className="px-4 py-3 bg-[#f0f2f6] dark:bg-[#12141a]/50 border-b border-[#d8dde8]/80 dark:border-[#282f3a] flex items-center justify-between animate-fade-in">
              <span className="text-[11px] font-mono tracking-wider font-bold text-dim uppercase">
                SECTIONS
              </span>
              <Columns className="w-3.5 h-3.5 text-[#7a8498]" />
            </div>

            <div className="p-4 flex-1 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#1a1f2e] dark:text-white leading-tight font-sans">
                  {activeEvent.name}
                </h4>
                <div className="text-[10px] text-muted font-mono uppercase tracking-wide">
                  Date: {activeEvent.date}
                </div>
              </div>

              {/* Bucket mapping items listing */}
              <div className="space-y-2.5 pt-1" id="section-category-targets">
                {([
                  { name: 'Audio Visual', icon: <Monitor className="w-4 h-4" />, count: currentEventItems.filter(i=>i.beo_section==='Audio Visual').length },
                  { name: 'Food & Beverage', icon: <Utensils className="w-4 h-4" />, count: currentEventItems.filter(i=>i.beo_section==='Food & Beverage').length },
                  { name: 'Other', icon: <Plus className="w-4 h-4" />, count: currentEventItems.filter(i=>i.beo_section==='Other').length },
                  { name: 'Room Setup', icon: <Layout className="w-4 h-4" />, count: currentEventItems.filter(i=>i.beo_section==='Room Setup').length }
                ] as const).map((sec) => {
                  
                  // Highlight section if active focused item belongs to it
                  const focusedItem = items.find(i => i.id === activeItemId);
                  const isMapped = focusedItem ? focusedItem.beo_section === sec.name : false;
                  
                  return (
                    <button
                      key={sec.name}
                      onClick={() => {
                        if (activeItemId !== null) {
                          handleReassignSection(activeItemId, sec.name);
                        }
                      }}
                      className={`w-full text-left p-3 border rounded-lg transition-all flex items-center space-x-3.5 group cursor-pointer ${
                        isMapped 
                          ? 'border-[#2563eb] bg-[#2563eb]/5 shadow-2xs font-medium dark:bg-[#2563eb]/10 animate-fade-in' 
                          : 'border-[#d8dde8] hover:border-[#7a8498] bg-white dark:bg-[#1a1d24]/40 hover:bg-[#cbd5e1]/10 dark:hover:bg-[#1e222b]'
                      }`}
                    >
                      {/* Icon with colored backdrops */}
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isMapped 
                          ? 'bg-[#2563eb] text-white' 
                          : 'bg-[#f0f2f6] dark:bg-slate-800 text-[#7a8498] group-hover:bg-[#cbd5e1]/40'
                      }`}>
                        {sec.icon}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <strong className={`font-bold uppercase tracking-tight text-[11px] ${isMapped ? 'text-[#2563eb] dark:text-[#4a9eff]' : 'text-dim'}`}>
                            {sec.name}
                          </strong>
                          <span className="font-mono text-[10px] bg-[#f0f2f6] dark:bg-slate-800 px-1.5 py-0.5 rounded text-dim">
                            {sec.count} items
                          </span>
                        </div>
                        <p className="text-[10px] text-muted font-normal mt-0.5 truncate uppercase font-mono">
                          {isMapped ? '🔗 Active selection location' : 'Click to reassign to this category'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

            <div className="p-3 bg-[#f0f2f6] dark:bg-[#12141a]/50 text-[10px] font-mono border-t border-[#d8dde8]/80 dark:border-[#282f3a] text-center text-muted">
              SELECT AN ITEM CARD TO RECLASSIFY CATEGORY
            </div>
          </div>


          {/* ================ PANEL 3: ITEMS TO REVIEW (SPANS 5) ================ */}
          <div className="lg:col-span-5 flex flex-col bg-white dark:bg-[#1a1d24] border border-[#d8dde8] dark:border-[#282f3a] rounded-xl shadow-xs overflow-hidden h-full">
            <div className="px-4 py-3 bg-[#f0f2f6] dark:bg-[#12141a]/50 border-b border-[#d8dde8]/80 dark:border-[#282f3a] flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-wider font-bold text-dim uppercase">
                ITEMS TO REVIEW
              </span>
              <div className="flex items-center space-x-1 border border-slate-300 dark:border-slate-800 rounded bg-white dark:bg-black/35 p-0.5">
                <button 
                  onClick={() => toggleAllAccordions(false)}
                  className="px-2 py-0.5 text-[9px] uppercase font-bold text-muted hover:text-dim"
                  title="Collapse all"
                >
                  Collapse
                </button>
                <span className="text-slate-300">|</span>
                <button 
                  onClick={() => toggleAllAccordions(true)}
                  className="px-2 py-0.5 text-[9px] uppercase font-bold text-muted hover:text-dim"
                  title="Expand all"
                >
                  Expand
                </button>
              </div>
            </div>

            {/* Accordions listing */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              
              {currentEventItems.length === 0 ? (
                <div className="py-24 text-center text-muted flex flex-col items-center justify-center gap-2">
                  <FolderSync className="w-8 h-8 text-muted/65 animate-spin" />
                  <p className="text-xs">No extracted items for this session.</p>
                </div>
              ) : (
                (['Audio Visual', 'Food & Beverage', 'Room Setup', 'Other'] as const).map((sectionName) => {
                  const sectionItems = currentEventItems.filter(i => i.beo_section === sectionName);
                  const isExpanded = accordions[sectionName];
                  const keptSecItemsCount = sectionItems.filter(i => i.status === 'KEPT').length;
                  const totalSecItemsCount = sectionItems.length;

                  return (
                    <div key={sectionName} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                      
                      {/* ACCORDION TRIGGER HEADER ROW MOCKUP MATCH */}
                      <div 
                        onClick={() => toggleAccordion(sectionName)}
                        className="px-3.5 py-3.5 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-between cursor-pointer select-none border-b border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center space-x-2">
                          <ChevronRight className={`w-4 h-4 text-dim transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          <h3 className="text-xs font-bold text-dim uppercase tracking-wide">
                            {sectionName}
                          </h3>
                          <span className="text-[10px] font-mono text-muted bg-[#f0f2f6] dark:bg-[#12141a] px-1.5 py-0.5 rounded">
                            {keptSecItemsCount}/{totalSecItemsCount} kept
                          </span>
                        </div>

                        {/* Fast Keep All button for accordion row block */}
                        {totalSecItemsCount > 0 && sectionItems.some(item => item.status === 'PENDING') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryKeepAll(sectionName);
                            }}
                            className="text-[10px] font-mono text-[#059669] hover:underline font-bold"
                          >
                            Keep all
                          </button>
                        )}
                      </div>

                      {/* ACCORDION CHILDREN CARDS CONTAINER */}
                      {isExpanded && (
                        <div className="bg-white dark:bg-[#1a1d24] divide-y divide-slate-100 dark:divide-slate-800">
                          {sectionItems.length === 0 ? (
                            <div className="p-4 text-center text-muted font-mono text-[10px] italic">
                              No items classified under {sectionName}
                            </div>
                          ) : (
                            sectionItems.map((item) => {
                              const isActive = activeItemId === item.id;
                              const tier = getConfidenceTier(item.confidence, item.match_status);
                              
                              // Left border highlight strip mapping Mockup
                              let tierBorder = "border-l-4 border-l-[#505868]"; // draft gray
                              let badgeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                              let badgeLabel = "MANUAL";

                              if (tier === 'high') {
                                tierBorder = "border-l-4 border-l-[#059669]"; // green
                                badgeColor = "bg-[#059669]/10 text-[#059669] dark:bg-green-950/40 dark:text-[#22c55e]";
                                badgeLabel = "AI MATCH";
                              } else if (tier === 'review') {
                                tierBorder = "border-l-4 border-l-[#b45309]"; // amber
                                badgeColor = "bg-[#b45309]/10 text-[#b45309] dark:bg-amber-950/40 dark:text-[#e5a84a]";
                                badgeLabel = "NEEDS REVIEW";
                              }

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => setActiveItemId(item.id)}
                                  className={`p-4 transition-all duration-150 flex items-stretch gap-3 cursor-pointer ${tierBorder} ${
                                    isActive 
                                      ? 'bg-blue-50/50 dark:bg-[#2563eb]/5 ring-2 ring-[#2563eb]/10 ring-inset' 
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/20'
                                  }`}
                                >
                                  {/* Drag Handle icon matching mockup */}
                                  <div className="text-slate-300 dark:text-slate-700 select-none cursor-grab flex flex-col justify-center py-2 shrink-0">
                                    <div className="grid grid-cols-2 gap-0.5 w-2">
                                      <span className="w-1 h-1 bg-current rounded-full" />
                                      <span className="w-1 h-1 bg-current rounded-full" />
                                      <span className="w-1 h-1 bg-current rounded-full" />
                                      <span className="w-1 h-1 bg-current rounded-full" />
                                      <span className="w-1 h-1 bg-current rounded-full" />
                                      <span className="w-1 h-1 bg-current rounded-full" />
                                    </div>
                                  </div>

                                  {/* Main item details layout */}
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      {/* Item Description Name */}
                                      <input
                                        type="text"
                                        value={item.item_name}
                                        onChange={(e) => handleFieldChange(item.id, 'item_name', e.target.value)}
                                        className="text-xs font-bold font-sans text-dim dark:text-white bg-transparent hover:bg-slate-50 focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-black/35 border-b border-transparent focus:border-[#2563eb] rounded p-0.5 flex-1 select-all"
                                      />
                                      
                                      {/* Dynamic Tier badge indicator */}
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide leading-none ${badgeColor}`}>
                                        {badgeLabel}
                                      </span>
                                    </div>

                                    {/* Inline Value Editors for price calculations */}
                                    <div className="flex items-baseline space-x-4">
                                      {/* Qty Box */}
                                      <div className="flex items-center space-x-1.5 shrink-0">
                                        <span className="text-[10px] text-muted font-mono font-bold uppercase">QTY</span>
                                        <input
                                          type="number"
                                          value={item.extracted_quantity === null ? '' : item.extracted_quantity}
                                          onChange={(e) => handleFieldChange(item.id, 'extracted_quantity', e.target.value)}
                                          className="w-14 text-center text-xs font-mono bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800 rounded p-1 text-dim"
                                          placeholder="?"
                                        />
                                      </div>

                                      {/* Price Box */}
                                      <div className="flex items-center space-x-1.5 shrink-0">
                                        <span className="text-[10px] text-muted font-mono font-bold uppercase">PRICE</span>
                                        <div className="relative">
                                          <input
                                            type="number"
                                            value={item.extracted_unit_price === null ? '' : item.extracted_unit_price}
                                            onChange={(e) => handleFieldChange(item.id, 'extracted_unit_price', e.target.value)}
                                            className="w-20 pr-1 pl-1 text-center text-xs font-mono bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800 rounded p-1 text-dim"
                                            placeholder="?"
                                          />
                                        </div>
                                      </div>

                                      <span className="text-[10px] text-muted font-mono">
                                        Total: <strong className="text-dim font-bold">${
                                          ((item.extracted_quantity ?? 0) * (item.extracted_unit_price ?? 0)).toLocaleString()
                                        }</strong>
                                      </span>
                                    </div>

                                    {/* Quote tag container with quotation suffix */}
                                    {item.snippet && (
                                      <div className="flex items-start gap-1 pb-1">
                                        <span className="text-slate-400 dark:text-slate-600 text-sm leading-none font-serif">“</span>
                                        <p className="text-[10px] text-muted font-sans italic mt-0.5">
                                          {item.snippet}
                                        </p>
                                        <span className="text-slate-400 dark:text-slate-600 text-sm leading-none font-serif">”</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right side individual action buttons */}
                                  <div className="shrink-0 flex flex-col justify-center space-y-1 w-20 pl-2 self-center border-l border-slate-100 dark:border-slate-800">
                                    {item.status === 'KEPT' ? (
                                      <div className="space-y-1 text-center">
                                        <span className="text-[9px] font-mono uppercase bg-green-500/10 text-green-700 dark:text-[#22c55e] px-1.5 py-0.5 rounded block text-center font-bold">
                                          Confirmed
                                        </span>
                                        <button
                                          onClick={() => handleRestore(item.id)}
                                          className="text-[9px] font-bold text-muted hover:text-dim block w-full text-center hover:underline"
                                        >
                                          Undo
                                        </button>
                                      </div>
                                    ) : item.status === 'REMOVED' ? (
                                      <div className="space-y-1 text-center">
                                        <span className="text-[9px] font-mono uppercase bg-red-400/10 text-red-700 px-1.5 py-0.5 rounded block text-center font-bold">
                                          Omitted
                                        </span>
                                        <button
                                          onClick={() => handleRestore(item.id)}
                                          className="text-[9px] font-bold text-muted hover:text-dim block w-full text-center hover:underline"
                                        >
                                          Restore
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleKeep(item.id)}
                                          className="px-2.5 py-1 text-[11px] font-bold rounded-md border border-slate-200 dark:border-slate-700 hover:border-[#059669] hover:bg-[#059669]/5 dark:hover:bg-[#059669]/10 text-[#059669] dark:text-[#22c55e] transition-all flex items-center justify-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5" /> Keep
                                        </button>
                                        <button
                                          onClick={() => handleRemove(item.id)}
                                          className="px-2.5 py-1 text-[11px] font-bold rounded-md border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-500/5 text-red-600 dark:text-red-400 transition-all flex items-center justify-center"
                                        >
                                          Remove
                                        </button>
                                      </>
                                    )}
                                  </div>

                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                    </div>
                  );
                })
              )}

            </div>

            <div className="p-3 bg-[#f0f2f6] dark:bg-[#12141a]/50 text-[10px] font-mono border-t border-[#d8dde8]/80 dark:border-[#282f3a] text-center text-muted flex justify-between px-4">
              <span>UNREVIEWED PENDING: {currentEventItems.filter(i => i.status === 'PENDING').length}</span>
              <span>ESTIMATED SUM: ${
                currentEventItems.filter(i=>i.status==='KEPT').reduce((acc, i) => acc + ((i.extracted_quantity ?? 0) * (i.extracted_unit_price ?? 0)), 0).toLocaleString()
              } USD</span>
            </div>
          </div>

        </div>

      </div>

      {/* 7. RECENT ACTION UNDO FLOATING SNACKBAR CARD */}
      {lastAction && (
        <div className="fixed bottom-18 left-5 bg-white dark:bg-[#1a1d24] border border-[#2563eb]/20 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 z-40 animate-slide-up text-xs max-w-sm">
          <div className="w-2 h-2 rounded-full bg-accent-blue animate-ping" />
          <span className="text-muted">Line status modified.</span>
          <button
            onClick={handleUndo}
            className="px-2 py-1 bg-blue-50 dark:bg-[#2563eb]/10 text-accent-blue hover:underline rounded font-bold text-[11px]"
          >
            Undo Action
          </button>
        </div>
      )}

      {/* 8. FOOTER WORKSPACE ACTION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-[#1a1d24] border-t border-[#d8dde8] dark:border-[#282f3a] px-6 py-2 flex items-center justify-between z-40 shadow-lg">
        
        {/* Left side info tools */}
        <div className="flex items-center space-x-4">
          {/* Remove all remaining */}
          <button
            onClick={handleOmitAllRemaining}
            disabled={currentEventItems.filter(i => i.status === 'PENDING').length === 0}
            className="text-[11px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer disabled:text-muted disabled:no-underline select-none"
          >
            Remove all remaining
          </button>
        </div>

        {/* Right side bulk keepers and main blue Apply action */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={handleKeepAllRemaining}
            disabled={currentEventItems.filter(i => i.status === 'PENDING').length === 0}
            className="px-4 py-2 border border-[#d8dde8] dark:border-[#282f3a] bg-white dark:bg-[#1a1d24] text-xs font-bold rounded-lg text-dim hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep all remaining
          </button>

          {/* Apply N items button that lights up blue matching exact mockup */}
          <button
            onClick={() => {
              setSuccessToast(true);
            }}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center gap-1.5"
            id="apply-action-items-footer-btn"
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>Apply {activeEventKeptCount} items</span>
          </button>
        </div>

      </footer>

      {/* Applied Confirmation Modal toast overlay */}
      {successToast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#1a1d24] border border-slate-300 dark:border-slate-800 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-[#22c55e] rounded-full flex items-center justify-center mx-auto border border-green-300 dark:border-green-800">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-dim dark:text-white">Review Applied Successfully!</h3>
              <p className="text-[11px] text-muted leading-relaxed mt-1">
                Committed <strong className="text-dim dark:text-white">{activeEventKeptCount} line items</strong> directly to the booking reservation.
              </p>
            </div>
            <button
              onClick={() => setSuccessToast(false)}
              className="w-full py-2 bg-[#2563eb] text-white rounded-lg text-xs font-bold hover:bg-[#1d4ed8]"
            >
              Continue Working
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-[#1a1d24] border border-slate-300 dark:border-slate-800 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-800">
              <RotateCcw className="w-6 h-6 animate-spin-reverse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-dim dark:text-white">Reset Document Review?</h3>
              <p className="text-[11px] text-muted leading-relaxed mt-1">
                This will lose all custom edits, keeps, or removals made in this session and restore the original document data.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-dim dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={performReset}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
