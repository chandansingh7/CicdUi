import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  features = [
    { icon: 'point_of_sale',  title: 'Fast Checkout',       desc: 'Barcode scanning, cart management and instant order processing for your cashiers.' },
    { icon: 'inventory_2',    title: 'Inventory Control',   desc: 'Real-time stock tracking with low-stock alerts so you never run out of top sellers.' },
    { icon: 'people',         title: 'Customer Management', desc: 'Build customer profiles, track purchase history and grow loyalty.' },
    { icon: 'bar_chart',      title: 'Sales Reports',       desc: 'Daily and monthly revenue reports with top-product rankings at a glance.' },
    { icon: 'manage_accounts',title: 'Role-Based Access',   desc: 'Admin, Manager and Cashier roles keep every team member in the right place.' },
    { icon: 'cloud_done',     title: 'Cloud Powered',       desc: 'Runs on Azure — always available, automatically backed up, no servers to manage.' },
  ];

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/app/dashboard']);
    }
  }
}
