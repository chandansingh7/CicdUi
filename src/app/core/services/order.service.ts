import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.models';
import { OrderRequest, OrderResponse } from '../models/order.models';

export interface OrderStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  refunded: number;
  totalRevenue: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private url = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20): Observable<ApiResponse<PageResponse<OrderResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<OrderResponse>>>(this.url, { params });
  }

  getById(id: number): Observable<ApiResponse<OrderResponse>> {
    return this.http.get<ApiResponse<OrderResponse>>(`${this.url}/${id}`);
  }

  create(req: OrderRequest): Observable<ApiResponse<OrderResponse>> {
    return this.http.post<ApiResponse<OrderResponse>>(this.url, req);
  }

  cancel(id: number): Observable<ApiResponse<OrderResponse>> {
    return this.http.put<ApiResponse<OrderResponse>>(`${this.url}/${id}/cancel`, {});
  }

  getStats(): Observable<ApiResponse<OrderStats>> {
    return this.http.get<ApiResponse<OrderStats>>(`${this.url}/stats`);
  }
}
