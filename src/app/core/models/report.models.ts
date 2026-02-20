export interface TopProductEntry {
  productId: number;
  productName: string;
  unitsSold: number;
}

export interface SalesReportResponse {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: TopProductEntry[];
}
