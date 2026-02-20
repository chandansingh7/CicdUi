import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { CustomerResponse } from '../../core/models/customer.models';
import { CustomerDialogComponent } from './customer-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit {
  customers: CustomerResponse[] = [];
  displayedColumns = ['name', 'email', 'phone', 'createdAt', 'actions'];
  totalElements = 0;
  pageSize = 10;
  loading = false;
  searchControl = new FormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.load(0));
  }

  load(page = 0): void {
    this.loading = true;
    this.customerService.getAll(this.searchControl.value || '', page, this.pageSize).subscribe({
      next: res => { this.customers = res.data?.content || []; this.totalElements = res.data?.totalElements || 0; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onPage(e: PageEvent): void { this.pageSize = e.pageSize; this.load(e.pageIndex); }

  openDialog(customer?: CustomerResponse): void {
    const ref = this.dialog.open(CustomerDialogComponent, { data: customer || null, width: '440px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const call = customer ? this.customerService.update(customer.id, result) : this.customerService.create(result);
      call.subscribe({
        next: () => { this.snackBar.open('Customer saved!', 'Close', { duration: 3000 }); this.load(); },
        error: err => this.snackBar.open(err.error?.message || 'Error', 'Close', { duration: 4000 })
      });
    });
  }

  delete(customer: CustomerResponse): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Customer', message: `Delete "${customer.name}"?`, confirmText: 'Delete' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.customerService.delete(customer.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.load(); },
        error: err => this.snackBar.open(err.error?.message || 'Error', 'Close', { duration: 4000 })
      });
    });
  }

  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
}
