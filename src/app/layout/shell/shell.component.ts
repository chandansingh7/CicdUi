import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ChangePasswordDialogComponent } from '../../shared/components/change-password-dialog/change-password-dialog.component';
import { EditUserDialogComponent } from '../../shared/components/edit-user-dialog/edit-user-dialog.component';
import { UserService } from '../../core/services/user.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  managerPlus?: boolean;
}

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  username = '';
  role = '';
  sidenavOpened = true;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' },
    { label: 'POS / Cashier', icon: 'point_of_sale', route: '/app/pos' },
    { label: 'Orders', icon: 'receipt_long', route: '/app/orders' },
    { label: 'Products', icon: 'inventory_2', route: '/app/products' },
    { label: 'Categories', icon: 'category', route: '/app/categories', managerPlus: true },
    { label: 'Customers', icon: 'people', route: '/app/customers' },
    { label: 'Inventory', icon: 'warehouse', route: '/app/inventory', managerPlus: true },
    { label: 'Reports', icon: 'bar_chart', route: '/app/reports', managerPlus: true },
    { label: 'Users', icon: 'manage_accounts', route: '/app/users', adminOnly: true },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.role = this.authService.getRole() || '';
  }

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => {
      if (item.adminOnly) return this.authService.isAdmin();
      if (item.managerPlus) return this.authService.isAdminOrManager();
      return true;
    });
  }

  openEditProfile(): void {
    this.userService.getMe().subscribe({
      next: res => {
        this.dialog.open(EditUserDialogComponent, {
          data: { user: res.data, adminMode: false },
          width: '440px',
          disableClose: true
        }).afterClosed().subscribe(updated => {
          if (updated) this.username = updated.email; // reflect change in sidebar
        });
      }
    });
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, { width: '440px', disableClose: true });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
