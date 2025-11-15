"use client";

import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useState } from "react";

interface DateRange {
	startDate: string;
	endDate: string;
}

interface DateRangePickerProps {
	value?: DateRange;
	onChange: (range: DateRange) => void;
	className?: string;
}

export function DateRangePicker({
	value,
	onChange,
	className = "",
}: DateRangePickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const presets = [
		{
			label: "Last 7 days",
			getValue: () => ({
				startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
				endDate: new Date().toISOString(),
			}),
		},
		{
			label: "Last 30 days",
			getValue: () => ({
				startDate: new Date(
					Date.now() - 30 * 24 * 60 * 60 * 1000,
				).toISOString(),
				endDate: new Date().toISOString(),
			}),
		},
		{
			label: "Last 90 days",
			getValue: () => ({
				startDate: new Date(
					Date.now() - 90 * 24 * 60 * 60 * 1000,
				).toISOString(),
				endDate: new Date().toISOString(),
			}),
		},
		{
			label: "Last 12 months",
			getValue: () => ({
				startDate: new Date(
					Date.now() - 365 * 24 * 60 * 60 * 1000,
				).toISOString(),
				endDate: new Date().toISOString(),
			}),
		},
	];

	return (
		<div className={`relative ${className}`}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 font-medium text-sm shadow-sm hover:bg-accent hover:text-accent-foreground"
			>
				<Calendar className="h-4 w-4" />
				<span>
					{value
						? `${format(new Date(value.startDate), "MMM d, yyyy")} - ${format(new Date(value.endDate), "MMM d, yyyy")}`
						: "Select date range"}
				</span>
			</button>

			{isOpen && (
				<>
					{/* biome-ignore lint/a11y/useSemanticElements: div is used as an invisible backdrop overlay, not an interactive button */}
					<div
						className="fixed inset-0 z-40"
						role="button"
						tabIndex={0}
						onClick={() => setIsOpen(false)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								setIsOpen(false);
							}
						}}
					/>
					<div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-md border bg-popover p-4 shadow-lg">
						<div className="space-y-2">
							<p className="font-medium text-sm">Quick presets</p>
							{presets.map((preset) => (
								<button
									key={preset.label}
									type="button"
									onClick={() => {
										onChange(preset.getValue());
										setIsOpen(false);
									}}
									className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
								>
									{preset.label}
								</button>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
