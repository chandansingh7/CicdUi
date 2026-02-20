import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { OrderService } from '../../core/services/order.service';
import { ProductResponse } from '../../core/models/product.models';
import { CustomerResponse } from '../../core/models/customer.models';
import { OrderResponse, PaymentMethod } from '../../core/models/order.models';

interface CartItem {
  product: ProductResponse;
  quantity: number;
  subtotal: number;
}

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit {
  products: ProductResponse[] = [];
  customers: CustomerResponse[] = [];
  cart: CartItem[] = [];

  searchControl = new FormControl('');
  customerControl = new FormControl('');
  barcodeControl = new FormControl('');

  selectedCustomer: CustomerResponse | null = null;
  paymentMethod: PaymentMethod = 'CASH';
  discount = 0;
  loading = false;
  productsLoading = false;
  completedOrder: OrderResponse | null = null;

  paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'MOBILE_PAYMENT', label: 'Mobile Payment' }
  ];

  constructor(
    private productService: ProductService,
    private customerService: CustomerService,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCustomers();

    this.searchControl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(val => this.loadProducts(val || ''));

    this.barcodeControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(barcode => {
      if (barcode && barcode.length > 3) this.lookupBarcode(barcode);
    });
  }

  loadProducts(search = ''): void {
    this.productsLoading = true;
    this.productService.getAll(search, undefined, 0, 50).subscribe({
      next: res => { this.products = res.data?.content || []; this.productsLoading = false; },
      error: () => { this.productsLoading = false; }
    });
  }

  loadCustomers(): void {
    this.customerService.getAll('', 0, 100).subscribe({
      next: res => { this.customers = res.data?.content || []; }
    });
  }

  lookupBarcode(barcode: string): void {
    this.productService.getByBarcode(barcode).subscribe({
      next: res => {
        if (res.data) {
          this.addToCart(res.data);
          this.barcodeControl.setValue('', { emitEvent: false });
        }
      },
      error: () => this.snackBar.open('Product not found for barcode: ' + barcode, 'Close', { duration: 3000 })
    });
  }

  addToCart(product: ProductResponse): void {
    if (product.quantity <= 0) {
      this.snackBar.open(`${product.name} is out of stock`, 'Close', { duration: 3000 });
      return;
    }
    const existing = this.cart.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        this.snackBar.open('Cannot add more than available stock', 'Close', { duration: 3000 });
        return;
      }
      existing.quantity++;
      existing.subtotal = existing.quantity * existing.product.price;
    } else {
      this.cart.push({ product, quantity: 1, subtotal: product.price });
    }
  }

  updateQty(item: CartItem, qty: number): void {
    if (qty <= 0) { this.removeFromCart(item); return; }
    if (qty > item.product.quantity) {
      this.snackBar.open('Cannot exceed available stock', 'Close', { duration: 2000 });
      return;
    }
    item.quantity = qty;
    item.subtotal = qty * item.product.price;
  }

  removeFromCart(item: CartItem): void {
    this.cart = this.cart.filter(i => i !== item);
  }

  clearCart(): void {
    this.cart = [];
    this.selectedCustomer = null;
    this.discount = 0;
    this.paymentMethod = 'CASH';
    this.completedOrder = null;
  }

  get subtotal(): number {
    return this.cart.reduce((sum, i) => sum + i.subtotal, 0);
  }

  get tax(): number {
    return this.subtotal * 0.1;
  }

  get total(): number {
    return this.subtotal + this.tax - (this.discount || 0);
  }

  placeOrder(): void {
    if (!this.cart.length) {
      this.snackBar.open('Cart is empty', 'Close', { duration: 2000 });
      return;
    }
    this.loading = true;
    const request = {
      customerId: this.selectedCustomer?.id,
      items: this.cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
      paymentMethod: this.paymentMethod,
      discount: this.discount || 0
    };
    this.orderService.create(request).subscribe({
      next: res => {
        this.completedOrder = res.data;
        this.loading = false;
        this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
        this.cart = [];
        this.selectedCustomer = null;
        this.discount = 0;
      },
      error: err => {
        this.snackBar.open(err.error?.message || 'Failed to place order', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  newOrder(): void {
    this.completedOrder = null;
  }

  displayCustomer(customer: CustomerResponse | null): string {
    return customer?.name || '';
  }
}
