/**
 * Optimized Analytics Components
 *
 * These components use Next.js dynamic imports to code-split heavy chart libraries (Recharts).
 * This reduces initial bundle size and improves page load performance.
 *
 * Usage:
 * Instead of:
 *   import { BarChartComponent } from '@/components/analytics/BarChartComponent';
 *
 * Use:
 *   import { BarChartComponent } from '@/components/analytics/optimized';
 *
 * Benefits:
 * - Reduced initial bundle size
 * - Faster page load
 * - Charts only loaded when needed
 * - Automatic loading states with skeleton UI
 * - No SSR for charts (client-side only)
 */

export { DateRangePicker } from "../DateRangePicker";
export { ExportButton } from "../ExportButton";
// Re-export non-chart components that don't need optimization
export { KPICard } from "../KPICard";
export { TrendIndicator } from "../TrendIndicator";
export { BarChartComponent } from "./BarChartOptimized";
export { LineChartComponent } from "./LineChartOptimized";
export { PieChartComponent } from "./PieChartOptimized";
