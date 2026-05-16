import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these security headers across all paths in your application
        source: '/(:path*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://public.tableau.com https://*.tableau.com;
              connect-src 'self' https://public.tableau.com https://*.tableau.com https://*.tiles.virtualearth.net;
              frame-src 'self' https://public.tableau.com https://*.tableau.com;
              img-src 'self' data: blob: https://public.tableau.com https://*.tableau.com;
              style-src 'self' 'unsafe-inline';
            `.replace(/\s{2,}/g, ' ').trim() // Strips clean linebreaks out for header values
          }
        ]
      }
    ];
  }
};

export default nextConfig;
