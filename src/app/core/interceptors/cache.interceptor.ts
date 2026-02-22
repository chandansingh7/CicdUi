import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiresAt: number;
}

/**
 * Default TTLs per URL segment (milliseconds).
 * Longer TTL for data that changes rarely; shorter for live transactional data.
 */
const TTL_MAP: { pattern: RegExp; ttl: number }[] = [
  { pattern: /\/stats$/,      ttl: 60_000  }, // stats — 60 s
  { pattern: /\/categories/,  ttl: 120_000 }, // categories change rarely
  { pattern: /\/customers/,   ttl: 30_000  },
  { pattern: /\/products/,    ttl: 30_000  },
  { pattern: /\/inventory/,   ttl: 30_000  },
  { pattern: /\/orders/,      ttl: 20_000  }, // orders change more often
  { pattern: /\/users/,       ttl: 60_000  },
  { pattern: /\/reports/,     ttl: 60_000  },
];

const DEFAULT_TTL = 30_000;

/** URL prefixes that should NEVER be cached (auth, images, actuator). */
const SKIP_CACHE = ['/api/auth', '/api/images', '/actuator'];

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      this.invalidateForUrl(req.url);
      return next.handle(req);
    }

    // Skip cache for auth / image / health endpoints
    if (SKIP_CACHE.some(prefix => req.url.includes(prefix))) {
      return next.handle(req);
    }

    const cacheKey = req.urlWithParams;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return of(cached.response.clone());
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse && event.status === 200) {
          const ttl = this.resolveTtl(req.url);
          this.cache.set(cacheKey, {
            response: event.clone(),
            expiresAt: Date.now() + ttl,
          });
        }
      })
    );
  }

  /**
   * Invalidate all cache entries whose URL shares the same resource path
   * as the mutating request (POST / PUT / PATCH / DELETE).
   * e.g. DELETE /api/products/5 clears all /api/products/* entries.
   */
  private invalidateForUrl(url: string): void {
    // Extract the resource base: /api/products, /api/orders, etc.
    const base = url.replace(/\/\d+.*$/, '');
    for (const key of this.cache.keys()) {
      if (key.includes(base)) {
        this.cache.delete(key);
      }
    }
  }

  private resolveTtl(url: string): number {
    for (const { pattern, ttl } of TTL_MAP) {
      if (pattern.test(url)) return ttl;
    }
    return DEFAULT_TTL;
  }
}
