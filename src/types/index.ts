export type Product = {
  id: string;
  rank: number; // We will use this to store dynamic rank, even if it's derived from price sorting
  name: string;
  description: string;
  category: string;
  clicks: number;
  price: number;
  url?: string;
  created_at?: string;
  last_hopped_at?: string;
};
