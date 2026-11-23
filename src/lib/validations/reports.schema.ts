import { z } from 'zod';

/**
 * KPI Overview schema within dashboard metrics
 */
export const TableOccupancySchema = z.object({
  totalTables: z.number().default(0),
  occupiedTables: z.number().default(0),
  occupancyPercentage: z.number().default(0),
});

export const DashboardKpiSchema = z.object({
  todayRevenue: z.number().default(0),
  todayOrdersCount: z.number().default(0),
  activeOrdersCount: z.number().default(0),
  tableOccupancy: TableOccupancySchema.default({
    totalTables: 0,
    occupiedTables: 0,
    occupancyPercentage: 0,
  }),
});

export const DashboardRecentOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  tableNumber: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  status: z.string(),
  totalAmount: z.number(),
  itemCount: z.number().default(1),
  createdAt: z.string(),
});

export const TopSellingItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  totalQuantitySold: z.number().default(0),
  totalRevenue: z.number().default(0),
  image: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
});

export const DashboardOverviewSchema = z.object({
  kpi: DashboardKpiSchema,
  recentOrders: z.array(DashboardRecentOrderSchema).default([]),
  topSellingToday: z.array(TopSellingItemSchema).default([]),
});

export const OrdersByStatusSchema = z.object({
  status: z.string(),
  count: z.number().default(0),
});

export const RevenueReportSchema = z.object({
  totalRevenue: z.number().default(0),
  totalOrders: z.number().default(0),
  averageOrderValue: z.number().default(0),
  ordersByStatus: z.array(OrdersByStatusSchema).default([]),
});

export const TopSellingReportSchema = z.array(TopSellingItemSchema);

// Inferred TypeScript Types
export type TableOccupancyData = z.infer<typeof TableOccupancySchema>;
export type DashboardKpiData = z.infer<typeof DashboardKpiSchema>;
export type DashboardRecentOrderData = z.infer<typeof DashboardRecentOrderSchema>;
export type TopSellingItemData = z.infer<typeof TopSellingItemSchema>;
export type DashboardOverviewData = z.infer<typeof DashboardOverviewSchema>;
export type OrdersByStatusData = z.infer<typeof OrdersByStatusSchema>;
export type RevenueReportData = z.infer<typeof RevenueReportSchema>;
export type TopSellingReportData = z.infer<typeof TopSellingReportSchema>;

export type DatePreset = 'today' | '7d' | '30d' | 'custom';

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}
