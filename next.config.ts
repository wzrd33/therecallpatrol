import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent browsers from MIME-sniffing a response away from the declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent the page from being embedded in iframes (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Control how much referrer info is sent
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down browser features we don't use
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Force HTTPS for 2 years once the browser has visited once
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Content Security Policy — allow fonts from Google, everything else same-origin
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires these for hydration
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
