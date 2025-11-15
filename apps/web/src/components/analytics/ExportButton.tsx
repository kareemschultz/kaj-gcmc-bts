"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, FileText, Image } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
	data?: Array<Record<string, unknown>>;
	chartRef?: React.RefObject<HTMLDivElement>;
	filename?: string;
	className?: string;
}

export function ExportButton({
	data,
	chartRef,
	filename = "export",
	className = "",
}: ExportButtonProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	const exportToCSV = () => {
		if (!data || data.length === 0) return;

		const headers = Object.keys(data[0]).join(",");
		const rows = data.map((row) => Object.values(row).join(",")).join("\n");
		const csv = `${headers}\n${rows}`;

		const blob = new Blob([csv], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${filename}.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
		setIsOpen(false);
	};

	const exportToPNG = async () => {
		if (!chartRef?.current) return;

		setIsExporting(true);
		try {
			const canvas = await html2canvas(chartRef.current);
			const url = canvas.toDataURL("image/png");
			const a = document.createElement("a");
			a.href = url;
			a.download = `${filename}.png`;
			a.click();
		} catch (error) {
			console.error("Error exporting to PNG:", error);
		} finally {
			setIsExporting(false);
			setIsOpen(false);
		}
	};

	const exportToPDF = async () => {
		if (!chartRef?.current) return;

		setIsExporting(true);
		try {
			const canvas = await html2canvas(chartRef.current);
			const imgData = canvas.toDataURL("image/png");
			const pdf = new jsPDF({
				orientation: canvas.width > canvas.height ? "landscape" : "portrait",
				unit: "px",
				format: [canvas.width, canvas.height],
			});

			pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
			pdf.save(`${filename}.pdf`);
		} catch (error) {
			console.error("Error exporting to PDF:", error);
		} finally {
			setIsExporting(false);
			setIsOpen(false);
		}
	};

	return (
		<div className={`relative ${className}`}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				disabled={isExporting}
				className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 font-medium text-sm shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
			>
				<Download className="h-4 w-4" />
				<span>{isExporting ? "Exporting..." : "Export"}</span>
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
					<div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-md border bg-popover p-2 shadow-lg">
						{data && data.length > 0 && (
							<button
								type="button"
								onClick={exportToCSV}
								className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
							>
								<FileText className="h-4 w-4" />
								<span>Export as CSV</span>
							</button>
						)}
						{chartRef && (
							<>
								<button
									type="button"
									onClick={exportToPNG}
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
								>
									<Image className="h-4 w-4" />
									<span>Export as PNG</span>
								</button>
								<button
									type="button"
									onClick={exportToPDF}
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
								>
									<FileText className="h-4 w-4" />
									<span>Export as PDF</span>
								</button>
							</>
						)}
					</div>
				</>
			)}
		</div>
	);
}
