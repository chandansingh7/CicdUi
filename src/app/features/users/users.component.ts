import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/auth.models';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;
  successMessage = '';

  permissionRows = [
    { feature: 'POS / Cashier',    admin: true,  manager: true,  cashier: true  },
    { feature: 'Orders',           admin: true,  manager: true,  cashier: true  },
    { feature: 'Customers',        admin: true,  manager: true,  cashier: true  },
    { feature: 'Products',         admin: true,  manager: true,  cashier: false },
    { feature: 'Categories',       admin: true,  manager: true,  cashier: false },
    { feature: 'Inventory',        admin: true,  manager: true,  cashier: false },
    { feature: 'Reports',          admin: true,  manager: true,  cashier: false },
    { feature: 'User Management',  admin: true,  manager: false, cashier: false },
    { feature: 'Delete Records',   admin: true,  manager: false, cashier: false },
  ];

  roles: { value: Role; label: string; description: string }[] = [
    { value: 'ADMIN',    label: 'Admin',   description: 'Full access — manage users, products, reports, settings' },
    { value: 'MANAGER', label: 'Manager', description: 'Manage products, categories, inventory, view reports' },
    { value: 'CASHIER', label: 'Cashier', description: 'POS cashier screen and order processing only' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role:     ['CASHIER', Validators.required]
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading = true;
    this.successMessage = '';

    this.authService.register(this.form.value).subscribe({
      next: res => {
        this.loading = false;
        this.successMessage = `User "${res.data.username}" created successfully with role ${res.data.role}.`;
        this.form.reset({ role: 'CASHIER' });
        this.form.markAsUntouched();
        this.snackBar.open(this.successMessage, 'Close', { duration: 5000 });
      },
      error: err => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Failed to create user', 'Close', { duration: 4000 });
      }
    });
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required'))   return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    if (ctrl.hasError('minlength'))  return `Minimum ${ctrl.errors?.['minlength'].requiredLength} characters`;
    if (ctrl.hasError('maxlength'))  return `Maximum ${ctrl.errors?.['maxlength'].requiredLength} characters`;
    if (ctrl.hasError('email'))      return 'Invalid email format';
    return '';
  }
}
