import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryResponse } from '../../core/models/category.models';
import { CategoryDialogComponent } from './category-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html'
})
export class CategoriesComponent implements OnInit {
  categories: CategoryResponse[] = [];
  displayedColumns = ['name', 'description', 'actions'];
  loading = false;

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: res => { this.categories = res.data || []; this.loading = false; },
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
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Category', message: `Delete "${category.name}"?`, confirmText: 'Delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.categoryService.delete(category.id).subscribe({
        next: () => { this.snackBar.open('Deleted', 'Close', { duration: 3000 }); this.load(); },
        error: err => this.snackBar.open(err.error?.message || 'Error', 'Close', { duration: 4000 })
      });
    });
  }

  get isAdmin(): boolean { return this.authService.isAdmin(); }
  get isAdminOrManager(): boolean { return this.authService.isAdminOrManager(); }
}
