import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { SharedModule } from '../../shared/shared.module';
import { UsersComponent } from './users.component';

const routes: Routes = [{ path: '', component: UsersComponent }];

@NgModule({
  declarations: [UsersComponent],
  imports: [SharedModule, MatRadioModule, RouterModule.forChild(routes)]
})
export class UsersModule {}
