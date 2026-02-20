import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { InventoryService } from '../../core/services/inventory.service';
import { AuthService } from '../../core/services/auth.service';
import { InventoryResponse } from '../../core/models/inventory.models';
import { InventoryDialogComponent } from './inventory-dialog.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<InventoryResponse>();
  lowStockItems: InventoryResponse[] = [];

  displayedColumns = ['productName', 'sku', 'quantity', 'threshold', 'status', 'updatedAt', 'updatedBy', 'actions'];

  @ViewChild(MatSort) sort!: MatSort;

  loading = false;

  filters = new FormGroup({
    productName: new FormControl(''),
    sku:         new FormControl(''),
    quantity:    new FormControl(''),
    threshold:   new FormControl(''),
    status:      new FormControl(''),
    updatedAt:   new FormControl(''),
    updatedBy:   new FormControl(''),
  });

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.load();
    this.filters.valueChanges.pipe(debounceTime(200)).subscribe(() => this.applyColumnFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (row: InventoryResponse, filter: string) => {
      const f = JSON.parse(filter);
      return [
        this.contains(row.productName, f.productName),
        this.contains(row.productSku, f.sku),
        this.contains(row.quantity?.toString(), f.quantity),
        this.contains(row.lowStockThreshold?.toString(), f.threshold),
        this.contains(row.stockStatus, f.status),
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
      productName: v.productName || '',
      sku:         v.sku         || '',
      quantity:    v.quantity    || '',
      threshold:   v.threshold   || '',
      status:      v.status      || '',
      updatedAt:   v.updatedAt   || '',
      updatedBy:   v.updatedBy   || '',
    });
  }

  load(): void {
    this.loading = true;
    this.inventoryService.getAll().subscribe({
      next: res => {
        const all = res.data || [];
        this.dataSource.data = all;
        this.lowStockItems   = all.filter(i => i.stockStatus !== 'IN_STOCK');
        this.loading = false;
        this.applyColumnFilters();
      },
      error: () => { this.loading = false; }
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      IN_STOCK: 'chip-in-stock', LOW_STOCK: 'chip-low-stock', OUT_OF_STOCK: 'chip-out-of-stock'
    };
    return map[status] || '';
  }

  statusLabel(status: string): string { return status.replace(/_/g, ' '); }

  openUpdateDialog(item: InventoryResponse): void {
    this.dialog.open(InventoryDialogComponent, { data: item, width: '420px' })
      .afterClosed().subscribe(result => {
        if (!result) return;
        this.inventoryService.update(item.productId, result).subscribe({
          next: () => { this.snackBar.open('Stock updated!', 'Close', { duration: 3000 }); this.load(); },
          error: err => this.snackBar.open(err.error?.message || 'Error', 'Close', { duration: 4000 })
        });
      });
  }

  clearFilters(): void { this.filters.reset(); }

  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
  get hasActiveFilters(): boolean { return Object.values(this.filters.value).some(v => !!v); }
}
