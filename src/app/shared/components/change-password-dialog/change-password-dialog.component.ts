import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPwd     = group.get('newPassword')?.value;
  const confirmPwd = group.get('confirmPassword')?.value;
  return newPwd && confirmPwd && newPwd !== confirmPwd ? { mismatch: true } : null;
}

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent {
  form: FormGroup;
  loading = false;
  hideCurrentPwd  = true;
  hideNewPwd      = true;
  hideConfirmPwd  = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword:     ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatch }
    );
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading = true;
    this.authService.changePassword(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Password updated successfully!', 'Close', { duration: 4000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Failed to update password', 'Close', { duration: 4000 });
      }
    });
  }

  getError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.touched) return '';
    if (ctrl.hasError('required'))  return 'This field is required';
    if (ctrl.hasError('minlength')) return `Minimum ${ctrl.errors?.['minlength'].requiredLength} characters`;
    return '';
  }

  get confirmMismatch(): boolean {
    const confirm = this.form.get('confirmPassword');
    return !!confirm?.touched && !!this.form.hasError('mismatch');
  }
}
