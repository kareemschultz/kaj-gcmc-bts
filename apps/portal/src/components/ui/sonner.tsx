"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
					success:
						"group-[.toaster]:bg-chart-2 group-[.toaster]:text-white group-[.toaster]:border-chart-2",
					error:
						"group-[.toaster]:bg-destructive group-[.toaster]:text-white group-[.toaster]:border-destructive",
					warning:
						"group-[.toaster]:bg-chart-4 group-[.toaster]:text-white group-[.toaster]:border-chart-4",
					info: "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground group-[.toaster]:border-primary",
				},
			}}
			style={
				{
					"--normal-bg": "hsl(var(--background))",
					"--normal-text": "hsl(var(--foreground))",
					"--normal-border": "hsl(var(--border))",
					"--success-bg": "hsl(var(--chart-2))",
					"--success-text": "white",
					"--success-border": "hsl(var(--chart-2))",
					"--error-bg": "hsl(var(--destructive))",
					"--error-text": "white",
					"--error-border": "hsl(var(--destructive))",
					"--warning-bg": "hsl(var(--chart-4))",
					"--warning-text": "white",
					"--warning-border": "hsl(var(--chart-4))",
					"--info-bg": "hsl(var(--primary))",
					"--info-text": "hsl(var(--primary-foreground))",
					"--info-border": "hsl(var(--primary))",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
