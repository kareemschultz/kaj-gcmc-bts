"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  lazy,
  Suspense,
  memo,
  forwardRef
} from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Zap,
  Database,
  Cpu,
  MemoryStick,
  Activity,
  Settings,
  Eye,
  EyeOff,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy-loaded chart components
const LazyInteractiveChart = lazy(() =>
  import('./interactive-chart-library').then(module => ({
    default: module.InteractiveChart
  }))
);

const LazyAgencyCharts = lazy(() =>
  import('./agency-compliance-charts').then(module => ({
    default: module.AgencyComplianceCharts
  }))
);

const LazyBusinessDashboard = lazy(() =>
  import('./business-intelligence-dashboard').then(module => ({
    default: module.BusinessIntelligenceDashboard
  }))
);

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number;
  dataLoadTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
  cacheHitRate: number;
}

export interface VirtualizationConfig {
  enabled: boolean;
  chunkSize: number;
  preloadChunks: number;
  recycleThreshold: number;
  cacheSize: number;
}

export interface LazyLoadConfig {
  threshold: number;
  rootMargin: string;
  triggerOnce: boolean;
  placeholder: React.ComponentType;
}

// Custom hooks for performance optimization
function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasBeenVisible, options]);

  return { isVisible, hasBeenVisible };
}

function useDataVirtualization<T>(
  data: T[],
  config: VirtualizationConfig
) {
  const [visibleData, setVisibleData] = useState<T[]>([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dataCache = useRef(new Map<number, T[]>());

  const totalChunks = Math.ceil(data.length / config.chunkSize);

  const loadChunk = useCallback(async (chunkIndex: number) => {
    if (dataCache.current.has(chunkIndex)) {
      return dataCache.current.get(chunkIndex)!;
    }

    setIsLoading(true);

    // Simulate async data loading
    await new Promise(resolve => setTimeout(resolve, 50));

    const start = chunkIndex * config.chunkSize;
    const end = start + config.chunkSize;
    const chunk = data.slice(start, end);

    // Cache management
    if (dataCache.current.size >= config.cacheSize) {
      const oldestKey = dataCache.current.keys().next().value;
      dataCache.current.delete(oldestKey);
    }

    dataCache.current.set(chunkIndex, chunk);
    setIsLoading(false);

    return chunk;
  }, [data, config.chunkSize, config.cacheSize]);

  const loadChunks = useCallback(async (startChunk: number, endChunk: number) => {
    const chunks = await Promise.all(
      Array.from({ length: endChunk - startChunk + 1 }, (_, i) =>
        loadChunk(startChunk + i)
      )
    );

    setVisibleData(chunks.flat());
  }, [loadChunk]);

  const navigateToChunk = useCallback((chunkIndex: number) => {
    if (chunkIndex < 0 || chunkIndex >= totalChunks) return;

    setCurrentChunk(chunkIndex);
    const startChunk = Math.max(0, chunkIndex - config.preloadChunks);
    const endChunk = Math.min(totalChunks - 1, chunkIndex + config.preloadChunks);

    loadChunks(startChunk, endChunk);
  }, [totalChunks, config.preloadChunks, loadChunks]);

  useEffect(() => {
    if (config.enabled && data.length > config.recycleThreshold) {
      navigateToChunk(0);
    } else {
      setVisibleData(data);
    }
  }, [data, config, navigateToChunk]);

  return {
    visibleData,
    currentChunk,
    totalChunks,
    isLoading,
    navigateToChunk,
    cacheHitRate: (dataCache.current.size / Math.max(1, totalChunks)) * 100
  };
}

function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataLoadTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    reRenderCount: 0,
    cacheHitRate: 0
  });

  const startTime = useRef<number>(0);
  const renderCount = useRef(0);

  const startTimer = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endTimer = useCallback((type: 'render' | 'data') => {
    const elapsed = performance.now() - startTime.current;

    setMetrics(prev => ({
      ...prev,
      [type === 'render' ? 'renderTime' : 'dataLoadTime']: elapsed,
      reRenderCount: type === 'render' ? prev.reRenderCount + 1 : prev.reRenderCount
    }));
  }, []);

  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
      }));
    }
  }, []);

  useEffect(() => {
    renderCount.current += 1;
    updateMemoryUsage();
  });

  return {
    metrics,
    startTimer,
    endTimer,
    updateMemoryUsage
  };
}

