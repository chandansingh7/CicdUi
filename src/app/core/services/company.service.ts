import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { CompanyRequest, CompanyResponse } from '../models/company.models';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private url = `${environment.apiUrl}/api/company`;
  private cached: CompanyResponse | null = null;

  constructor(private http: HttpClient) {}

  get(forceRefresh = false): Observable<ApiResponse<CompanyResponse>> {
    const req = this.http.get<ApiResponse<CompanyResponse>>(this.url);
    if (!forceRefresh) {
      return req.pipe(tap(res => { this.cached = res.data ?? null; }));
    }
    this.cached = null;
    return req.pipe(tap(res => { this.cached = res.data ?? null; }));
  }

  getCached(): CompanyResponse | null {
    return this.cached;
  }

  update(req: CompanyRequest): Observable<ApiResponse<CompanyResponse>> {
    return this.http.put<ApiResponse<CompanyResponse>>(this.url, req).pipe(
      tap(res => { this.cached = res.data ?? null; })
    );
  }
}
