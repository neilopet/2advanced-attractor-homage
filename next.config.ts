import type { NextConfig } from 'next';
import { normalizeBasePath } from './lib/base-path.ts';

const isStaticBuild = process.env.BUILD_TARGET === 'static';

const nextConfig: NextConfig = {
  basePath: normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH),
  ...(isStaticBuild
    ? {
        output: 'export' as const,
        trailingSlash: false,
        // Vinext's export probe requests `/` before GitHub Pages adds the
        // repository prefix. This no-op opt-out lets that probe reach the
        // root route while the deployed `/repository/` URL keeps basePath.
        rewrites: () => [
          { source: '/', destination: '/', basePath: false as const },
        ],
      }
    : {}),
};

export default nextConfig;
