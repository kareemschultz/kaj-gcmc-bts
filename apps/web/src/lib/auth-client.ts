import type { auth } from "@GCMC-KAJ/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
	basePath: "/api/auth",
	plugins: [inferAdditionalFields<typeof auth>()],
	fetchOptions: {
		credentials: "include",
		onRequest: (options) => {
			// Convert JSON data to form data for Better Auth compatibility
			if (options.body && typeof options.body === 'string') {
				try {
					const data = JSON.parse(options.body);
					const formData = new URLSearchParams();
					for (const [key, value] of Object.entries(data)) {
						formData.append(key, String(value));
					}
					options.body = formData.toString();
					options.headers = {
						...options.headers,
						'Content-Type': 'application/x-www-form-urlencoded',
					};
				} catch (e) {
					// Keep original body if JSON parsing fails
				}
			}
			return options;
		},
	},
});
