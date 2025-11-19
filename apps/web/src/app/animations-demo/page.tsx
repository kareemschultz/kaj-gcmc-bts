/**
 * Animation System Demo Page
 * Comprehensive showcase of the GCMC-KAJ animation framework
 */

'use client';

import React, { useState } from 'react';
import {
  AnimatedButton,
  AnimatedInput,
  AnimatedCard,
  PageTransition,
  StaggeredList,
  ScrollReveal,
  LoadingSpinner,
  ProgressBar,
  LoadingOverlay,
  ComplianceScore,
  DeadlineWarning,
  DocumentUploadAnimation,
  MonetaryValue,
  StatusChangeAnimation,
  SwipeableCard,
  TouchFeedback,
  AccessibilityControls
} from '@/lib/animations';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AnimationsDemoPage() {
  const [complianceScore, setComplianceScore] = useState(85);
  const [previousComplianceScore, setPreviousComplianceScore] = useState(82);
  const [progress, setProgress] = useState(0);
  const [monetaryValue, setMonetaryValue] = useState(125000);
  const [previousMonetaryValue, setPreviousMonetaryValue] = useState(120000);
  const [status, setStatus] = useState<'pending' | 'processing' | 'approved' | 'rejected' | 'completed'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const updateComplianceScore = () => {
    setPreviousComplianceScore(complianceScore);
    setComplianceScore(Math.floor(Math.random() * 100));
  };

  const updateMonetaryValue = () => {
    setPreviousMonetaryValue(monetaryValue);
    setMonetaryValue(monetaryValue + Math.floor(Math.random() * 50000) - 25000);
  };

  const cycleStatus = () => {
    const statuses: Array<typeof status> = ['pending', 'processing', 'approved', 'rejected', 'completed'];
    const currentIndex = statuses.indexOf(status);
    setStatus(statuses[(currentIndex + 1) % statuses.length]);
  };

  const startProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    setUploadComplete(false);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadComplete(true);
          return 100;
        }
        return prev + Math.random() * 8;
      });
    }, 100);
  };

  const toggleLoading = () => {
    setIsLoading(!isLoading);
    if (!isLoading) {
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  return (
    <PageTransition animationType="business">
      <div className="container mx-auto py-8 space-y-8">
        <ScrollReveal animationType="slideUp">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">GCMC-KAJ Animation System</h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive micro-interactions and animations for business tax services
            </p>
            <div className="mt-4">
              <AccessibilityControls showPerformanceMetrics />
            </div>
          </div>
        </ScrollReveal>

        {/* Button Animations */}
        <ScrollReveal animationType="slideLeft">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <AnimatedButton animationType="default">Default Animation</AnimatedButton>
                <AnimatedButton animationType="bounce">Bounce Effect</AnimatedButton>
                <AnimatedButton animationType="pulse">Pulse Animation</AnimatedButton>
                <AnimatedButton animationType="glow">Glow Effect</AnimatedButton>
                <AnimatedButton animationType="business">Business Style</AnimatedButton>
                <AnimatedButton
                  animationType="business"
                  loadingAnimation={isLoading}
                  onClick={toggleLoading}
                >
                  {isLoading ? 'Processing...' : 'Toggle Loading'}
                </AnimatedButton>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Input Animations */}
        <ScrollReveal animationType="slideRight">
          <Card>
            <CardHeader>
              <CardTitle>Form Interactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatedInput
                  label="Standard Input"
                  placeholder="Focus to see animation"
                  animationType="default"
                />
                <AnimatedInput
                  label="Business Input"
                  placeholder="Enhanced business style"
                  animationType="business"
                />
                <AnimatedInput
                  label="Floating Label"
                  placeholder="Type something..."
                  floatingLabel={true}
                  animationType="enhanced"
                />
                <AnimatedInput
                  label="Error State"
                  placeholder="This field has an error"
                  error="This field is required"
                  animationType="business"
                />
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Business Animations */}
        <ScrollReveal animationType="slideUp">
          <Card>
            <CardHeader>
              <CardTitle>Business-Specific Animations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-4">Compliance Score</h3>
                  <ComplianceScore
                    score={complianceScore}
                    previousScore={previousComplianceScore}
                    size="lg"
                    showTrend={true}
                  />
                  <Button onClick={updateComplianceScore} className="mt-4">
                    Update Score
                  </Button>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold mb-4">Monetary Values</h3>
                  <MonetaryValue
                    value={monetaryValue}
                    previousValue={previousMonetaryValue}
                    size="lg"
                    precision={0}
                  />
                  <Button onClick={updateMonetaryValue} className="mt-4">
                    Update Value
                  </Button>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold mb-4">Status Changes</h3>
                  <div className="mb-4">
                    <StatusChangeAnimation
                      status={status}
                      label={`Filing ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                    />
                  </div>
                  <Button onClick={cycleStatus}>
                    Change Status
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Document Upload Simulation</h3>
                <DocumentUploadAnimation
                  isUploading={uploadProgress > 0 && uploadProgress < 100}
                  progress={uploadProgress}
                  fileName="tax-document.pdf"
                  fileSize="2.4 MB"
                  success={uploadComplete}
                />
                <Button onClick={simulateUpload}>
                  Simulate Upload
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Deadline Warning</h3>
                <DeadlineWarning
                  deadline={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)} // 2 days from now
                  urgent={true}
                />
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Loading States */}
        <ScrollReveal animationType="slideLeft">
          <Card>
            <CardHeader>
              <CardTitle>Loading & Progress Animations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <h4 className="font-medium mb-2">Spinner</h4>
                  <LoadingSpinner variant="spinner" size="lg" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Dots</h4>
                  <LoadingSpinner variant="dots" size="lg" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Pulse</h4>
                  <LoadingSpinner variant="pulse" size="lg" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Business</h4>
                  <LoadingSpinner variant="business" size="lg" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Bars</h4>
                  <LoadingSpinner variant="bars" size="lg" />
                </div>
              </div>

              <div className="space-y-4">
                <ProgressBar
                  progress={progress}
                  animated={true}
                  showPercentage={true}
                  variant="business"
                  label="Processing Tax Filing"
                />
                <Button onClick={startProgress}>
                  Start Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Card Animations */}
        <ScrollReveal animationType="slideRight">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <StaggeredList animationType="business">
                {[
                  { title: 'Hover Animation', type: 'hover' as const },
                  { title: 'Tilt Effect', type: 'tilt' as const },
                  { title: 'Glow Effect', type: 'glow' as const },
                  { title: 'Business Style', type: 'business' as const },
                ].map((item, index) => (
                  <AnimatedCard
                    key={item.title}
                    animationType={item.type}
                    interactive={true}
                    elevation="medium"
                    className="p-4 m-2"
                  >
                    <div className="text-center">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-2">
                        Hover or touch to see the animation effect
                      </p>
                    </div>
                  </AnimatedCard>
                ))}
              </StaggeredList>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Mobile Interactions */}
        <ScrollReveal animationType="slideUp">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Touch Interactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TouchFeedback feedbackType="scale">
                  <Card className="p-4 cursor-pointer">
                    <h4 className="font-medium">Scale Feedback</h4>
                    <p className="text-sm text-muted-foreground">Touch to see scale effect</p>
                  </Card>
                </TouchFeedback>

                <TouchFeedback feedbackType="ripple">
                  <Card className="p-4 cursor-pointer">
                    <h4 className="font-medium">Ripple Feedback</h4>
                    <p className="text-sm text-muted-foreground">Touch to see ripple effect</p>
                  </Card>
                </TouchFeedback>

                <TouchFeedback feedbackType="highlight">
                  <Card className="p-4 cursor-pointer">
                    <h4 className="font-medium">Highlight Feedback</h4>
                    <p className="text-sm text-muted-foreground">Touch to see highlight effect</p>
                  </Card>
                </TouchFeedback>
              </div>

              <div>
                <h4 className="font-medium mb-2">Swipeable Card</h4>
                <SwipeableCard
                  onSwipeLeft={() => alert('Swiped left!')}
                  onSwipeRight={() => alert('Swiped right!')}
                  className="w-full"
                >
                  <Card className="p-6 text-center">
                    <h4 className="font-medium">Swipe me!</h4>
                    <p className="text-sm text-muted-foreground">
                      Try swiping left or right on mobile/desktop
                    </p>
                  </Card>
                </SwipeableCard>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Loading Overlay Demo */}
        <ScrollReveal animationType="slideUp">
          <Card>
            <CardHeader>
              <CardTitle>Loading Overlay</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingOverlay
                isLoading={isLoading}
                variant="business"
                message="Processing your request..."
              >
                <div className="p-8 text-center">
                  <h4 className="font-medium mb-2">Content Area</h4>
                  <p className="text-muted-foreground">
                    This content will be overlaid with a loading animation when the loading state is active.
                  </p>
                  <Button onClick={toggleLoading} className="mt-4">
                    Toggle Loading Overlay
                  </Button>
                </div>
              </LoadingOverlay>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal animationType="slideUp">
          <div className="text-center text-muted-foreground">
            <p>Animation system built for GCMC-KAJ Business Tax Services Platform</p>
            <p className="text-sm mt-2">
              All animations respect user preferences for reduced motion and accessibility
            </p>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
}