// Chart loading skeleton
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="space-y-3">
          <div className="flex justify-between items-end">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton
                key={i}
                className="w-8"
                style={{ height: Math.random() * 150 + 50 }}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Performance-optimized chart wrapper
const OptimizedChartWrapper = memo(
  forwardRef<
    HTMLDivElement,
    {
      children: React.ReactNode;
      title: string;
      loadingState?: boolean;
      error?: string;
      onRetry?: () => void;
    }
  >(({ children, title, loadingState, error, onRetry }, ref) => {
    const { metrics, startTimer, endTimer } = usePerformanceMonitor();

    useEffect(() => {
      startTimer();
      const timer = setTimeout(() => endTimer('render'), 0);
      return () => clearTimeout(timer);
    }, [startTimer, endTimer]);

    if (loadingState) {
      return <ChartSkeleton />;
    }

    if (error) {
      return (
        <Card ref={ref}>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-2">
              <Activity className="h-8 w-8" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Failed to load chart: {error}
            </p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div ref={ref} className="relative">
        {children}

        {/* Performance indicator */}
        <div className="absolute top-2 right-2 opacity-75">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              metrics.renderTime < 16 ? "bg-green-50 text-green-700" :
              metrics.renderTime < 33 ? "bg-yellow-50 text-yellow-700" :
              "bg-red-50 text-red-700"
            )}
          >
            {metrics.renderTime.toFixed(1)}ms
          </Badge>
        </div>
      </div>
    );
  })
);

OptimizedChartWrapper.displayName = 'OptimizedChartWrapper';

