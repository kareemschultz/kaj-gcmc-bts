import { motion } from 'framer-motion';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { brandColors, dashboardColors } from '@/styles/brand';
import { TrendingUp, TrendingDown, Minus, MoreHorizontal } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  height?: number | string;
  loading?: boolean;
  error?: string;
  trend?: {
    value: number;
    positive: boolean;
    period?: string;
  };
  actions?: React.ReactNode;
  fullWidth?: boolean;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  height = 300,
  loading = false,
  error,
  trend,
  actions,
  fullWidth = false
}: ChartContainerProps) {
  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg border p-6 shadow-sm", className)}>
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              {subtitle && <div className="h-4 bg-gray-200 rounded w-32"></div>}
            </div>
            {trend && <div className="h-6 bg-gray-200 rounded w-20"></div>}
          </div>
          <div
            className="bg-gray-200 rounded"
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-white rounded-lg border p-6 shadow-sm", className)}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-500 font-medium">Failed to load chart</p>
          <p className="text-gray-400 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("bg-white rounded-lg border p-6 shadow-sm", className)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Trend Indicator */}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                trend.positive
                  ? "text-green-700 bg-green-100"
                  : "text-red-700 bg-red-100"
              )}
            >
              {trend.positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : trend.value === 0 ? (
                <Minus className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.period && (
                <span className="text-xs opacity-75">vs {trend.period}</span>
              )}
            </motion.div>
          )}

          {/* Actions */}
          {actions || (
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Content */}
      <div
        className={cn("w-full", fullWidth && "mx-0")}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// Predefined chart color schemes
export const chartColorSchemes = {
  default: [
    brandColors.primary[500],
    brandColors.accent[500],
    brandColors.warning[500],
    brandColors.danger[500],
    brandColors.gray[400],
    brandColors.primary[300],
    brandColors.accent[300]
  ],
  compliance: [
    '#22c55e', // Excellent
    '#84cc16', // Good
    '#f59e0b', // Fair
    '#ef4444'  // Poor
  ],
  revenue: [
    businessColors.revenue.positive,
    businessColors.revenue.neutral,
    businessColors.revenue.negative
  ],
  status: [
    dashboardColors.status.online,
    dashboardColors.status.processing,
    dashboardColors.status.pending,
    dashboardColors.status.offline
  ],
  gradient: [
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(107, 114, 128, 0.8)'
  ]
};

// Chart wrapper components for specific use cases
export function ComplianceChart({
  title,
  children,
  className,
  ...props
}: Omit<ChartContainerProps, 'children'> & { children: React.ReactNode }) {
  return (
    <ChartContainer
      title={title}
      className={cn("border-l-4 border-l-green-500", className)}
      {...props}
    >
      {children}
    </ChartContainer>
  );
}

export function RevenueChart({
  title,
  children,
  className,
  ...props
}: Omit<ChartContainerProps, 'children'> & { children: React.ReactNode }) {
  return (
    <ChartContainer
      title={title}
      className={cn("border-l-4 border-l-blue-500", className)}
      {...props}
    >
      {children}
    </ChartContainer>
  );
}

export function ActivityChart({
  title,
  children,
  className,
  ...props
}: Omit<ChartContainerProps, 'children'> & { children: React.ReactNode }) {
  return (
    <ChartContainer
      title={title}
      className={cn("border-l-4 border-l-purple-500", className)}
      {...props}
    >
      {children}
    </ChartContainer>
  );
}

// Chart grid layout component
export function ChartGrid({
  children,
  columns = 2,
  gap = 6,
  className
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gapClass = `gap-${gap}`;

  return (
    <div className={cn("grid", columnClasses[columns], gapClass, className)}>
      {children}
    </div>
  );
}

// Chart legend component
export function ChartLegend({
  items,
  className,
  orientation = 'horizontal'
}: {
  items: Array<{
    label: string;
    color: string;
    value?: string | number;
  }>;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <div className={cn(
      "flex gap-4",
      orientation === 'vertical' ? "flex-col" : "flex-wrap",
      className
    )}>
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-gray-600">{item.label}</span>
          {item.value && (
            <span className="text-sm font-medium text-gray-900">
              {item.value}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Chart tooltip customization
export const customTooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  padding: '12px',
  fontSize: '14px',
  fontWeight: '500'
};

export const customTooltipProps = {
  contentStyle: customTooltipStyle,
  labelStyle: {
    color: '#374151',
    fontWeight: '600',
    marginBottom: '4px'
  },
  itemStyle: {
    color: '#6b7280'
  }
};