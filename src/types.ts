export type BeoSection = 'Food & Beverage' | 'Audio Visual' | 'Room Setup' | 'Other';

export interface EventInfo {
  id: number;
  name: string;
  date: string;
}

export interface ExtractedItem {
  id: number;
  item_name: string;
  beo_section: BeoSection;
  extracted_quantity: number | null;
  extracted_unit_price: number | null;
  confidence: number;
  match_status: 'MATCHED' | 'REVIEW' | 'NOT_AVAILABLE';
  snippet: string;
  event_id: number;
  event_name: string;
  
  // Operator action states
  status: 'PENDING' | 'KEPT' | 'REMOVED';
  user_edited: boolean;
}

export type ConfidenceTier = 'high' | 'review' | 'manual';

export interface BEOData {
  events: EventInfo[];
  sourceText: string;
  items: ExtractedItem[];
}
