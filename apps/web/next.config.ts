import type { NextConfig } from "next";

// Bundle analyzer (run with ANALYZE=true bun run build)
const withBundleAnalyzer =
	process.env.ANALYZE === "true"
		? require("@next/bundle-analyzer")({ enabled: true })
		: (config: NextConfig) => config;

const nextConfig: NextConfig = {
	typedRoutes: true,
	// reactCompiler: true,  // Disabled due to dependency issues
	// Enable standalone output for Docker deployment
	output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
	// Skip TypeScript errors during build (we use `bun check-types` for that)
	typescript: {
		ignoreBuildErrors: true,
	},

	// Performance optimizations
	compress: true,

	// Image optimization
	images: {
		formats: ["image/avif", "image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},

	// Comprehensive security headers and caching
	async headers() {
		const isProduction = process.env.NODE_ENV === "production";
		return [
			{
				source: "/:path*",
				headers: [
					// Basic security headers
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					// HSTS for production
					...(isProduction
						? [
								{
									key: "Strict-Transport-Security",
									value: "max-age=31536000; includeSubDomains; preload",
								},
							]
						: []),
					// Permissions Policy (Feature Policy)
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=(), payment=()",
					},
					// Content Security Policy
					{
						key: "Content-Security-Policy",
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
							"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
							"font-src 'self' https://fonts.gstatic.com",
							"img-src 'self' data: https: blob:",
							"connect-src 'self' ws: wss:",
							"frame-ancestors 'self'",
							"base-uri 'self'",
							"form-action 'self'",
						].join("; "),
					},
				],
			},
			{
				source: "/static/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
			{
				source: "/_next/static/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
			{
				source: "/_next/image/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},

	// Webpack optimizations
	webpack: (config, { isServer }) => {
		// Production optimizations
		if (!isServer) {
			config.optimization = {
				...config.optimization,
				splitChunks: {
					chunks: "all",
					cacheGroups: {
						default: false,
						vendors: false,
						// Vendor chunk for stable dependencies
						vendor: {
							name: "vendor",
							chunks: "all",
							test: /node_modules/,
							priority: 20,
						},
						// Common chunk for shared code
						common: {
							name: "common",
							minChunks: 2,
							chunks: "all",
							priority: 10,
							reuseExistingChunk: true,
							enforce: true,
						},
						// Recharts in separate chunk (large library)
						recharts: {
							name: "recharts",
							test: /[\\/]node_modules[\\/](recharts)[\\/]/,
							chunks: "all",
							priority: 30,
						},
					},
				},
			};
		}
		return config;
	},

	// Performance budgets (experimental)
	experimental: {
		// Enable optimizeCss for production builds
		optimizeCss: true,
	},

	// Turbopack configuration (Next.js 16+ requires this when webpack config is present)
	turbopack: {
		resolveAlias: {
			// Keep the webpack chunk splitting configuration but let Turbopack handle it
		},
	},
};

export default withBundleAnalyzer(nextConfig);
