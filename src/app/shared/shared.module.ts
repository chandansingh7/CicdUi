import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { ChangePasswordDialogComponent } from './components/change-password-dialog/change-password-dialog.component';

const MATERIAL_MODULES = [
  MatTableModule, MatPaginatorModule, MatSortModule,
  MatInputModule, MatFormFieldModule, MatButtonModule,
  MatIconModule, MatCardModule, MatDialogModule,
  MatSnackBarModule, MatSelectModule, MatProgressSpinnerModule,
  MatChipsModule, MatTooltipModule, MatMenuModule,
  MatDividerModule, MatBadgeModule, MatDatepickerModule,
  MatNativeDateModule, MatCheckboxModule, MatAutocompleteModule
];

@NgModule({
  declarations: [ConfirmDialogComponent, ChangePasswordDialogComponent],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ...MATERIAL_MODULES],
  exports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ...MATERIAL_MODULES,
    ConfirmDialogComponent,
    ChangePasswordDialogComponent
  ]
})
export class SharedModule {}
