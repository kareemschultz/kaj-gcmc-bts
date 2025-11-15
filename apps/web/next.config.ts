import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	// Enable standalone output for Docker deployment
	output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
	// Skip TypeScript errors during build (we use `bun check-types` for that)
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
