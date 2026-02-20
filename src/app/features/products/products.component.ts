import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup } from '@angular/forms';
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
  dataSource = new MatTableDataSource<ProductResponse>();
  categories: CategoryResponse[] = [];
  brokenImages = new Set<number>();

  displayedColumns = ['image', 'name', 'sku', 'category', 'price', 'stock', 'status', 'updatedAt', 'actions'];

  totalElements = 0;
  pageSize = 10;
  loading = false;

  searchControl  = new FormControl('');
  categoryFilter = new FormControl(null);

  filters = new FormGroup({
    name:      new FormControl(''),
    sku:       new FormControl(''),
    category:  new FormControl(''),
    price:     new FormControl(''),
    stock:     new FormControl(''),
    status:    new FormControl(''),
    updatedAt: new FormControl(''),
  });

  // ── Custom sort ──────────────────────────────────────────────────────────────
  sortCol = '';
  sortDir: 'asc' | 'desc' = 'asc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.loadCategories();
    this.loadProducts();
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.loadProducts(0));
    this.categoryFilter.valueChanges.subscribe(() => this.loadProducts(0));
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
      const va = this.sortValue(a);
      const vb = this.sortValue(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
  }

  private sortValue(item: ProductResponse): any {
    switch (this.sortCol) {
      case 'category':  return (item.categoryName ?? '').toLowerCase();
      case 'stock':     return item.quantity ?? 0;
      case 'status':    return item.active ? 1 : 0;
      case 'price':     return item.price ?? 0;
      case 'updatedAt': return item.updatedAt ?? '';
      default:          return ((item as any)[this.sortCol] ?? '').toString().toLowerCase();
    }
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (row: ProductResponse, filter: string) => {
      const f = JSON.parse(filter);
      return [
        this.contains(row.name, f.name),
        this.contains(row.sku, f.sku),
        this.contains(row.categoryName, f.category),
        this.contains(row.price?.toString(), f.price),
        this.contains(row.quantity?.toString(), f.stock),
        this.contains(row.active ? 'active' : 'inactive', f.status),
        this.contains(row.updatedAt, f.updatedAt),
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
      sku:       v.sku       || '',
      category:  v.category  || '',
      price:     v.price     || '',
      stock:     v.stock     || '',
      status:    v.status    || '',
      updatedAt: v.updatedAt || '',
    });
  }

  loadProducts(page = 0): void {
    this.loading = true;
    this.productService.getAll(
      this.searchControl.value || '',
      this.categoryFilter.value || undefined,
      page, this.pageSize
    ).subscribe({
      next: res => {
        this.brokenImages.clear();
        this.dataSource.data = res.data?.content || [];
        this.totalElements   = res.data?.totalElements || 0;
        this.loading = false;
        this.applyColumnFilters();
        this.applySort();
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
      data: { product, categories: this.categories }, width: '580px'
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const { imageFile, ...productData } = result;
      const save$ = product
        ? this.productService.update(product.id, productData)
        : this.productService.create(productData);
      save$.subscribe({
        next: (res) => {
          const savedId = res.data?.id ?? product?.id;
          if (imageFile && savedId) {
            this.productService.uploadImage(savedId, imageFile).subscribe({
              next: () => { this.snackBar.open('Product saved with image!', 'Close', { duration: 3000 }); this.loadProducts(); },
              error: () => { this.snackBar.open('Product saved — image upload failed', 'Close', { duration: 4000 }); this.loadProducts(); }
            });
          } else {
            this.snackBar.open('Product saved!', 'Close', { duration: 3000 });
            this.loadProducts();
          }
        },
        error: err => this.snackBar.open(err.error?.message || 'Error saving product', 'Close', { duration: 4000 })
      });
    });
  }

  toggleActive(product: ProductResponse): void {
    const action = product.active ? 'Deactivate' : 'Activate';
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: `${action} Product`, message: `${action} "${product.name}"?`, confirmText: action }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const req = { ...product, active: !product.active, categoryId: product.categoryId,
        initialStock: product.quantity, lowStockThreshold: 10 };
      this.productService.update(product.id, req).subscribe({
        next: () => { this.snackBar.open(`Product ${action.toLowerCase()}d`, 'Close', { duration: 3000 }); this.loadProducts(); },
        error: err => this.snackBar.open(err.error?.message || 'Error', 'Close', { duration: 4000 })
      });
    });
  }

  delete(product: ProductResponse): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Product', message: `Delete "${product.name}"?`, confirmText: 'Delete' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({
        next: () => { this.snackBar.open('Product deleted', 'Close', { duration: 3000 }); this.loadProducts(); },
        error: err => this.snackBar.open(err.error?.message || 'Error deleting product', 'Close', { duration: 4000 })
      });
    });
  }

  onImageError(productId: number): void { this.brokenImages.add(productId); }
  hasImage(p: ProductResponse): boolean { return !!p.imageUrl && !this.brokenImages.has(p.id); }

  clearFilters(): void {
    this.filters.reset();
    this.searchControl.reset();
    this.categoryFilter.reset();
  }

  get isAdmin(): boolean { return this.authService.isAdmin(); }
  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
  get hasActiveFilters(): boolean { return Object.values(this.filters.value).some(v => !!v); }
}
