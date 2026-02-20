import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../core/services/report.service';
import { InventoryService } from '../../core/services/inventory.service';
import { SalesReportResponse } from '../../core/models/report.models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  dailyReport: SalesReportResponse | null = null;
  lowStockCount = 0;
  loading = true;
  today = new Date();
  topProductsColumns = ['rank', 'productName', 'unitsSold'];

  constructor(
    private reportService: ReportService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.reportService.getDailyReport().subscribe({
      next: res => { this.dailyReport = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.inventoryService.getLowStock().subscribe({
      next: res => { this.lowStockCount = res.data?.length || 0; }
    });
  }
}
