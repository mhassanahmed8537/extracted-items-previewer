import { BEOData, ExtractedItem } from './types';

export const INITIAL_LEADERSHIP_SUMMIT_DATA: BEOData = {
  events: [
    { id: 1, name: "Morning General Session", date: "Jul 15, 2026" },
    { id: 2, name: "Afternoon Breakout", date: "Jul 15, 2026" },
    { id: 3, name: "Welcome Reception", date: "Jul 15, 2026" },
    { id: 4, name: "Day 2 Keynote", date: "Jul 16, 2026" },
    { id: 5, name: "Workshop A — Strategy", date: "Jul 16, 2026" },
    { id: 6, name: "Workshop B — Operations", date: "Jul 16, 2026" },
    { id: 7, name: "Networking Dinner", date: "Jul 16, 2026" },
    { id: 8, name: "Closing Remarks Panel", date: "Jul 17, 2026" },
    { id: 9, name: "Executive Breakfast", date: "Jul 17, 2026" },
    { id: 10, name: "Exhibitors Hall Gala", date: "Jul 17, 2026" }
  ],
  sourceText: `HIGHGATE HOTEL — BANQUET EVENT ORDER (DRAFT)
Client: Northwind Annual Leadership Summit
Date: July 15, 2026   |   Function Room: Grand Ballroom A

— SECTIONS LISTING —
Food & Beverage       Continental Breakfast       45  28
Food & Beverage       Plated Lunch (3-course)      45  52
Audio Visual          LCD Projector                2   150
Audio Visual          Wireless Microphone          4   75
Room Setup            Crescent Round Setup         6   —
Other                 Custom Ice Sculpture         1   —
Food & Beverage       Afternoon Coffee Break      40  18
Audio Visual          Flip Chart & Markers         5   25`,
  items: [
    { 
      id: 1,  
      item_name: "Continental Breakfast",   
      beo_section: "Food & Beverage", 
      extracted_quantity: 45, 
      extracted_unit_price: 28,  
      confidence: 0.96, 
      match_status: "MATCHED",       
      snippet: "Continental breakfast for 45 guests at 7:30 AM", 
      event_id: 1, 
      event_name: "Morning General Session",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 2,  
      item_name: "Plated Lunch (3-course)",  
      beo_section: "Food & Beverage", 
      extracted_quantity: 45, 
      extracted_unit_price: 52,  
      confidence: 0.91, 
      match_status: "MATCHED",       
      snippet: "Plated lunch, 3-course, served 12:00 PM",        
      event_id: 1, 
      event_name: "Morning General Session",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 3,  
      item_name: "LCD Projector",            
      beo_section: "Audio Visual",    
      extracted_quantity: 2,  
      extracted_unit_price: 150, 
      confidence: 0.88, 
      match_status: "MATCHED",       
      snippet: "(2) LCD projectors with screens",               
      event_id: 1, 
      event_name: "Morning General Session",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 4,  
      item_name: "Wireless Microphone",      
      beo_section: "Audio Visual",    
      extracted_quantity: 4,  
      extracted_unit_price: 75,  
      confidence: 0.62, 
      match_status: "REVIEW",        
      snippet: "lapel + handheld mics (qty unclear)",            
      event_id: 1, 
      event_name: "Morning General Session",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 5,  
      item_name: "Crescent Round Setup",     
      beo_section: "Room Setup",      
      extracted_quantity: 6,  
      extracted_unit_price: null,
      confidence: 0.70, 
      match_status: "REVIEW",        
      snippet: "crescent rounds of 8, dance floor center",       
      event_id: 1, 
      event_name: "Morning General Session",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 6,  
      item_name: "Custom Ice Sculpture",     
      beo_section: "Other",           
      extracted_quantity: 1,  
      extracted_unit_price: null,
      confidence: 0.30, 
      match_status: "NOT_AVAILABLE", 
      snippet: "ice sculpture — company logo (special request)",  
      event_id: 1, 
      event_name: "Morning General Session",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 7,  
      item_name: "Afternoon Coffee Break",   
      beo_section: "Food & Beverage", 
      extracted_quantity: 40, 
      extracted_unit_price: 18,  
      confidence: 0.94, 
      match_status: "MATCHED",       
      snippet: "PM coffee & cookies, 3:00 PM for ~40",           
      event_id: 2, 
      event_name: "Afternoon Breakout",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 8,  
      item_name: "Flip Chart & Markers",     
      beo_section: "Audio Visual",    
      extracted_quantity: 5,  
      extracted_unit_price: 25,  
      confidence: 0.85, 
      match_status: "MATCHED",       
      snippet: "5 flip charts w/ markers",                       
      event_id: 2, 
      event_name: "Afternoon Breakout",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 9, 
      item_name: "Premium Uplighting Kit",    
      beo_section: "Audio Visual", 
      extracted_quantity: 12, 
      extracted_unit_price: 40,   
      confidence: 0.89, 
      match_status: "MATCHED",       
      snippet: "12 wireless uplights with controller setup",           
      event_id: 3, 
      event_name: "Welcome Reception",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 10, 
      item_name: "Champagne Toast Service",    
      beo_section: "Food & Beverage", 
      extracted_quantity: 80, 
      extracted_unit_price: 12,   
      confidence: 0.92, 
      match_status: "MATCHED",       
      snippet: "80 champagne flutes at reception greeting",           
      event_id: 3, 
      event_name: "Welcome Reception",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 11, 
      item_name: "Wireless Presenter Remote",    
      beo_section: "Audio Visual", 
      extracted_quantity: 1, 
      extracted_unit_price: 25,   
      confidence: 0.75, 
      match_status: "REVIEW",        
      snippet: "USB green laser wireless presentation clicker",           
      event_id: 4, 
      event_name: "Day 2 Keynote",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 12, 
      item_name: "Keynote Audio Recording",    
      beo_section: "Audio Visual", 
      extracted_quantity: 1, 
      extracted_unit_price: 250,   
      confidence: 0.81, 
      match_status: "MATCHED",       
      snippet: "Digital stereo recording feed and post-processing",           
      event_id: 4, 
      event_name: "Day 2 Keynote",
      status: "PENDING",
      user_edited: false
    },
    { 
      id: 13, 
      item_name: "Custom Acrylic Lectern",    
      beo_section: "Room Setup", 
      extracted_quantity: 1, 
      extracted_unit_price: 120,   
      confidence: 0.86, 
      match_status: "MATCHED",       
      snippet: "Acrylic clear podium set up center stage",           
      event_id: 4, 
      event_name: "Day 2 Keynote",
      status: "PENDING",
      user_edited: false
    }
  ]
};

