import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BulkPreviewRow } from './bulk-upload-preview-modal.component';

@Component({
  selector: 'app-bulk-edit-row-dialog',
  templateUrl: './bulk-edit-row-dialog.component.html',
  styleUrls: ['./bulk-edit-row-dialog.component.scss']
})
export class BulkEditRowDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BulkEditRowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { row: BulkPreviewRow }
  ) {
    const r = data.row;
    this.form = this.fb.group({
      name: [r.name ?? '', [Validators.required]],
      sku: [r.sku ?? ''],
      barcode: [r.barcode ?? ''],
      price: [r.price ?? '', [Validators.required, Validators.min(0)]],
      category: [r.category ?? ''],
      initialStock: [r.initialStock ?? '0', [Validators.min(0)]],
      lowStockThreshold: [r.lowStockThreshold ?? '10', [Validators.min(0)]]
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const updated: BulkPreviewRow = {
      ...this.data.row,
      name: String(v.name ?? '').trim(),
      sku: String(v.sku ?? '').trim(),
      barcode: String(v.barcode ?? '').trim(),
      price: String(v.price ?? '').trim(),
      category: String(v.category ?? '').trim(),
      initialStock: String(v.initialStock ?? '').trim(),
      lowStockThreshold: String(v.lowStockThreshold ?? '').trim(),
      errors: []
    };
    this.dialogRef.close(updated);
  }
}
