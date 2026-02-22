import { Pipe, PipeTransform } from '@angular/core';
import { resolveProductImageUrl } from '../../core/utils/product-image.util';

/**
 * Resolves product image URLs to the current API base (dev or prod).
 * Use in templates: [src]="product.imageUrl | productImageUrl"
 */
@Pipe({ name: 'productImageUrl' })
export class ProductImageUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string | null {
    return resolveProductImageUrl(url);
  }
}
