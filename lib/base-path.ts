const BASE_PATH_RE = /^\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/;

/**
 * Return the one path prefix used by both Vinext and public runtime assets.
 * An empty value keeps the experience usable at the domain root.
 */
export function normalizeBasePath(value: string | undefined): string {
  const raw = value?.trim() ?? '';
  if (!raw || raw === '/') return '';

  const withoutTrailingSlash = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  const segments = withoutTrailingSlash.slice(1).split('/');
  if (
    !BASE_PATH_RE.test(withoutTrailingSlash) ||
    segments.some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error(
      'NEXT_PUBLIC_BASE_PATH must be a path such as /2advanced-attractor-homage',
    );
  }
  return withoutTrailingSlash;
}

export const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** Prefix a root-relative public asset or document link exactly once. */
export function withBasePath(path: string, prefix = basePath): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;

  const normalizedPrefix = normalizeBasePath(prefix);
  const pathname = path.split(/[?#]/, 1)[0];
  if (
    !normalizedPrefix ||
    pathname === normalizedPrefix ||
    pathname.startsWith(`${normalizedPrefix}/`)
  )
    return path;
  return `${normalizedPrefix}${path}`;
}
