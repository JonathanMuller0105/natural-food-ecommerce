'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface Product {
  id: string; 
  name: string; 
  price: number; 
  image: string;
}

interface CartItem {
  product: Product; 
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void; // NOVO: Função para esvaziar a sacola
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.product.id !== productId));
  
  const updateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: qty } : item));
  };

  // NOVO: Lógica que zera o estado do carrinho
  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};