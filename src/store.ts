import { useState, useCallback } from 'react';
import { supabase, type CartItem, type OrderData } from './supabase';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: import('./supabase').Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.product.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== id));
    } else {
      setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return { cart, addToCart, removeFromCart, updateQty, clearCart, total, itemCount };
}

export async function placeOrder(data: OrderData): Promise<{ orderNumber: string }> {
  const orderNumber = `LS${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
  const { error } = await supabase.from('orders').insert({
    order_number: orderNumber,
    user_name: data.user_name,
    user_email: data.user_email,
    user_phone: data.user_phone,
    items: data.items,
    subtotal: data.subtotal,
    shipping_cost: data.shipping_cost,
    total: data.total,
    shipping_address: data.shipping_address,
    payment_method: data.payment_method,
    status: 'pending',
    notes: data.notes,
    timeline: [{ status: 'pending', date: new Date().toISOString(), note: 'Pedido creado' }],
  });
  if (error) throw new Error(error.message);
  return { orderNumber };
}

export function formatPrice(price: number) {
  return '$' + Math.round(price).toLocaleString('es-AR');
}
