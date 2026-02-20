import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api.models';
import { ProductRequest, ProductResponse } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private url = `${environment.apiUrl}/api/products`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, categoryId?: number, page = 0, size = 20): Observable<ApiResponse<PageResponse<ProductResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<ApiResponse<PageResponse<ProductResponse>>>(this.url, { params });
  }

  getById(id: number): Observable<ApiResponse<ProductResponse>> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.url}/${id}`);
  }

  getByBarcode(barcode: string): Observable<ApiResponse<ProductResponse>> {
    return this.http.get<ApiResponse<ProductResponse>>(`${this.url}/barcode/${barcode}`);
  }

  create(req: ProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.http.post<ApiResponse<ProductResponse>>(this.url, req);
  }

  update(id: number, req: ProductRequest): Observable<ApiResponse<ProductResponse>> {
    return this.http.put<ApiResponse<ProductResponse>>(`${this.url}/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }

  uploadImage(id: number, file: File): Observable<ApiResponse<ProductResponse>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<ProductResponse>>(`${this.url}/${id}/image`, form);
  }
}
