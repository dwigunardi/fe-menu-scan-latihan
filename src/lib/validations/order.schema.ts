import { z } from 'zod';

export const OrderStatusSchema = z.enum([
  'PENDING',
  'PREPARING',
  'SERVED',
  'PAID',
  'CANCELLED',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const SelectedVariantSnapshotSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        id: val.id || undefined,
        groupName: val.groupName || val.groupNameSnapshot || 'Varian',
        optionName: val.optionName || val.optionNameSnapshot || '',
        extraPrice: Number(val.extraPrice !== undefined ? val.extraPrice : val.extraPriceSnapshot || 0),
      };
    }
    return val;
  },
  z.object({
    id: z.string().optional(),
    groupName: z.string(),
    optionName: z.string(),
    extraPrice: z.coerce.number().default(0),
  })
);

export type SelectedVariantSnapshot = z.infer<typeof SelectedVariantSnapshotSchema>;

export const OrderItemSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        id: val.id || undefined,
        menuItemId: val.menuItemId || '',
        menuName: val.menuName || val.menuNameSnapshot || 'Menu Item',
        price: Number(val.price !== undefined ? val.price : val.priceSnapshot || 0),
        quantity: Number(val.quantity || 1),
        subtotal: Number(val.subtotal || 0),
        notes: val.notes || null,
        selectedVariants: val.selectedVariants || [],
      };
    }
    return val;
  },
  z.object({
    id: z.string().optional(),
    menuItemId: z.string(),
    menuName: z.string(),
    price: z.coerce.number(),
    quantity: z.coerce.number().int().min(1),
    subtotal: z.coerce.number(),
    notes: z.string().optional().nullable(),
    selectedVariants: z.array(SelectedVariantSnapshotSchema).default([]),
  })
);

export type OrderItemData = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        id: val.id || '',
        orderNumber: val.orderNumber || '#ORD-000',
        tableId: val.tableId || '',
        tableNumber: val.tableNumber || val.table?.number || val.table?.tableNumber || 'Meja',
        zoneName: val.zoneName || val.table?.zone?.name || null,
        customerName: val.customerName || 'Tamu',
        status: val.status || 'PENDING',
        totalAmount: Number(val.totalAmount || 0),
        paidAt: val.paidAt || null,
        createdAt: val.createdAt ? String(val.createdAt) : new Date().toISOString(),
        updatedAt: val.updatedAt ? String(val.updatedAt) : new Date().toISOString(),
        orderItems: val.orderItems || val.items || [],
      };
    }
    return val;
  },
  z.object({
    id: z.string(),
    orderNumber: z.string(),
    tableId: z.string(),
    tableNumber: z.string(),
    zoneName: z.string().optional().nullable(),
    customerName: z.string(),
    status: OrderStatusSchema.default('PENDING'),
    totalAmount: z.coerce.number(),
    paidAt: z.string().optional().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    orderItems: z.array(OrderItemSchema).default([]),
  })
);

export type OrderData = z.infer<typeof OrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
