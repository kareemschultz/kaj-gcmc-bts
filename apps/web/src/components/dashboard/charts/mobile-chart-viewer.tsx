"use client";

import {
	AnimatePresence,
	motion,
	PanInfo,
	useMotionValue,
	useTransform,
} from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	EyeOff,
	Grid3x3,
	Hand,
	List,
	Maximize2,
	Minimize2,
	Monitor,
	Move,
	RefreshCw,
	RotateCw,
	Share,
	Smartphone,
	Tablet,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import {
	type TouchEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	Brush,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mobile-specific chart configurations
export interface MobileChartConfig {
	id: string;
	title: string;
	type: "line" | "area" | "bar" | "pie" | "metric";
	data: any[];
	simplified: boolean;
	touchOptimized: boolean;
	swipeEnabled: boolean;
	zoomEnabled: boolean;
	orientation: "portrait" | "landscape" | "auto";
}

export interface TouchGesture {
	type: "swipe" | "pinch" | "tap" | "longPress";
	direction?: "left" | "right" | "up" | "down";
	scale?: number;
	position?: { x: number; y: number };
}

// Hook for detecting device type and orientation
function useDeviceInfo() {
	const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "desktop">(
		"desktop",
	);
	const [orientation, setOrientation] = useState<"portrait" | "landscape">(
		"landscape",
	);
	const [touchSupported, setTouchSupported] = useState(false);

	useEffect(() => {
		const checkDevice = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			if (width < 768) {
				setDeviceType("mobile");
			} else if (width < 1024) {
				setDeviceType("tablet");
			} else {
				setDeviceType("desktop");
			}

			setOrientation(width > height ? "landscape" : "portrait");
			setTouchSupported("ontouchstart" in window);
		};

		checkDevice();
		window.addEventListener("resize", checkDevice);
		window.addEventListener("orientationchange", checkDevice);

		return () => {
			window.removeEventListener("resize", checkDevice);
			window.removeEventListener("orientationchange", checkDevice);
		};
	}, []);

	return { deviceType, orientation, touchSupported };
}

// Touch gesture hook
function useTouchGestures(onGesture: (gesture: TouchGesture) => void) {
	const [isPressed, setIsPressed] = useState(false);
	const [startPos, setStartPos] = useState({ x: 0, y: 0 });
	const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
	const [startTime, setStartTime] = useState(0);
	const [touches, setTouches] = useState<Touch[]>([]);

	const handleTouchStart = useCallback((e: TouchEvent) => {
		const touch = e.touches[0];
		setIsPressed(true);
		setStartPos({ x: touch.clientX, y: touch.clientY });
		setCurrentPos({ x: touch.clientX, y: touch.clientY });
		setStartTime(Date.now());
		setTouches(Array.from(e.touches));
	}, []);

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			if (!isPressed) return;

			const touch = e.touches[0];
			setCurrentPos({ x: touch.clientX, y: touch.clientY });
			setTouches(Array.from(e.touches));

			// Handle pinch gesture
			if (e.touches.length === 2) {
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				const distance = Math.sqrt(
					(touch2.clientX - touch1.clientX) ** 2 +
						(touch2.clientY - touch1.clientY) ** 2,
				);
				// You can implement pinch zoom logic here
			}
		},
		[isPressed],
	);

	const handleTouchEnd = useCallback(() => {
		if (!isPressed) return;

		const deltaX = currentPos.x - startPos.x;
		const deltaY = currentPos.y - startPos.y;
		const deltaTime = Date.now() - startTime;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		// Long press detection
		if (deltaTime > 500 && distance < 10) {
			onGesture({
				type: "longPress",
				position: currentPos,
			});
		}
		// Swipe detection
		else if (distance > 50 && deltaTime < 500) {
			const angle = Math.atan2(deltaY, deltaX);
			const direction =
				angle > -Math.PI / 4 && angle <= Math.PI / 4
					? "right"
					: angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4
						? "down"
						: angle > (3 * Math.PI) / 4 || angle <= (-3 * Math.PI) / 4
							? "left"
							: "up";

			onGesture({
				type: "swipe",
				direction,
				position: startPos,
			});
		}
		// Tap detection
		else if (distance < 10 && deltaTime < 200) {
			onGesture({
				type: "tap",
				position: currentPos,
			});
		}

		setIsPressed(false);
		setTouches([]);
	}, [isPressed, currentPos, startPos, startTime, onGesture]);

	return {
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		isPressed,
		currentPos,
		startPos,
	};
}

