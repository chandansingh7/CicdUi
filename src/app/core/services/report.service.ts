import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { SalesReportResponse } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private url = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) {}

  getDailyReport(date?: string): Observable<ApiResponse<SalesReportResponse>> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<ApiResponse<SalesReportResponse>>(`${this.url}/sales/daily`, { params });
  }

  getMonthlyReport(year?: number, month?: number): Observable<ApiResponse<SalesReportResponse>> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    if (month) params = params.set('month', month);
    return this.http.get<ApiResponse<SalesReportResponse>>(`${this.url}/sales/monthly`, { params });
  }

  downloadDailyExcel(date?: string): Observable<Blob> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get(`${this.url}/sales/daily/export`, { params, responseType: 'blob' });
  }

  downloadMonthlyExcel(year?: number, month?: number): Observable<Blob> {
    let params = new HttpParams();
    if (year != null) params = params.set('year', year);
    if (month != null) params = params.set('month', month);
    return this.http.get(`${this.url}/sales/monthly/export`, { params, responseType: 'blob' });
  }
}
