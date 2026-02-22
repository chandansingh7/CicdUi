import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompanyService } from '../../core/services/company.service';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyResponse, RECEIPT_PAPER_SIZES } from '../../core/models/company.models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  form: FormGroup;
  loading = false;
  saving = false;
  company: CompanyResponse | null = null;
  receiptPaperSizes = RECEIPT_PAPER_SIZES;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      logoUrl: [''],
      address: [''],
      phone: [''],
      email: [''],
      taxId: [''],
      website: [''],
      receiptHeaderText: [''],
      receiptFooterText: [''],
      receiptPaperSize: ['80mm']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/app/dashboard']);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.companyService.get(true).subscribe({
      next: res => {
        this.company = res.data ?? null;
        this.loading = false;
        if (this.company) {
          this.form.patchValue({
            name: this.company.name ?? '',
            logoUrl: this.company.logoUrl ?? '',
            address: this.company.address ?? '',
            phone: this.company.phone ?? '',
            email: this.company.email ?? '',
            taxId: this.company.taxId ?? '',
            website: this.company.website ?? '',
            receiptHeaderText: this.company.receiptHeaderText ?? '',
            receiptFooterText: this.company.receiptFooterText ?? '',
            receiptPaperSize: this.company.receiptPaperSize ?? '80mm'
          });
        } else {
          this.form.patchValue({ name: 'My Store', receiptPaperSize: '80mm' });
        }
      },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.companyService.update(this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Settings saved', 'Close', { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to save settings', 'Close', { duration: 3000 });
      }
    });
  }
}
