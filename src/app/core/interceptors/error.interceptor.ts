import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

/** Client-side error codes for network-level failures (no backend response). */
const CLIENT_ERRORS: Record<number, { code: string; message: string }> = {
  0:   { code: 'NW001', message: 'Service is temporarily unavailable. Please try again in a moment.' },
  408: { code: 'NW002', message: 'Request timed out. Please check your connection and try again.' },
  401: { code: 'AU003', message: 'Session expired. Please log in again.' },
  403: { code: 'AU004', message: 'Access denied: you do not have permission to perform this action.' },
  404: { code: 'GN001', message: 'The requested resource was not found.' },
  500: { code: 'SV001', message: 'An unexpected server error occurred. Please try again.' },
  503: { code: 'NW001', message: 'Service is temporarily unavailable. Please try again in a moment.' },
};

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const { code, message } = this.resolveError(error);

        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
          // Show message briefly before redirect
          this.showError(code, message, 3000);
        } else {
          this.showError(code, message, 5000);
        }

        return throwError(() => error);
      })
    );
  }

  private resolveError(error: HttpErrorResponse): { code: string; message: string } {
    // status === 0 → browser could not reach the server (backend down / network issue)
    if (error.status === 0) {
      return CLIENT_ERRORS[0];
    }

    // Try to read the structured error from the backend response body
    const body = error.error;
    if (body && body.errorCode && body.message) {
      return { code: body.errorCode as string, message: body.message as string };
    }

    // Fall back to known HTTP status mappings
    if (CLIENT_ERRORS[error.status]) {
      return CLIENT_ERRORS[error.status];
    }

    // Generic fallback
    return { code: 'SV001', message: 'An unexpected error occurred. Please try again.' };
  }

  private showError(code: string, message: string, duration: number): void {
    this.snackBar.open(`[${code}] ${message}`, 'Close', {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
