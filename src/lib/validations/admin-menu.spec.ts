import { describe, it, expect } from 'vitest';
import { MenuFormSchema, VariantGroupSchema } from './admin-menu.schema';

describe('Admin Menu Validation Schemas', () => {
  it('should validate valid menu form data successfully', () => {
    const validMenu = {
      name: 'Kopi Kumpul Santuy',
      description: 'Signature espresso blend with oat milk and honey',
      price: 28000,
      categoryId: 'cat-coffee',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772',
      isAvailable: true,
      isBestSeller: true,
      isRecommended: false,
      variantGroups: [
        {
          name: 'Suhu',
          isRequired: true,
          minSelect: 1,
          maxSelect: 1,
          options: [
            { name: 'Hot', extraPrice: 0, isAvailable: true },
            { name: 'Ice', extraPrice: 0, isAvailable: true },
          ],
        },
      ],
    };

    const parseResult = MenuFormSchema.safeParse(validMenu);
    expect(parseResult.success).toBe(true);
  });

  it('should fail if maxSelect is less than minSelect in VariantGroupSchema', () => {
    const invalidGroup = {
      name: 'Extra Topping',
      isRequired: false,
      minSelect: 3,
      maxSelect: 1, // Invalid: max < min
      options: [{ name: 'Jelly', extraPrice: 3000, isAvailable: true }],
    };

    const parseResult = VariantGroupSchema.safeParse(invalidGroup);
    expect(parseResult.success).toBe(false);
  });

  it('should fail if price is less than 1000', () => {
    const invalidMenu = {
      name: 'Kopi Murah',
      price: 500, // Invalid: min is 1000
      categoryId: 'cat-1',
      variantGroups: [],
    };

    const parseResult = MenuFormSchema.safeParse(invalidMenu);
    expect(parseResult.success).toBe(false);
  });
});
