import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryResponse } from '../../core/models/category.models';
import { CategoryDialogComponent } from './category-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  dataSource = new MatTableDataSource<CategoryResponse>();

  displayedColumns = ['name', 'description', 'updatedAt', 'updatedBy', 'actions'];
  filterColumns    = this.displayedColumns.map(c => 'f-' + c);

  loading = false;

  filters = new FormGroup({
    name:      new FormControl(''),
    description: new FormControl(''),
    updatedAt: new FormControl(''),
    updatedBy: new FormControl(''),
  });

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.load();
    this.filters.valueChanges.pipe(debounceTime(200)).subscribe(() => this.applyColumnFilters());
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (row: CategoryResponse, filter: string) => {
      const f = JSON.parse(filter);
      return [
        this.contains(row.name, f.name),
        this.contains(row.description, f.description),
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
      name:        v.name        || '',
      description: v.description || '',
      updatedAt:   v.updatedAt   || '',
      updatedBy:   v.updatedBy   || '',
    });
  }

  load(): void {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: res => {
        this.dataSource.data = res.data || [];
        this.loading = false;
        this.applyColumnFilters();
      },
      error: () => { this.loading = false; }
    });
  }

  openDialog(category?: CategoryResponse): void {
    const ref = this.dialog.open(CategoryDialogComponent, { data: category || null, width: '420px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const call = category
        ? this.categoryService.update(category.id, result)
        : this.categoryService.create(result);
      call.subscribe({
        next: () => { this.snackBar.open('Category saved!', 'Close', { duration: 3000 }); this.load(); },
        error: err => this.snackBar.open(err.error?.message || 'Error', 'Close', { duration: 4000 })
      });
    });
  }

  delete(category: CategoryResponse): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Category', message: `Delete "${category.name}"?`, confirmText: 'Delete' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.categoryService.delete(category.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.load(); },
        error: err => this.snackBar.open(err.error?.message || 'Error', 'Close', { duration: 4000 })
      });
    });
  }

  clearFilters(): void { this.filters.reset(); }

  get isAdmin(): boolean { return this.authService.isAdmin(); }
  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
  get hasActiveFilters(): boolean { return Object.values(this.filters.value).some(v => !!v); }
}
