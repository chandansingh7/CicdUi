import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { Role } from '../../../core/models/auth.models';

export interface EditUserDialogData {
  user: UserResponse;
  adminMode: boolean;   // true = admin editing any user; false = self-service (email only)
}

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;

  roles: { value: Role; label: string }[] = [
    { value: 'ADMIN',   label: 'Admin'   },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'CASHIER', label: 'Cashier' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: EditUserDialogData
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: [this.data.user.email, [Validators.required, Validators.email]],
      ...(this.data.adminMode ? {
        role:   [this.data.user.role,   Validators.required],
        active: [this.data.user.active],
      } : {})
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading = true;
    const call$ = this.data.adminMode
      ? this.userService.adminUpdate(this.data.user.id, {
          email:  this.form.value.email,
          role:   this.form.value.role,
          active: this.form.value.active,
        })
      : this.userService.updateMe({ email: this.form.value.email });

    call$.subscribe({
      next: res => {
        this.loading = false;
        this.snackBar.open('User updated successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close(res.data);
      },
      error: err => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Update failed', 'Close', { duration: 4000 });
      }
    });
  }

  getEmailError(): string {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required')) return 'Email is required';
    if (ctrl.hasError('email'))    return 'Invalid email format';
    return '';
  }
}
