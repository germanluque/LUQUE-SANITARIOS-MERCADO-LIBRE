import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adfzhxualmzmmkhvvaac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_29qOnctq9it523e7YvLHGQ_7bikfd8f';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  externalurl: string;
  category: string;
  brand: string;
  status: string;
  description: string;
  stock: number;
  keywords: string[];
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderData {
  user_name: string;
  user_email: string;
  user_phone: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    category: string;
    brand: string;
  }[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: {
    address: string;
    notes: string;
  };
  payment_method: string;
  status: string;
  notes: string;
}
