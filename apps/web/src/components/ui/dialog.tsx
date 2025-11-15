import type * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="fixed inset-0 bg-black/50"
				onClick={() => onOpenChange(false)}
			/>
			<div className="relative z-50 mx-4 w-full max-w-lg rounded-lg bg-background shadow-lg">
				{children}
			</div>
		</div>
	);
}

function DialogContent({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("p-6", className)} {...props}>
			{children}
		</div>
	);
}

function DialogHeader({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("mb-4", className)} {...props}>
			{children}
		</div>
	);
}

function DialogTitle({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h2 className={cn("font-semibold text-lg", className)} {...props}>
			{children}
		</h2>
	);
}

function DialogDescription({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p className={cn("text-muted-foreground text-sm", className)} {...props}>
			{children}
		</p>
	);
}

function DialogFooter({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("mt-4 flex justify-end gap-2", className)} {...props}>
			{children}
		</div>
	);
}

export {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
};
