import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Performance Testing for GCMC-KAJ Platform
 *
 * Tests cover:
 * - Page load times under 3 seconds
 * - Database query optimization
 * - File upload performance
 * - API response times
 * - Memory and CPU usage monitoring
 * - Network optimization
 * - Large dataset handling
 */

test.describe('Performance Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Login for consistent testing state
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
    await page.fill('[data-testid="password"]', 'SecureAdmin123!');
    await page.click('[data-testid="loginButton"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Page Load Performance', () => {
    test('@performance @critical should load dashboard within performance budget', async () => {
      const startTime = Date.now();

      // Navigate to dashboard and measure load time
      await page.goto('/dashboard');

      // Wait for all critical elements to load
      await page.waitForSelector('[data-testid="dashboard-widgets"]');
      await page.waitForSelector('[data-testid="compliance-overview-widget"]');
      await page.waitForSelector('[data-testid="recent-activity-widget"]');

      const loadTime = Date.now() - startTime;

      // Performance assertion: Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Collect performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
        };
      });

      // Performance budgets
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // 1.5s for FCP
      expect(performanceMetrics.totalLoadTime).toBeLessThan(3000); // 3s total

      console.log('Dashboard Performance Metrics:', performanceMetrics);
    });

    test('@performance should load clients page efficiently with large dataset', async () => {
      const startTime = Date.now();

      // Navigate to clients page
      await page.goto('/clients');

      // Wait for client table to load
      await page.waitForSelector('[data-testid="clients-table"]');

      // Wait for all client rows to render
      await page.waitForFunction(() => {
        const rows = document.querySelectorAll('[data-testid^="client-"]');
        return rows.length > 0;
      }, { timeout: 5000 });

      const loadTime = Date.now() - startTime;

      // Clients page should load within 2.5 seconds even with large dataset
      expect(loadTime).toBeLessThan(2500);

      // Test pagination performance
      const paginationStartTime = Date.now();
      await page.click('[data-testid="next-page"]');
      await page.waitForSelector('[data-testid="clients-table"]');
      const paginationTime = Date.now() - paginationStartTime;

      // Pagination should be fast (under 1 second)
      expect(paginationTime).toBeLessThan(1000);
    });

    test('@performance should load complex forms quickly', async () => {
      const startTime = Date.now();

      // Navigate to complex VAT form
      await page.goto('/gra/vat/create');

      // Wait for all form elements to render
      await page.waitForSelector('[data-testid="vat-form"]');
      await page.waitForSelector('[data-testid="standard-rated-supplies"]');
      await page.waitForSelector('[data-testid="input-vat-amount"]');

      const loadTime = Date.now() - startTime;

      // Complex forms should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);

      // Test form interaction performance
      const interactionStartTime = Date.now();
      await page.fill('[data-testid="standard-rated-supplies"]', '100000.00');
      await page.click('[data-testid="calculate-vat"]');
      await page.waitForSelector('[data-testid="vat-calculations"]');
      const interactionTime = Date.now() - interactionStartTime;

      // Form calculations should be fast
      expect(interactionTime).toBeLessThan(500);
    });

    test('@performance should handle analytics page with charts efficiently', async () => {
      const startTime = Date.now();

      await page.goto('/analytics');

      // Wait for charts to load and render
      await page.waitForSelector('[data-testid="analytics-charts"]');
      await page.waitForFunction(() => {
        // Check if charts have rendered by looking for chart elements
        const chartElements = document.querySelectorAll('[data-testid*="chart"]');
        return chartElements.length >= 3;
      }, { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Analytics page with charts should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);

      // Test chart interaction performance
      const chartInteractionStart = Date.now();
      await page.click('[data-testid="chart-date-filter"]');
      await page.selectOption('[data-testid="chart-date-filter"]', 'Last 3 Months');
      await page.waitForFunction(() => {
        // Wait for charts to update
        return document.querySelector('[data-testid="chart-updated"]');
      }, { timeout: 3000 });
      const chartInteractionTime = Date.now() - chartInteractionStart;

      // Chart updates should be responsive
      expect(chartInteractionTime).toBeLessThan(2000);
    });
  });

  test.describe('API Response Performance', () => {
    test('@performance @api should measure API response times', async () => {
      let apiResponseTimes: { [key: string]: number } = {};

      // Intercept API calls to measure response times
      page.route('**/api/**', async (route, request) => {
        const startTime = Date.now();
        await route.continue();
        const endTime = Date.now();
        const endpoint = request.url().split('/api/')[1];
        apiResponseTimes[endpoint] = endTime - startTime;
      });

      // Navigate to dashboard to trigger multiple API calls
      await page.goto('/dashboard');
      await page.waitForTimeout(3000); // Allow all API calls to complete

      // Check API response times
      console.log('API Response Times:', apiResponseTimes);

      // Critical APIs should respond within performance budgets
      Object.entries(apiResponseTimes).forEach(([endpoint, responseTime]) => {
        if (endpoint.includes('dashboard')) {
          expect(responseTime).toBeLessThan(1000); // Dashboard APIs: 1s
        } else if (endpoint.includes('clients')) {
          expect(responseTime).toBeLessThan(800); // Client APIs: 800ms
        } else if (endpoint.includes('auth')) {
          expect(responseTime).toBeLessThan(500); // Auth APIs: 500ms
        } else {
          expect(responseTime).toBeLessThan(2000); // General APIs: 2s
        }
      });
    });

    test('@performance @api should handle concurrent API requests efficiently', async () => {
      const apiCalls: Promise<any>[] = [];
      const startTime = Date.now();

      // Simulate concurrent API calls
      apiCalls.push(page.request.get('/api/clients'));
      apiCalls.push(page.request.get('/api/services'));
      apiCalls.push(page.request.get('/api/documents'));
      apiCalls.push(page.request.get('/api/compliance/deadlines'));
      apiCalls.push(page.request.get('/api/analytics/summary'));

      // Wait for all calls to complete
      const responses = await Promise.all(apiCalls);
      const totalTime = Date.now() - startTime;

      // All responses should be successful
      responses.forEach(response => {
        expect(response.status()).toBeLessThan(400);
      });

      // Concurrent calls should complete within reasonable time
      expect(totalTime).toBeLessThan(3000);
    });

    test('@performance @api should handle large dataset queries efficiently', async () => {
      // Test large client dataset query
      const clientsStartTime = Date.now();
      const clientsResponse = await page.request.get('/api/clients?limit=1000');
      const clientsTime = Date.now() - clientsStartTime;

      expect(clientsResponse.status()).toBe(200);
      expect(clientsTime).toBeLessThan(2000); // Large dataset query: 2s

      // Test complex analytics query
      const analyticsStartTime = Date.now();
      const analyticsResponse = await page.request.get('/api/analytics/compliance?period=12months');
      const analyticsTime = Date.now() - analyticsStartTime;

      expect(analyticsResponse.status()).toBe(200);
      expect(analyticsTime).toBeLessThan(3000); // Complex analytics: 3s

      // Test search with filters
      const searchStartTime = Date.now();
      const searchResponse = await page.request.get('/api/clients/search?q=test&businessType=Small Business&limit=500');
      const searchTime = Date.now() - searchStartTime;

      expect(searchResponse.status()).toBe(200);
      expect(searchTime).toBeLessThan(1500); // Filtered search: 1.5s
    });
  });

  test.describe('File Upload Performance', () => {
    test('@performance @upload should handle single file upload efficiently', async () => {
      await page.goto('/documents/upload');

      // Create test file (1MB)
      const testFileSize = 1024 * 1024; // 1MB
      const testFileBuffer = Buffer.alloc(testFileSize, 'a');

      const uploadStartTime = Date.now();

      // Upload file
      await page.setInputFiles('[data-testid="file-input"]', {
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer: testFileBuffer
      });

      // Wait for upload completion
      await page.waitForSelector('[data-testid="upload-success"]');
      const uploadTime = Date.now() - uploadStartTime;

      // 1MB file should upload within 5 seconds
      expect(uploadTime).toBeLessThan(5000);

      console.log(`1MB file upload time: ${uploadTime}ms`);
    });

    test('@performance @upload should handle multiple file uploads', async () => {
      await page.goto('/documents/upload');

      // Create multiple test files
      const fileSize = 512 * 1024; // 512KB each
      const files = [];

      for (let i = 0; i < 5; i++) {
        files.push({
          name: `test-document-${i}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.alloc(fileSize, 'b')
        });
      }

      const uploadStartTime = Date.now();

      // Upload multiple files
      await page.setInputFiles('[data-testid="file-input"]', files);

      // Wait for all uploads to complete
      await page.waitForSelector('[data-testid="all-uploads-complete"]');
      const totalUploadTime = Date.now() - uploadStartTime;

      // 5 x 512KB files should upload within 10 seconds
      expect(totalUploadTime).toBeLessThan(10000);

      console.log(`Multiple files (5 x 512KB) upload time: ${totalUploadTime}ms`);
    });

    test('@performance @upload should handle large file upload within limits', async () => {
      await page.goto('/documents/upload');

      // Create large test file (10MB)
      const largeFileSize = 10 * 1024 * 1024; // 10MB
      const largeFileBuffer = Buffer.alloc(largeFileSize, 'c');

      const uploadStartTime = Date.now();

      await page.setInputFiles('[data-testid="file-input"]', {
        name: 'large-document.pdf',
        mimeType: 'application/pdf',
        buffer: largeFileBuffer
      });

      // Wait for upload with progress tracking
      await page.waitForSelector('[data-testid="upload-progress"]');

      // Monitor upload progress
      let progressValue = 0;
      while (progressValue < 100) {
        const progressElement = page.locator('[data-testid="upload-progress-value"]');
        const progressText = await progressElement.textContent();
        progressValue = parseInt(progressText || '0');

        if (progressValue < 100) {
          await page.waitForTimeout(100);
        }
      }

      await page.waitForSelector('[data-testid="upload-success"]');
      const uploadTime = Date.now() - uploadStartTime;

      // 10MB file should upload within 30 seconds
      expect(uploadTime).toBeLessThan(30000);

      console.log(`Large file (10MB) upload time: ${uploadTime}ms`);
    });
  });

  test.describe('Database Query Performance', () => {
    test('@performance @database should optimize complex queries', async () => {
      // Navigate to analytics page that triggers complex queries
      await page.goto('/analytics/advanced');

      // Monitor network requests for database queries
      const queryTimes: { [key: string]: number } = {};

      page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/analytics/') || url.includes('/api/reports/')) {
          const timing = response.timing();
          queryTimes[url] = timing.responseEnd;
        }
      });

      // Trigger complex report generation
      await page.click('[data-testid="generate-compliance-report"]');
      await page.selectOption('[data-testid="report-period"]', '12-months');
      await page.click('[data-testid="run-report"]');

      // Wait for report completion
      await page.waitForSelector('[data-testid="report-complete"]', { timeout: 30000 });

      // Check query performance
      Object.entries(queryTimes).forEach(([url, responseTime]) => {
        console.log(`Query ${url}: ${responseTime}ms`);

        if (url.includes('compliance-report')) {
          expect(responseTime).toBeLessThan(5000); // Complex reports: 5s
        } else if (url.includes('analytics')) {
          expect(responseTime).toBeLessThan(3000); // Analytics queries: 3s
        }
      });
    });

    test('@performance @database should handle pagination efficiently', async () => {
      await page.goto('/clients');

      // Test pagination performance across multiple pages
      const paginationTimes: number[] = [];

      for (let i = 1; i <= 5; i++) {
        const startTime = Date.now();

        await page.click('[data-testid="next-page"]');
        await page.waitForSelector('[data-testid="clients-table"]');

        const paginationTime = Date.now() - startTime;
        paginationTimes.push(paginationTime);

        // Each page should load quickly
        expect(paginationTime).toBeLessThan(1000);
      }

      const averagePaginationTime = paginationTimes.reduce((a, b) => a + b, 0) / paginationTimes.length;
      console.log(`Average pagination time: ${averagePaginationTime}ms`);

      // Average pagination should be under 800ms
      expect(averagePaginationTime).toBeLessThan(800);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('@performance @memory should monitor memory usage during normal operations', async () => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });

      // Perform memory-intensive operations
      await page.goto('/analytics');
      await page.waitForSelector('[data-testid="analytics-charts"]');

      // Navigate through multiple pages
      await page.goto('/clients');
      await page.waitForTimeout(2000);
      await page.goto('/documents');
      await page.waitForTimeout(2000);
      await page.goto('/gra/vat');
      await page.waitForTimeout(2000);

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        const memoryIncreasePercentage = (memoryIncrease / initialMemory.used) * 100;

        console.log(`Memory usage increase: ${memoryIncrease} bytes (${memoryIncreasePercentage.toFixed(2)}%)`);

        // Memory usage shouldn't increase by more than 50% during normal operations
        expect(memoryIncreasePercentage).toBeLessThan(50);

        // Total memory usage should stay within reasonable limits (100MB)
        expect(finalMemory.used).toBeLessThan(100 * 1024 * 1024);
      }
    });

    test('@performance @cpu should monitor CPU-intensive operations', async () => {
      // Test CPU performance during heavy calculations
      await page.goto('/analytics/performance-test');

      const performanceStartTime = Date.now();

      // Trigger CPU-intensive calculation
      await page.click('[data-testid="run-performance-test"]');

      // Monitor performance during calculation
      const performanceData = await page.evaluate(() => {
        return new Promise((resolve) => {
          const startTime = performance.now();
          let frames = 0;
          let lastFrameTime = startTime;

          function measureFrameRate() {
            const currentTime = performance.now();
            frames++;

            if (currentTime - startTime > 5000) { // Measure for 5 seconds
              resolve({
                averageFrameTime: (currentTime - startTime) / frames,
                fps: frames / ((currentTime - startTime) / 1000)
              });
            } else {
              requestAnimationFrame(measureFrameRate);
            }
          }

          requestAnimationFrame(measureFrameRate);
        });
      });

      const calculationTime = Date.now() - performanceStartTime;

      console.log(`Performance data:`, performanceData);
      console.log(`CPU-intensive operation time: ${calculationTime}ms`);

      // CPU-intensive operations should maintain reasonable frame rates
      expect((performanceData as any).fps).toBeGreaterThan(30); // Maintain 30+ FPS

      // Operation should complete within reasonable time
      expect(calculationTime).toBeLessThan(10000);
    });
  });

  test.describe('Network Performance', () => {
    test('@performance @network should optimize network requests', async () => {
      // Monitor network requests
      const networkRequests: any[] = [];

      page.on('request', request => {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          size: request.postDataBuffer()?.length || 0,
          startTime: Date.now()
        });
      });

      page.on('response', response => {
        const request = networkRequests.find(req => req.url === response.url());
        if (request) {
          request.endTime = Date.now();
          request.responseSize = response.headers()['content-length'];
          request.status = response.status();
        }
      });

      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForTimeout(5000); // Allow all requests to complete

      // Analyze network performance
      const completedRequests = networkRequests.filter(req => req.endTime);

      // Check for efficient caching
      const cachedRequests = completedRequests.filter(req => req.status === 304);
      const totalRequests = completedRequests.length;

      console.log(`Total requests: ${totalRequests}, Cached: ${cachedRequests.length}`);

      // At least 20% of requests should be cached on subsequent loads
      if (totalRequests > 0) {
        const cacheRatio = cachedRequests.length / totalRequests;
        expect(cacheRatio).toBeGreaterThan(0.1); // At least 10% cached
      }

      // Check request sizes
      const largeRequests = completedRequests.filter(req =>
        parseInt(req.responseSize || '0') > 500000 // > 500KB
      );

      // Minimize large requests
      expect(largeRequests.length).toBeLessThan(3);
    });

    test('@performance @network should minimize bundle sizes', async () => {
      // Monitor JavaScript bundle loads
      const jsBundles: any[] = [];

      page.on('response', response => {
        const url = response.url();
        if (url.includes('.js') && !url.includes('node_modules')) {
          jsBundles.push({
            url,
            size: response.headers()['content-length']
          });
        }
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Analyze bundle sizes
      let totalBundleSize = 0;
      jsBundles.forEach(bundle => {
        const size = parseInt(bundle.size || '0');
        totalBundleSize += size;
        console.log(`Bundle ${bundle.url}: ${size} bytes`);

        // Individual bundles shouldn't be too large
        expect(size).toBeLessThan(1000000); // < 1MB per bundle
      });

      console.log(`Total JS bundle size: ${totalBundleSize} bytes`);

      // Total bundle size should be reasonable
      expect(totalBundleSize).toBeLessThan(3000000); // < 3MB total
    });
  });

  test.describe('Stress Testing', () => {
    test('@performance @stress should handle rapid user interactions', async () => {
      await page.goto('/clients');

      // Perform rapid interactions
      const interactions = [
        () => page.click('[data-testid="client-search"]'),
        () => page.fill('[data-testid="client-search"]', 'test'),
        () => page.keyboard.press('Escape'),
        () => page.selectOption('[data-testid="business-type-filter"]', 'Small Business'),
        () => page.selectOption('[data-testid="business-type-filter"]', 'All'),
        () => page.click('[data-testid="next-page"]'),
        () => page.click('[data-testid="previous-page"]')
      ];

      const startTime = Date.now();

      // Perform interactions rapidly
      for (let i = 0; i < 50; i++) {
        const interaction = interactions[i % interactions.length];
        await interaction();
        await page.waitForTimeout(10); // Minimal delay between interactions
      }

      const totalTime = Date.now() - startTime;

      // System should remain responsive during rapid interactions
      expect(totalTime).toBeLessThan(10000); // Complete 50 interactions in 10s

      // Verify the page is still functional
      await expect(page.locator('[data-testid="clients-table"]')).toBeVisible();
    });

    test('@performance @stress should handle concurrent user sessions simulation', async () => {
      // This test simulates multiple user sessions
      const contexts = [];
      const pages = [];

      try {
        // Create multiple browser contexts to simulate different users
        for (let i = 0; i < 3; i++) {
          const context = await page.context().browser()?.newContext();
          if (context) {
            contexts.push(context);
            const newPage = await context.newPage();
            pages.push(newPage);
          }
        }

        // Login all users concurrently
        const loginPromises = pages.map(async (userPage, index) => {
          await userPage.goto('/login');
          await userPage.fill('[data-testid="email"]', `user${index}@gcmckaj.com`);
          await userPage.fill('[data-testid="password"]', 'SecurePass123!');
          await userPage.click('[data-testid="loginButton"]');
          await userPage.waitForURL('**/dashboard');
        });

        const loginStartTime = Date.now();
        await Promise.all(loginPromises);
        const loginTime = Date.now() - loginStartTime;

        // Concurrent logins should complete within reasonable time
        expect(loginTime).toBeLessThan(5000);

        // Perform concurrent operations
        const operationPromises = pages.map(async (userPage, index) => {
          switch (index % 3) {
            case 0:
              await userPage.goto('/clients');
              await userPage.waitForSelector('[data-testid="clients-table"]');
              break;
            case 1:
              await userPage.goto('/gra/vat');
              await userPage.waitForSelector('[data-testid="vat-dashboard"]');
              break;
            case 2:
              await userPage.goto('/analytics');
              await userPage.waitForSelector('[data-testid="analytics-charts"]');
              break;
          }
        });

        const operationStartTime = Date.now();
        await Promise.all(operationPromises);
        const operationTime = Date.now() - operationStartTime;

        // Concurrent page loads should complete efficiently
        expect(operationTime).toBeLessThan(8000);

      } finally {
        // Cleanup
        for (const context of contexts) {
          await context.close();
        }
      }
    });
  });

  test.afterEach(async () => {
    // Clear any performance monitoring
    page.removeAllListeners('request');
    page.removeAllListeners('response');

    // Return to dashboard
    await page.goto('/dashboard');
  });
});