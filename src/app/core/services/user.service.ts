import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { Role } from '../models/auth.models';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  email: string;
}

export interface AdminUpdateUserRequest {
  email: string;
  role: Role;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<UserResponse[]>> {
    return this.http.get<ApiResponse<UserResponse[]>>(this.base);
  }

  getMe(): Observable<ApiResponse<UserResponse>> {
    return this.http.get<ApiResponse<UserResponse>>(`${this.base}/me`);
  }

  updateMe(request: UpdateProfileRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.base}/me`, request);
  }

  adminUpdate(id: number, request: AdminUpdateUserRequest): Observable<ApiResponse<UserResponse>> {
    return this.http.put<ApiResponse<UserResponse>>(`${this.base}/${id}`, request);
  }

  toggleActive(id: number): Observable<ApiResponse<UserResponse>> {
    return this.http.patch<ApiResponse<UserResponse>>(`${this.base}/${id}/toggle-active`, {});
  }
}
