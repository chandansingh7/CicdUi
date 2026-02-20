import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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
export class ProductsComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<ProductResponse>();
  categories: CategoryResponse[] = [];

  /** Tracks product IDs whose imageUrl returned a 404 / broken URL */
  brokenImages = new Set<number>();

  displayedColumns = ['image', 'name', 'sku', 'category', 'price', 'stock', 'status', 'updatedAt', 'updatedBy', 'actions'];

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
    updatedBy: new FormControl(''),
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.setupSortingAccessor();
    this.loadCategories();
    this.loadProducts();

    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => this.loadProducts(0));
    this.categoryFilter.valueChanges.subscribe(() => this.loadProducts(0));
    this.filters.valueChanges.pipe(debounceTime(200)).subscribe(() => this.applyColumnFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  private setupSortingAccessor(): void {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'category':  return item.categoryName ?? '';
        case 'stock':     return item.quantity ?? 0;
        case 'status':    return item.active ? 1 : 0;
        case 'updatedAt': return item.updatedAt ?? '';
        case 'updatedBy': return item.updatedBy ?? '';
        default:          return (item as any)[property] ?? '';
      }
    };
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
      name:      v.name      || '',
      sku:       v.sku       || '',
      category:  v.category  || '',
      price:     v.price     || '',
      stock:     v.stock     || '',
      status:    v.status    || '',
      updatedAt: v.updatedAt || '',
      updatedBy: v.updatedBy || '',
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
      width: '580px'
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
              next: () => {
                this.snackBar.open('Product saved with image!', 'Close', { duration: 3000 });
                this.loadProducts();
              },
              error: () => {
                this.snackBar.open('Product saved — image upload failed', 'Close', { duration: 4000 });
                this.loadProducts();
              }
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
      data: { title: 'Delete Product', message: `Delete "${product.name}"? This cannot be undone.`, confirmText: 'Delete' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({
        next: () => { this.snackBar.open('Product deleted', 'Close', { duration: 3000 }); this.loadProducts(); },
        error: err => this.snackBar.open(err.error?.message || 'Error deleting product', 'Close', { duration: 4000 })
      });
    });
  }

  onImageError(productId: number): void {
    this.brokenImages.add(productId);
  }

  hasImage(p: ProductResponse): boolean {
    return !!p.imageUrl && !this.brokenImages.has(p.id);
  }

  clearFilters(): void {
    this.filters.reset();
    this.searchControl.reset();
    this.categoryFilter.reset();
  }

  get isAdmin(): boolean { return this.authService.isAdmin(); }
  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
  get hasActiveFilters(): boolean { return Object.values(this.filters.value).some(v => !!v); }
}
