import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/**/*.ts",
	sourcemap: true,
	dts: false, // Disable due to complex Prisma types - tRPC uses AppRouter type instead
});
