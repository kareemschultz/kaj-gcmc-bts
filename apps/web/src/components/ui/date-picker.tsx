"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
	date?: Date;
	onSelect: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
}

export function DatePicker({
	date,
	onSelect,
	placeholder = "Pick a date",
	disabled = false,
	className,
	variant = "outline",
	size = "default",
}: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={variant}
					size={size}
					className={cn(
						"justify-start text-left font-normal",
						!date && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? format(date, "PPP") : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					onSelect={onSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

interface DateRangePickerProps {
	from?: Date;
	to?: Date;
	onSelect: (range: { from?: Date; to?: Date }) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
}

export function DateRangePicker({
	from,
	to,
	onSelect,
	placeholder = "Pick a date range",
	disabled = false,
	className,
	variant = "outline",
	size = "default",
}: DateRangePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={variant}
					size={size}
					className={cn(
						"justify-start text-left font-normal",
						!from && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{from ? (
						to ? (
							<>
								{format(from, "LLL dd, y")} - {format(to, "LLL dd, y")}
							</>
						) : (
							format(from, "LLL dd, y")
						)
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					initialFocus
					mode="range"
					defaultMonth={from}
					selected={{ from, to }}
					onSelect={onSelect}
					numberOfMonths={2}
				/>
			</PopoverContent>
		</Popover>
	);
}

interface TimePickerProps {
	time?: Date;
	onSelect: (time: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
}

export function TimePicker({
	time,
	onSelect,
	placeholder = "Pick a time",
	disabled = false,
	className,
	variant = "outline",
	size = "default",
}: TimePickerProps) {
	const [isOpen, setIsOpen] = React.useState(false);

	const handleTimeSelect = (hours: number, minutes: number) => {
		// Use existing time if available, otherwise start with current date
		const baseTime = time || new Date();
		const newTime = new Date(baseTime);
		newTime.setHours(hours);
		newTime.setMinutes(minutes);
		newTime.setSeconds(0);
		newTime.setMilliseconds(0);
		onSelect(newTime);
		setIsOpen(false);
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant={variant}
					size={size}
					className={cn(
						"justify-start text-left font-normal",
						!time && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{time ? format(time, "HH:mm") : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="grid grid-cols-2 gap-1 p-3">
					<div className="space-y-1">
						<label className="font-medium text-xs">Hours</label>
						<div className="grid max-h-32 grid-cols-4 gap-1 overflow-y-auto">
							{Array.from({ length: 24 }, (_, i) => (
								<Button
									key={i}
									variant="ghost"
									size="sm"
									className="h-8"
									onClick={() => handleTimeSelect(i, time?.getMinutes() || 0)}
								>
									{i.toString().padStart(2, "0")}
								</Button>
							))}
						</div>
					</div>
					<div className="space-y-1">
						<label className="font-medium text-xs">Minutes</label>
						<div className="grid max-h-32 grid-cols-4 gap-1 overflow-y-auto">
							{Array.from({ length: 60 }, (_, i) => i % 15 === 0).map(
								(_, i) => {
									const minute = i * 15;
									return (
										<Button
											key={minute}
											variant="ghost"
											size="sm"
											className="h-8"
											onClick={() =>
												handleTimeSelect(time?.getHours() || 0, minute)
											}
										>
											{minute.toString().padStart(2, "0")}
										</Button>
									);
								},
							)}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

interface DateTimePickerProps {
	date?: Date;
	onSelect: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	variant?: "default" | "outline" | "ghost";
	size?: "default" | "sm" | "lg";
}

export function DateTimePicker({
	date,
	onSelect,
	placeholder = "Pick date and time",
	disabled = false,
	className,
	variant = "outline",
	size = "default",
}: DateTimePickerProps) {
	const [isOpen, setIsOpen] = React.useState(false);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			// Preserve time if it exists
			if (date) {
				selectedDate.setHours(date.getHours());
				selectedDate.setMinutes(date.getMinutes());
			}
			onSelect(selectedDate);
		} else {
			onSelect(undefined);
		}
	};

	const handleTimeSelect = (hours: number, minutes: number) => {
		// Always use existing date if available, fallback to today only if needed
		const baseDate = date || new Date();
		const newDate = new Date(baseDate);
		newDate.setHours(hours);
		newDate.setMinutes(minutes);
		newDate.setSeconds(0);
		newDate.setMilliseconds(0);
		onSelect(newDate);
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant={variant}
					size={size}
					className={cn(
						"justify-start text-left font-normal",
						!date && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? format(date, "PPP 'at' HH:mm") : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="border-b">
					<Calendar mode="single" selected={date} onSelect={handleDateSelect} />
				</div>
				<div className="grid grid-cols-2 gap-1 p-3">
					<div className="space-y-1">
						<label className="font-medium text-xs">Hours</label>
						<div className="grid max-h-24 grid-cols-4 gap-1 overflow-y-auto">
							{Array.from({ length: 24 }, (_, i) => (
								<Button
									key={i}
									variant="ghost"
									size="sm"
									className="h-8"
									onClick={() => handleTimeSelect(i, date?.getMinutes() || 0)}
								>
									{i.toString().padStart(2, "0")}
								</Button>
							))}
						</div>
					</div>
					<div className="space-y-1">
						<label className="font-medium text-xs">Minutes</label>
						<div className="grid max-h-24 grid-cols-4 gap-1 overflow-y-auto">
							{[0, 15, 30, 45].map((minute) => (
								<Button
									key={minute}
									variant="ghost"
									size="sm"
									className="h-8"
									onClick={() =>
										handleTimeSelect(date?.getHours() || 0, minute)
									}
								>
									{minute.toString().padStart(2, "0")}
								</Button>
							))}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
