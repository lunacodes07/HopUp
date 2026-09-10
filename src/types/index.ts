export type Product = {
  id: string;
  rank: number; // We will use this to store dynamic rank, even if it's derived from price sorting
  name: string;
  description: string;
  category: string;
  clicks: number;
  price: number;
  url?: string;
  logo_url?: string | null;
  created_at?: string;
  last_hopped_at?: string;
};

export type SponsoredSlot = {
  id: string;
  slot_number: number;
  name: string;
  description: string;
  category: string;
  url: string;
  clicks: number;
  price: number;
  weeks: number;
  expires_at: string;
  created_at?: string;
};

export type StanleySlot = {
  id: string;
  slot_number: number;
  name: string;
  url: string;
  price: number;
  created_at?: string;
};
