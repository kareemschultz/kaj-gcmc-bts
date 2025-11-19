module.exports = {
	baseUrl: "http://localhost:3001",
	tests: {
		outputDir: "./test-results/testzeus-hercules",
		screenshotDir: "./test-results/testzeus-hercules/screenshots",
		videoDir: "./test-results/testzeus-hercules/videos",
	},
	browser: {
		headless: false,
		viewport: { width: 1920, height: 1080 },
		recordVideo: true,
		slowMo: 250,
	},
	authentication: {
		email: "admin@gcmc-kaj.com",
		password: "AdminPassword123",
	},
	timeout: 30000,
	parallel: 1,
};
