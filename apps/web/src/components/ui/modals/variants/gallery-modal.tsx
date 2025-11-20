"use client";

import {
	ChevronLeft,
	ChevronRight,
	Download,
	RotateCw,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import React, { memo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ModalConfig } from "../modal-context";

interface GalleryModalProps {
	modal: ModalConfig;
	onClose: () => void;
}

interface GalleryItem {
	id: string;
	src: string;
	alt?: string;
	title?: string;
	description?: string;
	type?: "image" | "document";
	downloadUrl?: string;
}

export const GalleryModal = memo(function GalleryModal({
	modal,
	onClose,
}: GalleryModalProps) {
	const { props = {} } = modal;
	const {
		items = [] as GalleryItem[],
		initialIndex = 0,
		showThumbnails = true,
		allowDownload = true,
		allowZoom = true,
		allowRotate = true,
	} = props;

	const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
	const [zoom, setZoom] = React.useState(1);
	const [rotation, setRotation] = React.useState(0);
	const [isDragging, setIsDragging] = React.useState(false);
	const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
	const [imagePosition, setImagePosition] = React.useState({ x: 0, y: 0 });

	const currentItem = items[currentIndex];

	const goToPrevious = useCallback(() => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
		setZoom(1);
		setRotation(0);
		setImagePosition({ x: 0, y: 0 });
	}, [items.length]);

	const goToNext = useCallback(() => {
		setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
		setZoom(1);
		setRotation(0);
		setImagePosition({ x: 0, y: 0 });
	}, [items.length]);

	const handleZoomIn = useCallback(() => {
		if (allowZoom) {
			setZoom((prev) => Math.min(prev + 0.5, 3));
		}
	}, [allowZoom]);

	const handleZoomOut = useCallback(() => {
		if (allowZoom) {
			setZoom((prev) => Math.max(prev - 0.5, 0.5));
		}
	}, [allowZoom]);

	const handleRotate = useCallback(() => {
		if (allowRotate) {
			setRotation((prev) => (prev + 90) % 360);
		}
	}, [allowRotate]);

	const handleDownload = useCallback(async () => {
		if (!allowDownload || !currentItem) return;

		try {
			const url = currentItem.downloadUrl || currentItem.src;
			const response = await fetch(url);
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = currentItem.title || `image-${currentIndex + 1}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			window.URL.revokeObjectURL(downloadUrl);
		} catch (error) {
			console.error("Error downloading file:", error);
		}
	}, [allowDownload, currentItem, currentIndex]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			switch (event.key) {
				case "ArrowLeft":
					event.preventDefault();
					goToPrevious();
					break;
				case "ArrowRight":
					event.preventDefault();
					goToNext();
					break;
				case "+":
				case "=":
					event.preventDefault();
					handleZoomIn();
					break;
				case "-":
					event.preventDefault();
					handleZoomOut();
					break;
				case "r":
				case "R":
					event.preventDefault();
					handleRotate();
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [goToPrevious, goToNext, handleZoomIn, handleZoomOut, handleRotate]);

	// Mouse drag for panning when zoomed
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (zoom > 1) {
				setIsDragging(true);
				setDragStart({
					x: e.clientX - imagePosition.x,
					y: e.clientY - imagePosition.y,
				});
			}
		},
		[zoom, imagePosition],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isDragging) {
				setImagePosition({
					x: e.clientX - dragStart.x,
					y: e.clientY - dragStart.y,
				});
			}
		},
		[isDragging, dragStart],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	if (!currentItem) {
		return (
			<div className="p-6 text-center">
				<p className="text-muted-foreground">No items to display</p>
			</div>
		);
	}

	return (
		<div className="relative h-full min-h-[80vh] bg-black text-white">
			{/* Header */}
			<div className="absolute top-0 right-0 left-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
				<div className="flex items-center justify-between">
					<div className="flex-1">
						{currentItem.title && (
							<h3 className="font-semibold text-lg">{currentItem.title}</h3>
						)}
						{currentItem.description && (
							<p className="mt-1 text-gray-300 text-sm">
								{currentItem.description}
							</p>
						)}
					</div>

					<div className="flex items-center gap-2">
						<span className="text-gray-300 text-sm">
							{currentIndex + 1} of {items.length}
						</span>
					</div>
				</div>
			</div>

			{/* Main image container */}
			<div
				className="absolute inset-0 flex items-center justify-center overflow-hidden"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				style={{
					cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
				}}
			>
				<img
					src={currentItem.src}
					alt={currentItem.alt || ""}
					className="max-h-full max-w-full select-none object-contain"
					style={{
						transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
						transition: isDragging ? "none" : "transform 0.3s ease",
					}}
					draggable={false}
				/>
			</div>

			{/* Navigation arrows */}
			{items.length > 1 && (
				<>
					<button
						type="button"
						onClick={goToPrevious}
						className="-translate-y-1/2 absolute top-1/2 left-4 z-10 rounded-full bg-black/50 p-2 transition-colors hover:bg-black/70"
						aria-label="Previous image"
					>
						<ChevronLeft className="h-6 w-6" />
					</button>

					<button
						type="button"
						onClick={goToNext}
						className="-translate-y-1/2 absolute top-1/2 right-4 z-10 rounded-full bg-black/50 p-2 transition-colors hover:bg-black/70"
						aria-label="Next image"
					>
						<ChevronRight className="h-6 w-6" />
					</button>
				</>
			)}

			{/* Controls */}
			<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
				{allowZoom && (
					<>
						<button
							type="button"
							onClick={handleZoomOut}
							disabled={zoom <= 0.5}
							className="rounded-full bg-black/50 p-2 transition-colors hover:bg-black/70 disabled:opacity-50"
							aria-label="Zoom out"
						>
							<ZoomOut className="h-5 w-5" />
						</button>
						<button
							type="button"
							onClick={handleZoomIn}
							disabled={zoom >= 3}
							className="rounded-full bg-black/50 p-2 transition-colors hover:bg-black/70 disabled:opacity-50"
							aria-label="Zoom in"
						>
							<ZoomIn className="h-5 w-5" />
						</button>
					</>
				)}

				{allowRotate && (
					<button
						type="button"
						onClick={handleRotate}
						className="rounded-full bg-black/50 p-2 transition-colors hover:bg-black/70"
						aria-label="Rotate"
					>
						<RotateCw className="h-5 w-5" />
					</button>
				)}

				{allowDownload && (
					<button
						type="button"
						onClick={handleDownload}
						className="rounded-full bg-black/50 p-2 transition-colors hover:bg-black/70"
						aria-label="Download"
					>
						<Download className="h-5 w-5" />
					</button>
				)}

				<button
					type="button"
					onClick={onClose}
					className="rounded-full bg-black/50 p-2 transition-colors hover:bg-black/70"
					aria-label="Close"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{/* Thumbnails */}
			{showThumbnails && items.length > 1 && (
				<div className="-translate-x-1/2 absolute bottom-4 left-1/2 z-10">
					<div className="flex gap-2 rounded-lg bg-black/50 p-2 backdrop-blur-sm">
						{items.map((item, index) => (
							<button
								key={item.id}
								type="button"
								onClick={() => {
									setCurrentIndex(index);
									setZoom(1);
									setRotation(0);
									setImagePosition({ x: 0, y: 0 });
								}}
								className={cn(
									"h-12 w-12 overflow-hidden rounded border-2 transition-colors",
									index === currentIndex
										? "border-white"
										: "border-gray-500 hover:border-gray-300",
								)}
							>
								<img
									src={item.src}
									alt={item.alt || ""}
									className="h-full w-full object-cover"
								/>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
});
