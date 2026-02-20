import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
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
  orders: OrderResponse[] = [];
  displayedColumns = ['id', 'customer', 'cashier', 'items', 'total', 'payment', 'status', 'date', 'actions'];
  totalElements = 0;
  pageSize = 10;
  loading = false;
  expandedOrder: OrderResponse | null = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(page = 0): void {
    this.loading = true;
    this.orderService.getAll(page, this.pageSize).subscribe({
      next: res => { this.orders = res.data?.content || []; this.totalElements = res.data?.totalElements || 0; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onPage(e: PageEvent): void { this.pageSize = e.pageSize; this.load(e.pageIndex); }

  toggleExpand(order: OrderResponse): void {
    this.expandedOrder = this.expandedOrder?.id === order.id ? null : order;
  }

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

  statusClass(status: string): string {
    const map: Record<string, string> = { COMPLETED: 'chip-completed', PENDING: 'chip-pending', CANCELLED: 'chip-cancelled', REFUNDED: 'chip-cancelled' };
    return map[status] || '';
  }

  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
}
