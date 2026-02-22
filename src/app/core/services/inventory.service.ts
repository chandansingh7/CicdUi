import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { InventoryResponse, InventoryUpdateRequest } from '../models/inventory.models';
import { SILENT_ERROR_HEADER } from '../interceptors/error.interceptor';

export interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private url = `${environment.apiUrl}/api/inventory`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<InventoryResponse[]>> {
    return this.http.get<ApiResponse<InventoryResponse[]>>(this.url);
  }

  getLowStock(): Observable<ApiResponse<InventoryResponse[]>> {
    return this.http.get<ApiResponse<InventoryResponse[]>>(`${this.url}/low-stock`);
  }

  getByProduct(productId: number): Observable<ApiResponse<InventoryResponse>> {
    return this.http.get<ApiResponse<InventoryResponse>>(`${this.url}/product/${productId}`);
  }

  update(productId: number, req: InventoryUpdateRequest): Observable<ApiResponse<InventoryResponse>> {
    return this.http.put<ApiResponse<InventoryResponse>>(`${this.url}/product/${productId}`, req);
  }

  getStats(): Observable<ApiResponse<InventoryStats>> {
    return this.http.get<ApiResponse<InventoryStats>>(`${this.url}/stats`,
      { headers: new HttpHeaders({ [SILENT_ERROR_HEADER]: '1' }) });
  }
}
