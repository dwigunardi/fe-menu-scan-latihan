import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './use-cart-store';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should add item with correct unit price calculated from variants', () => {
    const { addItem, getSubtotal, getTotalItems } = useCartStore.getState();

    addItem({
      menuItemId: 'kopi-kumpul-1',
      name: 'Kopi Kumpul Santuy',
      basePrice: 20000,
      quantity: 2,
      selectedVariants: [
        {
          groupId: 'size',
          groupName: 'Ukuran',
          optionId: 'size-large',
          optionName: 'Large (+5k)',
          extraPrice: 5000,
        },
        {
          groupId: 'topping',
          groupName: 'Topping',
          optionId: 'topping-jelly',
          optionName: 'Coffee Jelly (+4k)',
          extraPrice: 4000,
        },
      ],
      notes: 'Less ice',
    });

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    // Unit price = 20000 + 5000 + 4000 = 29000
    expect(state.items[0].unitPrice).toBe(29000);
    expect(getTotalItems()).toBe(2);
    // Subtotal = 29000 * 2 = 58000
    expect(getSubtotal()).toBe(58000);
  });

  it('should update quantity and remove item if quantity drops to zero', () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem({
      menuItemId: 'kopi-genyal-1',
      name: 'Kopi Genyal',
      basePrice: 22000,
      quantity: 1,
      selectedVariants: [],
    });

    const item = useCartStore.getState().items[0];

    // Increase quantity
    updateQuantity(item.id, 1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    // Decrease quantity
    updateQuantity(item.id, -1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    // Decrease to zero -> item removed
    updateQuantity(item.id, -1);
    expect(useCartStore.getState().items.length).toBe(0);
  });
});
