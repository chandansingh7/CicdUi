import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ProductsComponent } from './products.component';
import { ProductDialogComponent } from './product-dialog.component';
import { BulkUploadPreviewModalComponent } from './bulk-upload-preview-modal.component';

const routes: Routes = [{ path: '', component: ProductsComponent }];

@NgModule({
  declarations: [ProductsComponent, ProductDialogComponent, BulkUploadPreviewModalComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class ProductsModule {}
