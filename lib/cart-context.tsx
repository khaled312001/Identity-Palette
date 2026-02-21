import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  modifiers?: { name: string; option: string; price: number }[];
  notes?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: { id: number; name: string; price: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  discount: number;
  setDiscount: (d: number) => void;
  taxRate: number;
  setTaxRate: (r: number) => void;
  tax: number;
  total: number;
  customerId: number | null;
  setCustomerId: (id: number | null) => void;
  tableNumber: string;
  setTableNumber: (t: string) => void;
  orderType: string;
  setOrderType: (t: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(10);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [orderType, setOrderType] = useState("dine_in");

  const addItem = useCallback((product: { id: number; name: string; price: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: Date.now(), productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setCustomerId(null);
    setTableNumber("");
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const tax = useMemo(() => ((subtotal - discount) * taxRate) / 100, [subtotal, discount, taxRate]);
  const total = useMemo(() => subtotal - discount + tax, [subtotal, discount, tax]);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items, addItem, removeItem, updateQuantity, clearCart,
      subtotal, itemCount, discount, setDiscount, taxRate, setTaxRate,
      tax, total, customerId, setCustomerId, tableNumber, setTableNumber,
      orderType, setOrderType,
    }),
    [items, subtotal, itemCount, discount, taxRate, tax, total, customerId, tableNumber, orderType]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
