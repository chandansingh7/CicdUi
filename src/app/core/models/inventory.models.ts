export interface InventoryUpdateRequest {
  quantity: number;
  lowStockThreshold: number;
}

export interface InventoryResponse {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  lowStockThreshold: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}