// Lazy chart component with intersection observer
function LazyChart({
  children,
  title,
  height = 300,
  config = {
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
    placeholder: ChartSkeleton
  }
}: {
  children: React.ReactNode;
  title: string;
  height?: number;
  config?: LazyLoadConfig;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { hasBeenVisible } = useIntersectionObserver(elementRef, {
    threshold: config.threshold,
    rootMargin: config.rootMargin
  });

  const [shouldLoad, setShouldLoad] = useState(!config.triggerOnce);

  useEffect(() => {
    if (hasBeenVisible && config.triggerOnce) {
      setShouldLoad(true);
    }
  }, [hasBeenVisible, config.triggerOnce]);

  const Placeholder = config.placeholder;

  return (
    <div ref={elementRef}>
      {shouldLoad || hasBeenVisible ? (
        <Suspense fallback={<Placeholder height={height} />}>
          <OptimizedChartWrapper title={title}>
            {children}
          </OptimizedChartWrapper>
        </Suspense>
      ) : (
        <Placeholder height={height} />
      )}
    </div>
  );
}

// Virtual data grid for large datasets
function VirtualDataChart({
  data,
  renderChart,
  config = {
    enabled: true,
    chunkSize: 100,
    preloadChunks: 1,
    recycleThreshold: 1000,
    cacheSize: 10
  }
}: {
  data: any[];
  renderChart: (data: any[]) => React.ReactNode;
  config?: VirtualizationConfig;
}) {
  const {
    visibleData,
    currentChunk,
    totalChunks,
    isLoading,
    navigateToChunk,
    cacheHitRate
  } = useDataVirtualization(data, config);

  const shouldVirtualize = config.enabled && data.length > config.recycleThreshold;

  return (
    <div className="space-y-4">
      {shouldVirtualize && (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              <span>Chunk {currentChunk + 1} of {totalChunks}</span>
            </div>
            <div className="flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              <span>Cache: {cacheHitRate.toFixed(1)}%</span>
            </div>
            {isLoading && (
              <div className="flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToChunk(currentChunk - 1)}
              disabled={currentChunk === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToChunk(currentChunk + 1)}
              disabled={currentChunk === totalChunks - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        {isLoading && shouldVirtualize && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
        {renderChart(shouldVirtualize ? visibleData : data)}
      </div>

      {shouldVirtualize && (
        <div className="text-center">
          <Progress
            value={((currentChunk + 1) / totalChunks) * 100}
            className="w-full max-w-xs mx-auto"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Showing {visibleData.length} of {data.length} data points
          </p>
        </div>
      )}
    </div>
  );
}

// Performance monitoring dashboard
function PerformanceMonitor({
  metrics,
  onToggle,
  visible = false
}: {
  metrics: PerformanceMetrics;
  onToggle: () => void;
  visible?: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: visible ? 'auto' : 40,
        opacity: visible ? 1 : 0.8
      }}
      className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-2 cursor-pointer bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 space-y-3 min-w-[250px]"
          >
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Render Time:</span>
                  <span className="font-mono">{metrics.renderTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Load:</span>
                  <span className="font-mono">{metrics.dataLoadTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span className="font-mono">{metrics.memoryUsage.toFixed(1)}MB</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Components:</span>
                  <span className="font-mono">{metrics.componentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Re-renders:</span>
                  <span className="font-mono">{metrics.reRenderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hit:</span>
                  <span className="font-mono">{metrics.cacheHitRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Performance Score:
                </span>
                <Badge
                  variant={
                    metrics.renderTime < 16 ? 'default' :
                    metrics.renderTime < 33 ? 'secondary' : 'destructive'
                  }
                >
                  {metrics.renderTime < 16 ? 'Excellent' :
                   metrics.renderTime < 33 ? 'Good' : 'Poor'}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main performance-optimized charts component
export function PerformanceOptimizedCharts({
  enableVirtualization = true,
  enableLazyLoading = true,
  enablePerformanceMonitor = true,
  data = []
}: {
  enableVirtualization?: boolean;
  enableLazyLoading?: boolean;
  enablePerformanceMonitor?: boolean;
  data?: any[];
}) {
  const { metrics } = usePerformanceMonitor();
  const [showPerfMonitor, setShowPerfMonitor] = useState(false);

  // Generate large dataset for demonstration
  const largeDataset = useMemo(() =>
    data.length > 0 ? data : Array.from({ length: 5000 }, (_, i) => ({
      name: `Point ${i + 1}`,
      value: Math.floor(Math.random() * 1000) + 100,
      category: `Category ${(i % 10) + 1}`,
      timestamp: new Date(Date.now() - (5000 - i) * 60000).toISOString()
    }))
  , [data]);

  const virtualizationConfig: VirtualizationConfig = {
    enabled: enableVirtualization,
    chunkSize: 100,
    preloadChunks: 2,
    recycleThreshold: 500,
    cacheSize: 20
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Performance Optimized Charts</h1>
        <p className="text-gray-600 mt-2">
          Advanced optimization features: lazy loading, virtualization, and performance monitoring
        </p>
      </div>

      {/* Performance demonstration */}
      <div className="grid gap-6">
        {enableLazyLoading ? (
          <LazyChart title="Revenue Trends (Lazy Loaded)">
            <VirtualDataChart
              data={largeDataset}
              config={virtualizationConfig}
              renderChart={(data) => (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Revenue Trends (Virtualized: {data.length} points)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" interval="preserveStartEnd" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            />
          </LazyChart>
        ) : (
          <OptimizedChartWrapper title="Standard Chart">
            <Card>
              <CardHeader>
                <CardTitle>Standard Chart (No Optimization)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={largeDataset.slice(0, 100)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </OptimizedChartWrapper>
        )}

        {/* Additional lazy-loaded components */}
        {enableLazyLoading && (
          <>
            <LazyChart title="Agency Compliance (Lazy Loaded)" height={600}>
              <LazyAgencyCharts />
            </LazyChart>

            <LazyChart title="Business Intelligence (Lazy Loaded)" height={800}>
              <LazyBusinessDashboard />
            </LazyChart>
          </>
        )}
      </div>

      {/* Performance monitoring */}
      {enablePerformanceMonitor && (
        <PerformanceMonitor
          metrics={metrics}
          visible={showPerfMonitor}
          onToggle={() => setShowPerfMonitor(!showPerfMonitor)}
        />
      )}
    </div>
  );
}