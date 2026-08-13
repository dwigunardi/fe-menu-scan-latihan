import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SelectedVariantOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

export interface CartItem {
  id: string; // Unique cart item identifier (UUID or hash of menuItemId + variants)
  menuItemId: string;
  name: string;
  basePrice: number;
  unitPrice: number; // basePrice + Σ(selectedVariants.extraPrice)
  quantity: number;
  imageUrl?: string | null;
  selectedVariants: SelectedVariantOption[];
  notes?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'unitPrice'>) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

function calculateItemUnitPrice(basePrice: number, variants: SelectedVariantOption[]): number {
  const extraSum = variants.reduce((sum, v) => sum + (v.extraPrice || 0), 0);
  return basePrice + extraSum;
}

function generateCartItemId(menuItemId: string, variants: SelectedVariantOption[], notes?: string): string {
  const variantKey = variants
    .map((v) => `${v.groupId}:${v.optionId}`)
    .sort()
    .join('|');
  const cleanNotes = (notes || '').trim().toLowerCase();
  return `${menuItemId}_${variantKey}_${cleanNotes}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (itemData) => {
        const unitPrice = calculateItemUnitPrice(itemData.basePrice, itemData.selectedVariants);
        const id = generateCartItemId(itemData.menuItemId, itemData.selectedVariants, itemData.notes);

        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.id === id);

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + itemData.quantity,
            };
            return { items: updatedItems };
          }

          return {
            items: [
              ...state.items,
              {
                ...itemData,
                id,
                unitPrice,
              },
            ],
          };
        });
      },

      updateQuantity: (cartItemId, delta) => {
        set((state) => {
          const updatedItems = state.items
            .map((item) => {
              if (item.id === cartItemId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter((item): item is CartItem => item !== null);

          return { items: updatedItems };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },
    }),
    {
      name: 'kumpul_cafe_cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
