/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    // Required in Next 14 for instrumentation.ts (runs ensureSchema once at startup)
    instrumentationHook: true,
  },
};

export default config;
