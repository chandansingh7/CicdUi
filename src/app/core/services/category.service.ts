import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { CategoryRequest, CategoryResponse } from '../models/category.models';
import { SILENT_ERROR_HEADER } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private url = `${environment.apiUrl}/api/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<CategoryResponse[]>> {
    return this.http.get<ApiResponse<CategoryResponse[]>>(this.url);
  }

  getById(id: number): Observable<ApiResponse<CategoryResponse>> {
    return this.http.get<ApiResponse<CategoryResponse>>(`${this.url}/${id}`);
  }

  create(req: CategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.post<ApiResponse<CategoryResponse>>(this.url, req);
  }

  update(id: number, req: CategoryRequest): Observable<ApiResponse<CategoryResponse>> {
    return this.http.put<ApiResponse<CategoryResponse>>(`${this.url}/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }

  getStats(): Observable<ApiResponse<{ total: number }>> {
    return this.http.get<ApiResponse<{ total: number }>>(`${this.url}/stats`,
      { headers: new HttpHeaders({ [SILENT_ERROR_HEADER]: '1' }) });
  }
}
