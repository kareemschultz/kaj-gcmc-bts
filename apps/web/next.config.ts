import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	// Enable standalone output for Docker deployment
	output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
};

export default nextConfig;
