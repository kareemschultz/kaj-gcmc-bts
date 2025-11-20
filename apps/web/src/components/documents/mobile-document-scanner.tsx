"use client";

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Contrast,
  Copy,
  CornerDownLeft,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
  Crop,
  Crosshair,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FlipHorizontal,
  FlipVertical,
  Focus,
  Grid,
  Image as ImageIcon,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  Move,
  RefreshCw,
  RotateCcw,
  Save,
  Scan,
  ScanLine, 
  Settings,
  Share2,
  Sliders,
  Square,
  Sun,
  Target,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
  Zap,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { brandColors, gcmcKajBrand } from '@/styles/brand';

// Types
interface CapturedDocument {
  id: string;
  originalImage: string;
  processedImage?: string;
  timestamp: string;
  detectedBounds?: { x: number; y: number; width: number; height: number }[];
  confidence?: number;
  suggestedType?: string;
  metadata: {
    resolution: { width: number; height: number };
    fileSize: number;
    quality: 'draft' | 'good' | 'excellent';
  };
}

interface ScanSettings {
  autoCapture: boolean;
  quality: 'draft' | 'good' | 'excellent';
  enhanceContrast: boolean;
  autoRotate: boolean;
  autoStraighten: boolean;
  detectBounds: boolean;
  flashMode: 'auto' | 'on' | 'off';
  resolution: 'low' | 'medium' | 'high';
  colorMode: 'color' | 'grayscale' | 'blackwhite';
  compressionLevel: number;
}

interface ProcessingOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  rotation: number;
  crop: { x: number; y: number; width: number; height: number } | null;
  filters: string[];
}

interface MobileDocumentScannerProps {
  onCapture: (document: CapturedDocument) => void;
  onProcessingComplete?: (document: CapturedDocument) => void;
  onClose?: () => void;
  initialSettings?: Partial<ScanSettings>;
  showProcessing?: boolean;
  enableBatchScan?: boolean;
  className?: string;
}

type ScanMode = 'single' | 'batch' | 'continuous';
type ViewMode = 'camera' | 'preview' | 'edit';

