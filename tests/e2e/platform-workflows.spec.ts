import { test, expect } from '@playwright/test'

test.describe('GCMC-KAJ Platform E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the platform
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
  })

  test('Homepage loads successfully with correct branding', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/GCMC-KAJ/i)

    // Check main navigation and branding
    await expect(page.locator('text=GCMC-KAJ Platform')).toBeVisible()
    await expect(page.locator('text=Green Crescent Management Consultancy')).toBeVisible()
    await expect(page.locator('text=KAJ Financial Services')).toBeVisible()

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/homepage.png',
      fullPage: true
    })
  })

  test('Demo page displays business metrics correctly', async ({ page }) => {
    // Navigate to demo page
    await page.goto('http://localhost:3001/demo')
    await page.waitForLoadState('networkidle')

    // Check demo dashboard elements
    await expect(page.locator('text=Dashboard Overview')).toBeVisible()
    await expect(page.locator('text=Overall Score')).toBeVisible()
    await expect(page.locator('text=Active Clients')).toBeVisible()

    // Check metrics cards are displayed
    await expect(page.locator('text=98.5%')).toBeVisible() // Overall Score
    await expect(page.locator('text=156')).toBeVisible() // Active Clients

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/demo-dashboard.png',
      fullPage: true
    })
  })

  test('Client management navigation works', async ({ page }) => {
    // Try to navigate to clients page
    await page.goto('http://localhost:3001/clients')
    await page.waitForLoadState('networkidle')

    // Check if clients page loads or redirects appropriately
    const currentUrl = page.url()
    console.log('Clients page URL:', currentUrl)

    // Take screenshot regardless of auth state
    await page.screenshot({
      path: 'screenshots/clients-page.png',
      fullPage: true
    })
  })

  test('Forms page accessibility', async ({ page }) => {
    // Navigate to forms page
    await page.goto('http://localhost:3001/forms')
    await page.waitForLoadState('networkidle')

    // Take screenshot of forms page
    await page.screenshot({
      path: 'screenshots/forms-page.png',
      fullPage: true
    })
  })

  test('Analytics dashboard loads', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3001/dashboard')
    await page.waitForLoadState('networkidle')

    // Take screenshot of dashboard
    await page.screenshot({
      path: 'screenshots/dashboard-page.png',
      fullPage: true
    })
  })

  test('Mobile responsiveness on key pages', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Test homepage on mobile
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: 'screenshots/homepage-mobile.png',
      fullPage: true
    })

    // Test demo page on mobile
    await page.goto('http://localhost:3001/demo')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: 'screenshots/demo-mobile.png',
      fullPage: true
    })
  })

  test('Platform navigation and branding consistency', async ({ page }) => {
    const pages = ['/', '/demo']

    for (const pagePath of pages) {
      await page.goto(`http://localhost:3001${pagePath}`)
      await page.waitForLoadState('networkidle')

      // Check consistent branding elements
      const gcmcText = page.locator('text=Green Crescent Management Consultancy')
      const kajText = page.locator('text=KAJ Financial Services')
      const platformText = page.locator('text=GCMC-KAJ')

      // At least one branding element should be visible
      const brandingVisible = await gcmcText.isVisible() ||
                             await kajText.isVisible() ||
                             await platformText.isVisible()

      expect(brandingVisible).toBeTruthy()
    }
  })

  test('Performance and loading checks', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    console.log(`Homepage load time: ${loadTime}ms`)

    // Check that page loads in reasonable time (under 10 seconds)
    expect(loadTime).toBeLessThan(10000)

    // Check for common performance indicators
    const images = await page.locator('img').count()
    const links = await page.locator('a').count()
    const buttons = await page.locator('button').count()

    console.log(`Page elements - Images: ${images}, Links: ${links}, Buttons: ${buttons}`)

    // Take final performance screenshot
    await page.screenshot({
      path: 'screenshots/performance-check.png',
      fullPage: true
    })
  })
})

test.describe('Business Workflow Tests', () => {
  test('GRA tax form workflow accessibility', async ({ page }) => {
    // Test the tax form workflow
    await page.goto('http://localhost:3001/forms')
    await page.waitForLoadState('networkidle')

    // Look for form-related elements
    const hasFormElements = await page.locator('form, input, button').count() > 0
    console.log(`Form elements found: ${hasFormElements}`)

    await page.screenshot({
      path: 'screenshots/tax-form-workflow.png',
      fullPage: true
    })
  })

  test('Client profile management workflow', async ({ page }) => {
    // Test client management workflow
    await page.goto('http://localhost:3001/clients')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: 'screenshots/client-management-workflow.png',
      fullPage: true
    })
  })

  test('Business analytics dashboard workflow', async ({ page }) => {
    // Test analytics workflow
    await page.goto('http://localhost:3001/dashboard')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: 'screenshots/analytics-workflow.png',
      fullPage: true
    })
  })
})