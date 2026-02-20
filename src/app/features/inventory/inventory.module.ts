import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { InventoryComponent } from './inventory.component';
import { InventoryDialogComponent } from './inventory-dialog.component';

const routes: Routes = [{ path: '', component: InventoryComponent }];

@NgModule({
  declarations: [InventoryComponent, InventoryDialogComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class InventoryModule {}