export function MobileDocumentScanner({
  onCapture,
  onProcessingComplete,
  onClose,
  initialSettings,
  showProcessing = true,
  enableBatchScan = true,
  className
}: MobileDocumentScannerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentMode, setCurrentMode] = useState<ScanMode>('single');
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [capturedDocuments, setCapturedDocuments] = useState<CapturedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<CapturedDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [showBounds, setShowBounds] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoFocus, setAutoFocus] = useState(true);

  // Settings
  const [settings, setSettings] = useState<ScanSettings>({
    autoCapture: false,
    quality: 'good',
    enhanceContrast: true,
    autoRotate: true,
    autoStraighten: true,
    detectBounds: true,
    flashMode: 'auto',
    resolution: 'high',
    colorMode: 'color',
    compressionLevel: 80,
    ...initialSettings
  });

  // Processing options
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    rotation: 0,
    crop: null,
    filters: []
  });

  // Camera capabilities
  const [cameraCapabilities, setCameraCapabilities] = useState<{
    facingModes: string[];
    resolutions: { width: number; height: number }[];
    hasFlash: boolean;
    hasZoom: boolean;
    maxZoom: number;
  }>({
    facingModes: [],
    resolutions: [],
    hasFlash: false,
    hasZoom: false,
    maxZoom: 1
  });

  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: settings.resolution === 'high' ? 1920 : settings.resolution === 'medium' ? 1280 : 640 },
          height: { ideal: settings.resolution === 'high' ? 1080 : settings.resolution === 'medium' ? 720 : 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Get camera capabilities
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.();

        if (capabilities) {
          setCameraCapabilities({
            facingModes: capabilities.facingMode || [],
            resolutions: [],
            hasFlash: !!(capabilities.torch),
            hasZoom: !!(capabilities.zoom),
            maxZoom: capabilities.zoom?.max || 1
          });
        }

        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  }, [currentFacingMode, settings.resolution]);

  // Cleanup camera
  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsInitialized(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeCamera();
    return cleanupCamera;
  }, [initializeCamera, cleanupCamera]);

  // Document detection using mock edge detection
  const detectDocumentBounds = useCallback((imageData: ImageData): { x: number; y: number; width: number; height: number }[] => {
    // Mock document detection - in real implementation, this would use computer vision
    const { width, height } = imageData;

    // Return mock bounds for a document
    return [{
      x: width * 0.1,
      y: height * 0.15,
      width: width * 0.8,
      height: height * 0.7
    }];
  }, []);

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      // Play capture sound
      if (soundEnabled) {
        // In real implementation, play camera shutter sound
        new Audio('/sounds/camera-shutter.mp3').play().catch(() => {});
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0);

      // Get image data for processing
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Detect document bounds if enabled
      let detectedBounds: { x: number; y: number; width: number; height: number }[] = [];
      let confidence = 0.5;

      if (settings.detectBounds) {
        detectedBounds = detectDocumentBounds(imageData);
        confidence = 0.85; // Mock confidence score
      }

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;

        const reader = new FileReader();
        reader.onload = () => {
          const capturedDoc: CapturedDocument = {
            id: Math.random().toString(36).substr(2, 9),
            originalImage: reader.result as string,
            timestamp: new Date().toISOString(),
            detectedBounds,
            confidence,
            suggestedType: 'document',
            metadata: {
              resolution: { width: canvas.width, height: canvas.height },
              fileSize: blob.size,
              quality: settings.quality
            }
          };

          setCapturedDocuments(prev => [...prev, capturedDoc]);
          setSelectedDocument(capturedDoc);

          // Process document if auto-processing is enabled
          if (showProcessing) {
            setViewMode('preview');
            processDocument(capturedDoc);
          } else {
            onCapture(capturedDoc);
          }

          toast.success('Document captured successfully');
        };

        reader.readAsDataURL(blob);
      }, 'image/jpeg', settings.compressionLevel / 100);

    } catch (error) {
      console.error('Failed to capture photo:', error);
      toast.error('Failed to capture document');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, soundEnabled, settings, detectDocumentBounds, showProcessing, onCapture]);

  // Process captured document
  const processDocument = useCallback(async (document: CapturedDocument) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate processing steps
      const steps = [
        'Analyzing image quality...',
        'Detecting document edges...',
        'Straightening document...',
        'Enhancing contrast...',
        'Applying filters...',
        'Finalizing...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProcessingProgress(((i + 1) / steps.length) * 100);

        if (i === steps.length - 1) {
          // Apply final processing (mock)
          const processedDocument = {
            ...document,
            processedImage: document.originalImage // In real implementation, this would be the processed image
          };

          setSelectedDocument(processedDocument);
          onProcessingComplete?.(processedDocument);
          toast.success('Document processed successfully');
        }
      }
    } catch (error) {
      console.error('Processing failed:', error);
      toast.error('Failed to process document');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [onProcessingComplete]);

  // Switch camera
  const switchCamera = useCallback(() => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);
    cleanupCamera();
    setTimeout(() => {
      initializeCamera();
    }, 100);
  }, [currentFacingMode, cleanupCamera, initializeCamera]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !cameraCapabilities.hasFlash) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashEnabled } as any]
      });
      setFlashEnabled(!flashEnabled);
    } catch (error) {
      console.error('Failed to toggle flash:', error);
    }
  }, [flashEnabled, cameraCapabilities.hasFlash]);

  // Auto-capture logic
  useEffect(() => {
    if (!settings.autoCapture || !isInitialized || viewMode !== 'camera') return;

    const interval = setInterval(() => {
      // Mock auto-capture logic - would use document detection in real implementation
      if (Math.random() > 0.95) { // 5% chance per interval
        capturePhoto();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.autoCapture, isInitialized, viewMode, capturePhoto]);

  return (
    <div className={cn("relative flex h-full flex-col bg-black text-white", className)}>
      {/* Camera View */}
      {viewMode === 'camera' && (
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: `scale(${zoomLevel})` }}
          />

          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Overlay */}
          <div className="pointer-events-none absolute inset-0">
            {/* Grid overlay */}
            {showGrid && (
              <div className="absolute inset-0">
                <svg className="h-full w-full">
                  <defs>
                    <pattern id="grid" width="33.333%" height="33.333%" patternUnits="objectBoundingBox">
                      <path d="M 0 0 L 0 1 M 0 0 L 1 0" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            )}

            {/* Document detection overlay */}
            {showBounds && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.6, 0.8, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut"
                  }}
                  className="relative h-3/5 w-4/5 rounded-lg border-2 border-white"
                >
                  {/* Corner indicators */}
                  <CornerUpLeft className="-top-2 -left-2 absolute h-6 w-6 text-white" />
                  <CornerUpRight className="-top-2 -right-2 absolute h-6 w-6 text-white" />
                  <CornerDownLeft className="-bottom-2 -left-2 absolute h-6 w-6 text-white" />
                  <CornerDownRight className="-bottom-2 -right-2 absolute h-6 w-6 text-white" />

                  {/* Center crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Crosshair className="h-8 w-8 text-white opacity-50" />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Auto-capture indicator */}
            {settings.autoCapture && (
              <div className="absolute top-4 left-4">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                  className="flex items-center gap-2 rounded-lg bg-black bg-opacity-50 px-3 py-2"
                >
                  <Target className="h-4 w-4 text-green-400" />
                  <span className="text-sm">Auto-capture active</span>
                </motion.div>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <Card className="bg-white text-black">
                  <CardContent className="p-6 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="mx-auto mb-4 h-8 w-8"
                    >
                      <ScanLine className="h-full w-full text-blue-600" />
                    </motion.div>
                    <p className="mb-2 font-medium">Processing Document</p>
                    <Progress value={processingProgress} className="mx-auto w-48" />
                    <p className="mt-2 text-gray-600 text-sm">
                      {Math.round(processingProgress)}% complete
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Top Controls */}
          <div className="pointer-events-auto absolute top-4 right-4 left-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                <X className="h-5 w-5" />
              </Button>

              <Badge variant="secondary" className="bg-black bg-opacity-50 text-white">
                {currentMode}
              </Badge>

              {capturedDocuments.length > 0 && (
                <Badge variant="secondary" className="bg-green-600 text-white">
                  {capturedDocuments.length} captured
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {cameraCapabilities.hasFlash && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFlash}
                        className={cn(
                          "bg-black bg-opacity-50 text-white hover:bg-opacity-70",
                          flashEnabled && "bg-yellow-600 bg-opacity-80"
                        )}
                      >
                        {flashEnabled ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {flashEnabled ? 'Turn off flash' : 'Turn on flash'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGrid(!showGrid)}
                className={cn(
                  "bg-black bg-opacity-50 text-white hover:bg-opacity-70",
                  showGrid && "bg-blue-600 bg-opacity-80"
                )}
              >
                <Grid className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="pointer-events-auto absolute right-4 bottom-8 left-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mode selector */}
              <div className="flex rounded-lg bg-black bg-opacity-50 p-1">
                {(['single', 'batch', 'continuous'] as ScanMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={currentMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentMode(mode)}
                    className={cn(
                      "text-white",
                      currentMode === mode && "bg-blue-600"
                    )}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {/* Capture Button */}
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={capturePhoto}
                disabled={isCapturing || isProcessing}
                className={cn(
                  "h-16 w-16 rounded-full border-4 border-white bg-white bg-opacity-20",
                  "flex items-center justify-center transition-all",
                  "hover:bg-opacity-30 disabled:opacity-50",
                  isCapturing && "animate-pulse"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-white" />
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              {/* Gallery button */}
              {capturedDocuments.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('preview')}
                  className="relative bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                >
                  <ImageIcon className="h-5 w-5" />
                  <Badge
                    variant="secondary"
                    className="-top-2 -right-2 absolute min-w-[1.25rem] bg-green-600 px-1 text-white text-xs"
                  >
                    {capturedDocuments.length}
                  </Badge>
                </Button>
              )}

              {/* Switch camera */}
              {cameraCapabilities.facingModes.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              )}

              {/* Settings */}
              <ScannerSettings
                settings={settings}
                onSettingsChange={setSettings}
                capabilities={cameraCapabilities}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
              />
            </div>
          </div>

          {/* Zoom control */}
          {cameraCapabilities.hasZoom && (
            <div className="-translate-y-1/2 pointer-events-auto absolute top-1/2 right-4 transform">
              <div className="rounded-lg bg-black bg-opacity-50 p-2">
                <Slider
                  value={[zoomLevel]}
                  onValueChange={(value) => setZoomLevel(value[0])}
                  min={1}
                  max={cameraCapabilities.maxZoom}
                  step={0.1}
                  orientation="vertical"
                  className="h-32"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Document Preview/Gallery */}
      {viewMode === 'preview' && (
        <DocumentGallery
          documents={capturedDocuments}
          selectedDocument={selectedDocument}
          onDocumentSelect={setSelectedDocument}
          onDocumentDelete={(id) => {
            setCapturedDocuments(prev => prev.filter(doc => doc.id !== id));
            if (selectedDocument?.id === id) {
              setSelectedDocument(capturedDocuments[0] || null);
            }
          }}
          onBackToCamera={() => setViewMode('camera')}
          onEditDocument={() => setViewMode('edit')}
          onSaveDocuments={(docs) => {
            docs.forEach(onCapture);
            toast.success(`${docs.length} documents saved`);
          }}
        />
      )}

      {/* Document Editor */}
      {viewMode === 'edit' && selectedDocument && (
        <DocumentEditor
          document={selectedDocument}
          processingOptions={processingOptions}
          onProcessingOptionsChange={setProcessingOptions}
          onBackToGallery={() => setViewMode('preview')}
          onSaveDocument={(doc) => {
            onCapture(doc);
            setViewMode('preview');
            toast.success('Document saved');
          }}
        />
      )}
    </div>
  );
}

// Scanner Settings Component
interface ScannerSettingsProps {
  settings: ScanSettings;
  onSettingsChange: (settings: ScanSettings) => void;
  capabilities: any;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}

function ScannerSettings({
  settings,
  onSettingsChange,
  capabilities,
  zoomLevel,
  onZoomChange
}: ScannerSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateSetting = <K extends keyof ScanSettings>(key: K, value: ScanSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 bottom-full mb-2 w-80 overflow-hidden rounded-lg border bg-white text-black shadow-xl"
          >
            <div className="border-b bg-gray-50 p-4">
              <h3 className="font-semibold">Scanner Settings</h3>
            </div>

            <ScrollArea className="max-h-96">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select value={settings.quality} onValueChange={(value) => updateSetting('quality', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (fast)</SelectItem>
                      <SelectItem value="good">Good (balanced)</SelectItem>
                      <SelectItem value="excellent">Excellent (slow)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select value={settings.resolution} onValueChange={(value) => updateSetting('resolution', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (640x480)</SelectItem>
                      <SelectItem value="medium">Medium (1280x720)</SelectItem>
                      <SelectItem value="high">High (1920x1080)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color Mode</Label>
                  <Select value={settings.colorMode} onValueChange={(value) => updateSetting('colorMode', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="grayscale">Grayscale</SelectItem>
                      <SelectItem value="blackwhite">Black & White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Auto-capture</Label>
                    <Switch
                      checked={settings.autoCapture}
                      onCheckedChange={(checked) => updateSetting('autoCapture', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-rotate</Label>
                    <Switch
                      checked={settings.autoRotate}
                      onCheckedChange={(checked) => updateSetting('autoRotate', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Enhance contrast</Label>
                    <Switch
                      checked={settings.enhanceContrast}
                      onCheckedChange={(checked) => updateSetting('enhanceContrast', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Detect bounds</Label>
                    <Switch
                      checked={settings.detectBounds}
                      onCheckedChange={(checked) => updateSetting('detectBounds', checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Compression Level: {settings.compressionLevel}%</Label>
                  <Slider
                    value={[settings.compressionLevel]}
                    onValueChange={(value) => updateSetting('compressionLevel', value[0])}
                    min={10}
                    max={100}
                    step={10}
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end border-t bg-gray-50 p-3">
              <Button onClick={() => setIsOpen(false)} size="sm">
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Document Gallery Component
interface DocumentGalleryProps {
  documents: CapturedDocument[];
  selectedDocument: CapturedDocument | null;
  onDocumentSelect: (document: CapturedDocument) => void;
  onDocumentDelete: (id: string) => void;
  onBackToCamera: () => void;
  onEditDocument: () => void;
  onSaveDocuments: (documents: CapturedDocument[]) => void;
}

function DocumentGallery({
  documents,
  selectedDocument,
  onDocumentSelect,
  onDocumentDelete,
  onBackToCamera,
  onEditDocument,
  onSaveDocuments
}: DocumentGalleryProps) {
  return (
    <div className="flex h-full flex-col bg-white text-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBackToCamera}>
            <Camera className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold">Captured Documents</h2>
            <p className="text-gray-600 text-sm">{documents.length} documents</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onSaveDocuments(documents)}
            disabled={documents.length === 0}
          >
            <Upload className="mr-2 h-4 w-4" />
            Save All
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Document List */}
        <div className="w-48 overflow-y-auto border-r bg-gray-50">
          <div className="space-y-2 p-2">
            {documents.map((document, index) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onDocumentSelect(document)}
                className={cn(
                  "relative cursor-pointer rounded-lg p-2 transition-colors",
                  selectedDocument?.id === document.id
                    ? "border border-blue-500 bg-blue-100"
                    : "border bg-white hover:bg-gray-50"
                )}
              >
                <div className="mb-2 aspect-[3/4] overflow-hidden rounded bg-gray-100">
                  <img
                    src={document.processedImage || document.originalImage}
                    alt={`Document ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-xs">Doc {index + 1}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(document.timestamp).toLocaleTimeString()}
                  </p>
                  {document.metadata.quality && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {document.metadata.quality}
                    </Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDocumentDelete(document.id);
                  }}
                  className="absolute top-1 right-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}

            {documents.length === 0 && (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                <p className="text-gray-500 text-sm">No documents captured</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Preview */}
        <div className="flex flex-1 flex-col">
          {selectedDocument ? (
            <>
              {/* Preview */}
              <div className="flex flex-1 items-center justify-center bg-gray-100 p-4">
                <div className="max-h-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-lg">
                  <img
                    src={selectedDocument.processedImage || selectedDocument.originalImage}
                    alt="Document preview"
                    className="h-auto w-full"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="border-t bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {selectedDocument.metadata.resolution.width}×{selectedDocument.metadata.resolution.height}
                    </Badge>
                    <Badge variant="outline">
                      {formatFileSize(selectedDocument.metadata.fileSize)}
                    </Badge>
                    {selectedDocument.confidence && (
                      <Badge variant="outline">
                        {Math.round(selectedDocument.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onEditDocument}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button onClick={() => onSaveDocuments([selectedDocument])}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <p className="font-medium text-gray-600 text-lg">No document selected</p>
                <p className="text-gray-500">Choose a document to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Document Editor Component
interface DocumentEditorProps {
  document: CapturedDocument;
  processingOptions: ProcessingOptions;
  onProcessingOptionsChange: (options: ProcessingOptions) => void;
  onBackToGallery: () => void;
  onSaveDocument: (document: CapturedDocument) => void;
}

function DocumentEditor({
  document,
  processingOptions,
  onProcessingOptionsChange,
  onBackToGallery,
  onSaveDocument
}: DocumentEditorProps) {
  const updateOption = <K extends keyof ProcessingOptions>(key: K, value: ProcessingOptions[K]) => {
    onProcessingOptionsChange({ ...processingOptions, [key]: value });
  };

  return (
    <div className="flex h-full flex-col bg-white text-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBackToGallery}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold">Edit Document</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={() => onSaveDocument(document)}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Preview */}
        <div className="flex flex-1 items-center justify-center bg-gray-100 p-4">
          <div className="max-h-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-lg">
            <img
              src={document.processedImage || document.originalImage}
              alt="Document preview"
              className="h-auto w-full"
              style={{
                filter: `
                  brightness(${100 + processingOptions.brightness}%)
                  contrast(${100 + processingOptions.contrast}%)
                  saturate(${100 + processingOptions.saturation}%)
                `,
                transform: `rotate(${processingOptions.rotation}deg)`
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="w-80 overflow-y-auto border-l bg-gray-50">
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="crop">Crop</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>

            <TabsContent value="adjust" className="space-y-6 p-4">
              <div className="space-y-4">
                <div>
                  <Label>Brightness: {processingOptions.brightness}%</Label>
                  <Slider
                    value={[processingOptions.brightness]}
                    onValueChange={(value) => updateOption('brightness', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Contrast: {processingOptions.contrast}%</Label>
                  <Slider
                    value={[processingOptions.contrast]}
                    onValueChange={(value) => updateOption('contrast', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Saturation: {processingOptions.saturation}%</Label>
                  <Slider
                    value={[processingOptions.saturation]}
                    onValueChange={(value) => updateOption('saturation', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Rotation: {processingOptions.rotation}°</Label>
                  <Slider
                    value={[processingOptions.rotation]}
                    onValueChange={(value) => updateOption('rotation', value[0])}
                    min={-180}
                    max={180}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="crop" className="p-4">
              <div className="text-center">
                <Crop className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                <p className="text-gray-600 text-sm">Crop functionality coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {['Enhance', 'Sharpen', 'Denoise', 'Auto-fix'].map((filter) => (
                    <Button
                      key={filter}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const filters = processingOptions.filters.includes(filter)
                          ? processingOptions.filters.filter(f => f !== filter)
                          : [...processingOptions.filters, filter];
                        updateOption('filters', filters);
                      }}
                      className={cn(
                        processingOptions.filters.includes(filter) && "border-blue-500 bg-blue-100"
                      )}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { type CapturedDocument, type ScanSettings };
export default MobileDocumentScanner;