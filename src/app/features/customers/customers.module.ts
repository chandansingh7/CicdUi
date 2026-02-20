import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CustomersComponent } from './customers.component';
import { CustomerDialogComponent } from './customer-dialog.component';

const routes: Routes = [{ path: '', component: CustomersComponent }];

@NgModule({
  declarations: [CustomersComponent, CustomerDialogComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class CustomersModule {}
