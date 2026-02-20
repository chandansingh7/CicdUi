import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductResponse } from '../../core/models/product.models';
import { CategoryResponse } from '../../core/models/category.models';
import { ProductDialogComponent } from './product-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  products: ProductResponse[] = [];
  categories: CategoryResponse[] = [];
  displayedColumns = ['name', 'sku', 'category', 'price', 'stock', 'status', 'actions'];
  totalElements = 0;
  pageSize = 10;
  loading = false;
  searchControl = new FormControl('');
  categoryFilter = new FormControl(null);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.loadProducts(0));
    this.categoryFilter.valueChanges.subscribe(() => this.loadProducts(0));
  }

  loadProducts(page = 0): void {
    this.loading = true;
    this.productService.getAll(
      this.searchControl.value || '',
      this.categoryFilter.value || undefined,
      page, this.pageSize
    ).subscribe({
      next: res => {
        this.products = res.data?.content || [];
        this.totalElements = res.data?.totalElements || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({ next: res => { this.categories = res.data || []; } });
  }

  onPage(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.loadProducts(e.pageIndex);
  }

  openDialog(product?: ProductResponse): void {
    const ref = this.dialog.open(ProductDialogComponent, {
      data: { product, categories: this.categories },
      width: '560px'
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const call = product
        ? this.productService.update(product.id, result)
        : this.productService.create(result);
      call.subscribe({
        next: () => { this.snackBar.open('Product saved!', 'Close', { duration: 3000 }); this.loadProducts(); },
        error: err => this.snackBar.open(err.error?.message || 'Error saving product', 'Close', { duration: 4000 })
      });
    });
  }

  delete(product: ProductResponse): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Product', message: `Delete "${product.name}"? This cannot be undone.`, confirmText: 'Delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({
        next: () => { this.snackBar.open('Product deleted', 'Close', { duration: 3000 }); this.loadProducts(); },
        error: err => this.snackBar.open(err.error?.message || 'Error deleting product', 'Close', { duration: 4000 })
      });
    });
  }

  get isAdmin(): boolean { return this.authService.isAdmin(); }
  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
}
