import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CategoryResponse } from '../../core/models/category.models';
import { ProductResponse } from '../../core/models/product.models';

export interface ProductDialogData {
  product?: ProductResponse;
  categories: CategoryResponse[];
}

@Component({
  selector: 'app-product-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Edit' : 'New' }} Product</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name *</mat-label>
          <input matInput formControlName="name">
          <mat-error>Name is required</mat-error>
        </mat-form-field>
        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>SKU</mat-label>
            <input matInput formControlName="sku">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Barcode</mat-label>
            <input matInput formControlName="barcode">
          </mat-form-field>
        </div>
        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Price *</mat-label>
            <input matInput type="number" formControlName="price" min="0.01">
            <span matPrefix>$&nbsp;</span>
            <mat-error>Valid price required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId">
              <mat-option [value]="null">— None —</mat-option>
              <mat-option *ngFor="let c of data.categories" [value]="c.id">{{ c.name }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>{{ data.product ? 'Current Stock' : 'Initial Stock' }}</mat-label>
            <input matInput type="number" formControlName="initialStock" min="0">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Low Stock Threshold</mat-label>
            <input matInput type="number" formControlName="lowStockThreshold" min="0">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Image URL</mat-label>
          <input matInput formControlName="imageUrl">
        </mat-form-field>
        <mat-checkbox formControlName="active">Active</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 480px; padding-top: 8px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }`]
})
export class ProductDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData
  ) {}

  ngOnInit(): void {
    const p = this.data.product;
    this.form = this.fb.group({
      name: [p?.name || '', Validators.required],
      sku: [p?.sku || ''],
      barcode: [p?.barcode || ''],
      price: [p?.price || '', [Validators.required, Validators.min(0.01)]],
      categoryId: [p?.categoryId || null],
      imageUrl: [p?.imageUrl || ''],
      active: [p?.active !== undefined ? p.active : true],
      initialStock: [p?.quantity || 0, Validators.min(0)],
      lowStockThreshold: [10, Validators.min(0)]
    });
  }

  save(): void {
    if (this.form.valid) this.dialogRef.close(this.form.value);
  }
}