// Mobile-optimized chart component
function MobileOptimizedChart({
	config,
	className,
	onGesture,
}: {
	config: MobileChartConfig;
	className?: string;
	onGesture?: (gesture: TouchGesture) => void;
}) {
	const { deviceType, orientation, touchSupported } = useDeviceInfo();
	const [zoom, setZoom] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [showDataLabels, setShowDataLabels] = useState(false);

	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const { handleTouchStart, handleTouchMove, handleTouchEnd } =
		useTouchGestures(onGesture || (() => {}));

	// Simplified data for mobile
	const simplifiedData = useMemo(() => {
		if (!config.simplified || deviceType !== "mobile") return config.data;

		// Reduce data points for mobile performance
		const step = Math.max(1, Math.floor(config.data.length / 10));
		return config.data.filter((_, index) => index % step === 0);
	}, [config.data, config.simplified, deviceType]);

	// Chart height based on device and orientation
	const chartHeight = useMemo(() => {
		if (deviceType === "mobile") {
			return orientation === "portrait" ? 200 : 150;
		}
		return deviceType === "tablet" ? 250 : 300;
	}, [deviceType, orientation]);

	// Custom tooltip for touch devices
	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					className={cn(
						"rounded-lg bg-black/80 p-3 text-white shadow-xl",
						"max-w-xs text-sm",
						touchSupported && "text-base", // Larger text for touch
					)}
				>
					<p className="mb-1 font-semibold">{label}</p>
					{payload.map((entry: any, index: number) => (
						<div key={index} className="flex items-center gap-2">
							<div
								className="h-3 w-3 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							<span>
								{entry.name}: {entry.value}
							</span>
						</div>
					))}
				</motion.div>
			);
		}
		return null;
	};

	const renderChart = () => {
		const commonProps = {
			data: simplifiedData,
			margin: touchSupported
				? { top: 5, right: 5, left: 5, bottom: 5 }
				: { top: 10, right: 30, left: 20, bottom: 5 },
		};

		switch (config.type) {
			case "line":
				return (
					<LineChart {...commonProps}>
						<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
						<XAxis
							dataKey="name"
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: touchSupported ? 14 : 12 }}
							interval={deviceType === "mobile" ? 1 : 0}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: touchSupported ? 14 : 12 }}
							width={touchSupported ? 60 : 50}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Line
							type="monotone"
							dataKey="value"
							stroke="#3B82F6"
							strokeWidth={touchSupported ? 3 : 2}
							dot={{
								fill: "#3B82F6",
								strokeWidth: 2,
								r: touchSupported ? 6 : 4,
							}}
							activeDot={{ r: touchSupported ? 8 : 6 }}
						/>
					</LineChart>
				);

			case "area":
				return (
					<AreaChart {...commonProps}>
						<defs>
							<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
						<XAxis
							dataKey="name"
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: touchSupported ? 14 : 12 }}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: touchSupported ? 14 : 12 }}
							width={touchSupported ? 60 : 50}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Area
							type="monotone"
							dataKey="value"
							stroke="#3B82F6"
							strokeWidth={touchSupported ? 3 : 2}
							fill="url(#colorValue)"
						/>
					</AreaChart>
				);

			case "bar":
				return (
					<BarChart {...commonProps}>
						<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
						<XAxis
							dataKey="name"
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: touchSupported ? 14 : 12 }}
							interval={deviceType === "mobile" ? 1 : 0}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fontSize: touchSupported ? 14 : 12 }}
							width={touchSupported ? 60 : 50}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Bar
							dataKey="value"
							fill="#3B82F6"
							radius={[4, 4, 0, 0]}
							minPointSize={touchSupported ? 30 : 20}
						/>
					</BarChart>
				);

			case "pie":
				return (
					<PieChart>
						<Pie
							data={simplifiedData}
							cx="50%"
							cy="50%"
							outerRadius={touchSupported ? 80 : 60}
							fill="#8884d8"
							dataKey="value"
							label={({ name, percent }) =>
								deviceType !== "mobile"
									? `${name} ${(percent * 100).toFixed(0)}%`
									: `${(percent * 100).toFixed(0)}%`
							}
						>
							{simplifiedData.map((entry, index) => {
								const colors = [
									"#3B82F6",
									"#10B981",
									"#F59E0B",
									"#EF4444",
									"#8B5CF6",
									"#06B6D4",
								];
								return (
									<Cell
										key={`cell-${index}`}
										fill={colors[index % colors.length]}
									/>
								);
							})}
						</Pie>
						<Tooltip content={<CustomTooltip />} />
					</PieChart>
				);

			default:
				return <div>Unsupported chart type</div>;
		}
	};

	return (
		<motion.div
			className={cn(
				"relative select-none",
				touchSupported && "cursor-grab active:cursor-grabbing",
				className,
			)}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			style={{
				scale: zoom,
				x,
				y,
			}}
			drag={config.swipeEnabled && touchSupported}
			dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
			whileTap={touchSupported ? { scale: 0.98 } : undefined}
		>
			<Card className={cn("overflow-hidden", touchSupported && "shadow-lg")}>
				<CardHeader className={cn("pb-2", deviceType === "mobile" && "pb-1")}>
					<div className="flex items-center justify-between">
						<CardTitle
							className={cn("text-base", deviceType === "mobile" && "text-sm")}
						>
							{config.title}
						</CardTitle>

						{touchSupported && (
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
									onTouchStart={(e) => e.stopPropagation()}
									onClick={() => setShowDataLabels(!showDataLabels)}
								>
									{showDataLabels ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
						)}
					</div>
				</CardHeader>

				<CardContent className={cn("p-4", deviceType === "mobile" && "p-2")}>
					<div style={{ height: chartHeight, width: "100%" }}>
						<ResponsiveContainer>{renderChart()}</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

// Chart carousel for mobile swiping
function MobileChartCarousel({
	charts,
	onChartChange,
}: {
	charts: MobileChartConfig[];
	onChartChange?: (index: number) => void;
}) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [direction, setDirection] = useState(0);
	const { deviceType, touchSupported } = useDeviceInfo();

	const slideVariants = {
		enter: (direction: number) => ({
			x: direction > 0 ? 1000 : -1000,
			opacity: 0,
		}),
		center: {
			zIndex: 1,
			x: 0,
			opacity: 1,
		},
		exit: (direction: number) => ({
			zIndex: 0,
			x: direction < 0 ? 1000 : -1000,
			opacity: 0,
		}),
	};

	const swipeConfidenceThreshold = 10000;
	const swipePower = (offset: number, velocity: number) => {
		return Math.abs(offset) * velocity;
	};

	const paginate = (newDirection: number) => {
		const newIndex = currentIndex + newDirection;
		if (newIndex >= 0 && newIndex < charts.length) {
			setDirection(newDirection);
			setCurrentIndex(newIndex);
			onChartChange?.(newIndex);
		}
	};

	const handleGesture = (gesture: TouchGesture) => {
		if (gesture.type === "swipe") {
			if (gesture.direction === "left") {
				paginate(1);
			} else if (gesture.direction === "right") {
				paginate(-1);
			}
		}
	};

	const currentChart = charts[currentIndex];

	return (
		<div className="relative">
			{/* Chart indicator dots */}
			{charts.length > 1 && (
				<div className="mb-4 flex justify-center gap-2">
					{charts.map((_, index) => (
						<button
							key={index}
							className={cn(
								"h-2 w-2 rounded-full transition-colors",
								index === currentIndex ? "bg-blue-600" : "bg-gray-300",
							)}
							onClick={() => {
								setDirection(index > currentIndex ? 1 : -1);
								setCurrentIndex(index);
								onChartChange?.(index);
							}}
						/>
					))}
				</div>
			)}

			{/* Chart container */}
			<div className="relative overflow-hidden">
				<AnimatePresence initial={false} custom={direction}>
					<motion.div
						key={currentIndex}
						custom={direction}
						variants={slideVariants}
						initial="enter"
						animate="center"
						exit="exit"
						transition={{
							x: { type: "spring", stiffness: 300, damping: 30 },
							opacity: { duration: 0.2 },
						}}
						drag={touchSupported ? "x" : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={1}
						onDragEnd={(e, { offset, velocity }) => {
							const swipe = swipePower(offset.x, velocity.x);

							if (swipe < -swipeConfidenceThreshold) {
								paginate(1);
							} else if (swipe > swipeConfidenceThreshold) {
								paginate(-1);
							}
						}}
						className="absolute w-full"
					>
						<MobileOptimizedChart
							config={currentChart}
							onGesture={handleGesture}
						/>
					</motion.div>
				</AnimatePresence>
			</div>

			{/* Navigation buttons for non-touch devices */}
			{!touchSupported && charts.length > 1 && (
				<>
					<Button
						variant="outline"
						size="sm"
						className="-translate-y-1/2 absolute top-1/2 left-2 transform"
						onClick={() => paginate(-1)}
						disabled={currentIndex === 0}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="-translate-y-1/2 absolute top-1/2 right-2 transform"
						onClick={() => paginate(1)}
						disabled={currentIndex === charts.length - 1}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</>
			)}

			{/* Chart info */}
			<div className="mt-4 text-center">
				<p className="text-muted-foreground text-sm">
					{currentIndex + 1} of {charts.length} charts
				</p>
				{touchSupported && (
					<p className="mt-1 text-muted-foreground text-xs">
						Swipe to navigate • Pinch to zoom • Long press for options
					</p>
				)}
			</div>
		</div>
	);
}

// Main mobile chart viewer component
export function MobileChartViewer({
	charts,
	initialIndex = 0,
	className,
}: {
	charts: MobileChartConfig[];
	initialIndex?: number;
	className?: string;
}) {
	const { deviceType, orientation, touchSupported } = useDeviceInfo();
	const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
	const [currentChart, setCurrentChart] = useState(initialIndex);

	// Generate sample charts if none provided
	const sampleCharts: MobileChartConfig[] = useMemo(
		() => [
			{
				id: "1",
				title: "Revenue Trend",
				type: "line",
				data: Array.from({ length: 12 }, (_, i) => ({
					name: [
						"Jan",
						"Feb",
						"Mar",
						"Apr",
						"May",
						"Jun",
						"Jul",
						"Aug",
						"Sep",
						"Oct",
						"Nov",
						"Dec",
					][i],
					value: Math.floor(Math.random() * 10000) + 5000,
				})),
				simplified: true,
				touchOptimized: true,
				swipeEnabled: true,
				zoomEnabled: true,
				orientation: "auto",
			},
			{
				id: "2",
				title: "Service Distribution",
				type: "pie",
				data: [
					{ name: "Tax Services", value: 4500 },
					{ name: "Compliance", value: 3200 },
					{ name: "Corporate", value: 2100 },
					{ name: "Immigration", value: 1800 },
				],
				simplified: true,
				touchOptimized: true,
				swipeEnabled: true,
				zoomEnabled: false,
				orientation: "auto",
			},
			{
				id: "3",
				title: "Monthly Performance",
				type: "bar",
				data: Array.from({ length: 6 }, (_, i) => ({
					name: `Q${i + 1}`,
					value: Math.floor(Math.random() * 100) + 50,
				})),
				simplified: true,
				touchOptimized: true,
				swipeEnabled: true,
				zoomEnabled: false,
				orientation: "auto",
			},
		],
		[],
	);

	const chartsToRender = charts.length > 0 ? charts : sampleCharts;

	return (
		<div className={cn("space-y-4", className)}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div
						className={cn(
							"rounded-lg p-2",
							deviceType === "mobile"
								? "bg-green-50 text-green-600"
								: deviceType === "tablet"
									? "bg-blue-50 text-blue-600"
									: "bg-purple-50 text-purple-600",
						)}
					>
						{deviceType === "mobile" ? (
							<Smartphone className="h-4 w-4" />
						) : deviceType === "tablet" ? (
							<Tablet className="h-4 w-4" />
						) : (
							<Monitor className="h-4 w-4" />
						)}
					</div>
					<div>
						<h2 className="font-semibold">Mobile Chart Viewer</h2>
						<p className="text-muted-foreground text-sm">
							{deviceType} • {orientation} •{" "}
							{touchSupported ? "Touch enabled" : "Mouse only"}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setViewMode(viewMode === "carousel" ? "grid" : "carousel")
						}
					>
						{viewMode === "carousel" ? (
							<Grid3x3 className="h-4 w-4" />
						) : (
							<List className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{viewMode === "carousel" ? (
				<MobileChartCarousel
					charts={chartsToRender}
					onChartChange={setCurrentChart}
				/>
			) : (
				<div
					className={cn(
						"grid gap-4",
						deviceType === "mobile"
							? "grid-cols-1"
							: deviceType === "tablet"
								? "grid-cols-2"
								: "grid-cols-3",
					)}
				>
					{chartsToRender.map((chart, index) => (
						<MobileOptimizedChart
							key={chart.id}
							config={chart}
							className={cn(index === currentChart && "ring-2 ring-blue-500")}
						/>
					))}
				</div>
			)}

			{/* Touch guidance for first-time users */}
			{touchSupported && deviceType === "mobile" && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1 }}
					className="rounded-lg border border-blue-200 bg-blue-50 p-4"
				>
					<div className="mb-2 flex items-center gap-2">
						<Hand className="h-5 w-5 text-blue-600" />
						<span className="font-medium text-blue-900">Touch Guide</span>
					</div>
					<ul className="space-y-1 text-blue-800 text-sm">
						<li>• Swipe left/right to navigate charts</li>
						<li>• Pinch to zoom in/out on data</li>
						<li>• Long press for chart options</li>
						<li>• Tap data points for details</li>
					</ul>
				</motion.div>
			)}
		</div>
	);
}
