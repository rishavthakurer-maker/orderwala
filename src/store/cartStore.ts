import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  vendorId: string;
  name: string;
  image: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  variant?: string;
  unit: string;
}

interface CartStore {
  items: CartItem[];
  vendorId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      vendorId: null,

      addItem: (item) => {
        const { items, vendorId } = get();
        
        // Check if adding from different vendor
        if (vendorId && vendorId !== item.vendorId && items.length > 0) {
          // Clear cart if different vendor
          set({ items: [item], vendorId: item.vendorId });
          return;
        }

        // Check if item already exists
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variant === item.variant
        );

        if (existingIndex > -1) {
          // Update quantity
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity;
          set({ items: newItems });
        } else {
          // Add new item
          set({ items: [...items, item], vendorId: item.vendorId });
        }
      },

      removeItem: (productId, variant) => {
        const { items } = get();
        const newItems = items.filter(
          (item) => !(item.productId === productId && item.variant === variant)
        );
        set({ 
          items: newItems,
          vendorId: newItems.length > 0 ? get().vendorId : null,
        });
      },

      updateQuantity: (productId, quantity, variant) => {
        const { items } = get();
        
        if (quantity <= 0) {
          get().removeItem(productId, variant);
          return;
        }

        const newItems = items.map((item) =>
          item.productId === productId && item.variant === variant
            ? { ...item, quantity }
            : item
        );
        set({ items: newItems });
      },

      clearCart: () => {
        set({ items: [], vendorId: null });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.discountPrice || item.price;
          return total + price * item.quantity;
        }, 0);
      },

      getSubtotal: () => {
        return get().getTotal();
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'orderwala-cart',
    }
  )
);
