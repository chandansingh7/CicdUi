import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/auth.models';

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const pw      = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

export interface RoleCard {
  value: Role;
  label: string;
  icon: string;
  badge: string;
  badgeClass: string;
  description: string;
  permissions: string[];
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  error   = '';
  hidePassword = true;
  hideConfirm  = true;

  roleCards: RoleCard[] = [
    {
      value:       'CASHIER',
      label:       'Cashier',
      icon:        'point_of_sale',
      badge:       'Basic',
      badgeClass:  'badge-cashier',
      description: 'Ideal for front-desk staff who process sales day-to-day.',
      permissions: ['Process orders & checkout', 'View products & prices', 'View customer list', 'View own order history']
    },
    {
      value:       'MANAGER',
      label:       'Manager',
      icon:        'manage_accounts',
      badge:       'Standard',
      badgeClass:  'badge-manager',
      description: 'For supervisors who also manage stock and products.',
      permissions: ['Everything Cashier can do', 'Add / edit products', 'Manage categories', 'View inventory & reports', 'Manage customers']
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      username:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email:           ['', [Validators.required, Validators.email]],
      role:            ['CASHIER', Validators.required],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatch });

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/app/dashboard']);
    }
  }

  selectRole(role: Role): void {
    this.form.get('role')!.setValue(role);
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required'))  return 'This field is required';
    if (ctrl.hasError('minlength')) return `Minimum ${ctrl.errors?.['minlength'].requiredLength} characters`;
    if (ctrl.hasError('maxlength')) return `Maximum ${ctrl.errors?.['maxlength'].requiredLength} characters`;
    if (ctrl.hasError('email'))     return 'Enter a valid email address';
    return '';
  }

  get passwordMismatch(): boolean {
    return !!(this.form.hasError('passwordMismatch') && this.form.get('confirmPassword')?.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading = true;
    this.error   = '';

    const { confirmPassword, ...payload } = this.form.value;
    this.authService.register(payload).subscribe({
      next: res => {
        if (res.success && res.data) {
          localStorage.setItem('pos_token', res.data.token);
          localStorage.setItem('pos_user', JSON.stringify(res.data));
        }
        this.snack.open(`Welcome, ${payload.username}! Account created successfully.`, 'Close', {
          duration: 4000,
          panelClass: ['snack-success']
        });
        this.router.navigate(['/app/dashboard']);
      },
      error: err => {
        this.error   = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
        this.snack.open(this.error, 'Dismiss', {
          duration: 5000,
          panelClass: ['snack-error']
        });
      }
    });
  }
}
