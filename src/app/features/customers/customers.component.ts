import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { CustomerResponse } from '../../core/models/customer.models';
import { CustomerDialogComponent } from './customer-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<CustomerResponse>();

  displayedColumns = ['name', 'email', 'phone', 'createdAt', 'updatedAt', 'updatedBy', 'actions'];

  @ViewChild(MatSort) sort!: MatSort;

  totalElements = 0;
  pageSize = 10;
  loading = false;
  searchControl = new FormControl('');

  filters = new FormGroup({
    name:      new FormControl(''),
    email:     new FormControl(''),
    phone:     new FormControl(''),
    createdAt: new FormControl(''),
    updatedAt: new FormControl(''),
    updatedBy: new FormControl(''),
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.load();
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.load(0));
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.filters.valueChanges.pipe(debounceTime(200)).subscribe(() => this.applyColumnFilters());
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (row: CustomerResponse, filter: string) => {
      const f = JSON.parse(filter);
      return [
        this.contains(row.name, f.name),
        this.contains(row.email, f.email),
        this.contains(row.phone, f.phone),
        this.contains(row.createdAt, f.createdAt),
        this.contains(row.updatedAt, f.updatedAt),
        this.contains(row.updatedBy, f.updatedBy),
      ].every(Boolean);
    };
  }

  private contains(value: string | null | undefined, filter: string): boolean {
    if (!filter) return true;
    return (value ?? '').toString().toLowerCase().includes(filter.toLowerCase());
  }

  private applyColumnFilters(): void {
    const v = this.filters.value;
    this.dataSource.filter = JSON.stringify({
      name:      v.name      || '',
      email:     v.email     || '',
      phone:     v.phone     || '',
      createdAt: v.createdAt || '',
      updatedAt: v.updatedAt || '',
      updatedBy: v.updatedBy || '',
    });
  }

  load(page = 0): void {
    this.loading = true;
    this.customerService.getAll(this.searchControl.value || '', page, this.pageSize).subscribe({
      next: res => {
        this.dataSource.data = res.data?.content || [];
        this.totalElements   = res.data?.totalElements || 0;
        this.loading = false;
        this.applyColumnFilters();
      },
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

  viewOrders(customer: CustomerResponse): void {
    this.snackBar.open(`Viewing orders for ${customer.name} — coming soon`, 'Close', { duration: 3000 });
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

  clearFilters(): void { this.filters.reset(); this.searchControl.reset(); }

  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
  get hasActiveFilters(): boolean { return Object.values(this.filters.value).some(v => !!v); }
}
