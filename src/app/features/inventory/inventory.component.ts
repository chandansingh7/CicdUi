import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../../core/services/inventory.service';
import { InventoryResponse } from '../../core/models/inventory.models';
import { InventoryDialogComponent } from './inventory-dialog.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  inventory: InventoryResponse[] = [];
  lowStockItems: InventoryResponse[] = [];
  displayedColumns = ['productName', 'sku', 'quantity', 'threshold', 'status', 'updatedAt', 'actions'];
  loading = false;

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.inventoryService.getAll().subscribe({
      next: res => {
        this.inventory = res.data || [];
        this.lowStockItems = this.inventory.filter(i => i.stockStatus !== 'IN_STOCK');
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = { IN_STOCK: 'chip-in-stock', LOW_STOCK: 'chip-low-stock', OUT_OF_STOCK: 'chip-out-of-stock' };
    return map[status] || '';
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

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
}
