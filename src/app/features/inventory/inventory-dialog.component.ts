import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InventoryResponse } from '../../core/models/inventory.models';

@Component({
  selector: 'app-inventory-dialog',
  template: `
    <h2 mat-dialog-title>Update Stock — {{ data.productName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:12px;min-width:360px;padding-top:8px">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Quantity *</mat-label>
          <input matInput type="number" formControlName="quantity" min="0">
          <mat-error>Must be 0 or more</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Low Stock Threshold *</mat-label>
          <input matInput type="number" formControlName="lowStockThreshold" min="0">
          <mat-error>Must be 0 or more</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Update</button>
    </mat-dialog-actions>
  `
})
export class InventoryDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InventoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InventoryResponse
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      quantity: [this.data.quantity, [Validators.required, Validators.min(0)]],
      lowStockThreshold: [this.data.lowStockThreshold, [Validators.required, Validators.min(0)]]
    });
  }

  save(): void { if (this.form.valid) this.dialogRef.close(this.form.value); }
}
