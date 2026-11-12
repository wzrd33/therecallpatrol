export type Severity = 'high' | 'medium' | 'low';
export type Category = 'kids' | 'pantry' | 'refrigerator' | 'household' | 'pets' | 'other';

export interface Recall {
  id: string;
  title: string;
  hazard: string;
  date: string;
  dateFormatted: string;
  severity: Severity;
  category: Category;
  url: string;
  description: string;
  products: string;
}