export const ALTERNATIVE_WEDDING_DATA: BEOData = {
  events: [
    { id: 1, name: "Wedding Gala Cocktail Reception", date: "Aug 22, 2026" },
    { id: 2, name: "Plated Banquet Dinner", date: "Aug 22, 2026" },
  ],
  sourceText: `HIGHGATE RESORT — BANQUET EVENT ORDER #9921
Client: Thompson-Sterling Wedding Reception
Date: August 22, 2026   |   Garden Pavillion & Salon B

— COCKTAIL RECEPTION —
Passed Hors d'oeuvres (120 guests)
Premium Open Bar (3 hours setup)
Roving Violinist setup w/ ambient speaker
High-top cocktail tables (12 with white linen wraps)`,
  items: [
    {
      id: 101,
      item_name: "Passed Hors d'oeuvres Setup",
      beo_section: "Food & Beverage",
      extracted_quantity: 120,
      extracted_unit_price: 45,
      confidence: 0.98,
      match_status: "MATCHED",
      snippet: "Passed Hors d'oeuvres (120 guests)",
      event_id: 1,
      event_name: "Wedding Gala Cocktail Reception",
      status: "PENDING",
      user_edited: false
    },
    {
      id: 102,
      item_name: "Premium Open Bar (3h)",
      beo_section: "Food & Beverage",
      extracted_quantity: 1,
      extracted_unit_price: 1800,
      confidence: 0.89,
      match_status: "MATCHED",
      snippet: "Premium Open Bar (3 hours setup)",
      event_id: 1,
      event_name: "Wedding Gala Cocktail Reception",
      status: "PENDING",
      user_edited: false
    },
    {
      id: 103,
      item_name: "Cocktail High-Top Setup",
      beo_section: "Room Setup",
      extracted_quantity: 12,
      extracted_unit_price: null,
      confidence: 0.72,
      match_status: "REVIEW",
      snippet: "High-top cocktail tables (12 with white linen wraps)",
      event_id: 1,
      event_name: "Wedding Gala Cocktail Reception",
      status: "PENDING",
      user_edited: false
    },
    {
      id: 104,
      item_name: "Roving Violinist Speaker Setup",
      beo_section: "Other",
      extracted_quantity: 1,
      extracted_unit_price: 450,
      confidence: 0.55,
      match_status: "NOT_AVAILABLE",
      snippet: "Roving Violinist setup w/ ambient speaker",
      event_id: 1,
      event_name: "Wedding Gala Cocktail Reception",
      status: "PENDING",
      user_edited: false
    },
    {
      id: 105,
      item_name: "Plated Dinner Main Course",
      beo_section: "Food & Beverage",
      extracted_quantity: 120,
      extracted_unit_price: 95,
      confidence: 0.94,
      match_status: "MATCHED",
      snippet: "Premium filet mignon or Chilean sea bass for 120 guests",
      event_id: 2,
      event_name: "Plated Banquet Dinner",
      status: "PENDING",
      user_edited: false
    },
    {
      id: 106,
      item_name: "Wedding Custom Bakery Cake (4-Tier)",
      beo_section: "Food & Beverage",
      extracted_quantity: 1,
      extracted_unit_price: 850,
      confidence: 0.91,
      match_status: "MATCHED",
      snippet: "Custom 4-tier red velvet wedding cake",
      event_id: 2,
      event_name: "Plated Banquet Dinner",
      status: "PENDING",
      user_edited: false
    }
  ]
};

export function getConfidenceTier(confidence: number, match_status: string): 'high' | 'review' | 'manual' {
  if (match_status === 'NOT_AVAILABLE') {
    return 'manual';
  }
  if (match_status === 'REVIEW' || confidence < 0.8) {
    return 'review';
  }
  return 'high';
}
