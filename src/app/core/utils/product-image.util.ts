import { environment } from '../../../environments/environment';

/**
 * Resolves a product image URL so it always uses the current API base.
 * - Relative paths like "/api/images/xxx" or "api/images/xxx" → prepend apiUrl.
 * - Full URLs containing "/api/images/" (e.g. from another host/port) → replace origin with apiUrl.
 * - Other URLs (e.g. Azure Blob) → returned unchanged.
 * Ensures images load in dev (localhost:8080) and prod regardless of what is stored in the DB.
 */
export function resolveProductImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }
  const trimmed = url.trim();
  const apiBase = environment.apiUrl.replace(/\/$/, '');
  const imagePath = '/api/images/';

  // Path-only (e.g. "/api/images/xxx" or "api/images/xxx")
  if (trimmed.startsWith('/api/') || trimmed.startsWith('api/')) {
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${apiBase}${path}`;
  }

  // Full URL containing /api/images/ → use current API origin
  if (trimmed.startsWith('http') && trimmed.includes(imagePath)) {
    try {
      const u = new URL(trimmed);
      return `${apiBase}${u.pathname}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}
