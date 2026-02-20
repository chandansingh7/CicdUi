import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PosComponent } from './pos.component';

const routes: Routes = [{ path: '', component: PosComponent }];

@NgModule({
  declarations: [PosComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class PosModule {}
