import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { OrderResponse } from '../../core/models/order.models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  dataSource = new MatTableDataSource<OrderResponse>();
  displayedColumns = ['id', 'customer', 'cashier', 'items', 'total', 'payment', 'status', 'date', 'actions'];

  totalElements = 0;
  pageSize = 10;
  loading = false;
  expandedOrder: OrderResponse | null = null;

  filters = new FormGroup({
    id:       new FormControl(''),
    customer: new FormControl(''),
    cashier:  new FormControl(''),
    items:    new FormControl(''),
    total:    new FormControl(''),
    payment:  new FormControl(null),
    status:   new FormControl(null),
    date:     new FormControl(''),
  });

  sortCol = '';
  sortDir: 'asc' | 'desc' = 'asc';

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.load();
    this.filters.valueChanges.pipe(debounceTime(200)).subscribe(() => this.applyColumnFilters());
  }

  sortBy(col: string): void {
    this.sortDir = this.sortCol === col && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortCol = col;
    this.applySort();
  }

  sortIcon(col: string): string {
    if (this.sortCol !== col) return 'swap_vert';
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  private applySort(): void {
    if (!this.sortCol) return;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    this.dataSource.data = [...this.dataSource.data].sort((a, b) => {
      let va: any, vb: any;
      switch (this.sortCol) {
        case 'customer': va = a.customerName ?? 'Walk-in'; vb = b.customerName ?? 'Walk-in'; break;
        case 'cashier':  va = a.cashierUsername; vb = b.cashierUsername; break;
        case 'items':    va = a.items?.length ?? 0; vb = b.items?.length ?? 0; break;
        case 'payment':  va = a.paymentMethod; vb = b.paymentMethod; break;
        case 'date':     va = a.createdAt; vb = b.createdAt; break;
        default:         va = (a as any)[this.sortCol]; vb = (b as any)[this.sortCol];
      }
      va = (va ?? '').toString().toLowerCase();
      vb = (vb ?? '').toString().toLowerCase();
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (row: OrderResponse, filter: string) => {
      const f = JSON.parse(filter);
      return [
        this.contains(row.id?.toString(), f.id),
        this.contains(row.customerName || 'Walk-in', f.customer),
        this.contains(row.cashierUsername, f.cashier),
        this.contains(row.items?.length?.toString(), f.items),
        this.contains(row.total?.toString(), f.total),
        this.contains(row.paymentMethod, f.payment),
        this.contains(row.status, f.status),
        this.contains(row.createdAt, f.date),
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
      id:       v.id       || '',
      customer: v.customer || '',
      cashier:  v.cashier  || '',
      items:    v.items    || '',
      total:    v.total    || '',
      payment:  v.payment  || '',
      status:   v.status   || '',
      date:     v.date     || '',
    });
  }

  load(page = 0): void {
    this.loading = true;
    this.orderService.getAll(page, this.pageSize).subscribe({
      next: res => {
        this.dataSource.data = res.data?.content || [];
        this.totalElements   = res.data?.totalElements || 0;
        this.loading = false;
        this.applyColumnFilters();
        this.applySort();
      },
      error: () => { this.loading = false; }
    });
  }

  onPage(e: PageEvent): void { this.pageSize = e.pageSize; this.load(e.pageIndex); }
  toggleExpand(order: OrderResponse): void { this.expandedOrder = this.expandedOrder?.id === order.id ? null : order; }

  cancelOrder(order: OrderResponse): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cancel Order', message: `Cancel Order #${order.id}?`, confirmText: 'Cancel Order' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.orderService.cancel(order.id).subscribe({
        next: () => { this.snackBar.open('Order cancelled', 'Close', { duration: 3000 }); this.load(); },
        error: err => this.snackBar.open(err.error?.message || 'Error', 'Close', { duration: 4000 })
      });
    });
  }

  refundOrder(order: OrderResponse): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Refund Order', message: `Issue refund for Order #${order.id}?`, confirmText: 'Refund' }
    }).afterClosed().subscribe(() => {
      this.snackBar.open('Refund issued — feature coming soon', 'Close', { duration: 3000 });
    });
  }

  printReceipt(order: OrderResponse): void {
    this.snackBar.open(`Printing receipt for Order #${order.id} — coming soon`, 'Close', { duration: 3000 });
  }

  clearFilters(): void { this.filters.reset(); }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'chip-completed', PENDING: 'chip-pending',
      CANCELLED: 'chip-cancelled', REFUNDED: 'chip-cancelled'
    };
    return map[status] || '';
  }

  get isAdmin(): boolean { return this.authService.isAdmin(); }
  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
  get hasActiveFilters(): boolean { return Object.values(this.filters.value).some(v => !!v); }
}
