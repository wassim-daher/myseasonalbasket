import type { NextConfig } from 'next';

const config: NextConfig = {
  // The site always lives under a language prefix (/en or /ar).
  async redirects() {
    return [{ source: '/', destination: '/en', permanent: false }];
  },
  poweredByHeader: false,
};

export default config;
