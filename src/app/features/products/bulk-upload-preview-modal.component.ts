import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../../core/services/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface BulkPreviewRow {
  rowIndex: number;
  name: string;
  sku: string;
  barcode: string;
  price: string;
  category: string;
  initialStock: string;
  lowStockThreshold: string;
  errors: string[];
}

export interface BulkUploadPreviewData {
  file: File;
  rows: BulkPreviewRow[];
  fileName: string;
}

@Component({
  selector: 'app-bulk-upload-preview-modal',
  templateUrl: './bulk-upload-preview-modal.component.html',
  styleUrls: ['./bulk-upload-preview-modal.component.scss']
})
export class BulkUploadPreviewModalComponent {
  displayedColumns = ['rowIndex', 'name', 'sku', 'price', 'category', 'initialStock', 'lowStockThreshold', 'errors'];
  uploading = false;

  get isValid(): boolean {
    return this.data.rows.length > 0 && this.data.rows.every(r => r.errors.length === 0);
  }

  get totalRows(): number {
    return this.data.rows.length;
  }

  get errorCount(): number {
    return this.data.rows.filter(r => r.errors.length > 0).length;
  }

  constructor(
    private dialogRef: MatDialogRef<BulkUploadPreviewModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BulkUploadPreviewData,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  upload(): void {
    if (!this.isValid) return;
    this.uploading = true;
    this.productService.bulkUpload(this.data.file).subscribe({
      next: res => {
        this.uploading = false;
        const d = res.data;
        if (d) {
          const msg = `Bulk upload: ${d.successCount} created, ${d.failCount} failed.`;
          this.snackBar.open(msg, 'Close', { duration: d.failCount ? 5000 : 3000 });
          if (d.errors?.length) {
            const details = d.errors.slice(0, 5).map(e => `Row ${e.row}: ${e.message}`).join('; ');
            this.snackBar.open(details, 'Close', { duration: 8000 });
          }
        }
        this.dialogRef.close(true);
      },
      error: () => {
        this.uploading = false;
        this.snackBar.open('Bulk upload failed', 'Close', { duration: 4000 });
      }
    });
  }
}
