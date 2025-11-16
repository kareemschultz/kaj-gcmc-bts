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

	// Caching headers for static assets
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
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
};

export default withBundleAnalyzer(nextConfig);
