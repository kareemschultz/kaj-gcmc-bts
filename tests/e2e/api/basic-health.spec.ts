import { test, expect } from '@playwright/test';

/**
 * Basic API Health Tests
 * Simple tests to verify API connectivity and basic functionality
 */

test.describe('API Health Check', () => {
  test('should reach API health endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3003/health');
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    console.log('Health check response:', responseBody);
  });

  test('should handle API root endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3003/');
    // Any non-500 status is acceptable for root endpoint
    expect(response.status()).toBeLessThan(500);

    console.log('Root endpoint status:', response.status());
  });
});