import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Comprehensive Authentication Flow Testing for GCMC-KAJ Platform
 *
 * Tests cover:
 * - User registration and validation
 * - Multi-tenant login scenarios
 * - Role-based access control
 * - Session management and security
 * - Account lockout and security features
 * - Password reset workflows
 */

test.describe('Authentication Flow Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test.describe('User Registration', () => {
    test('@smoke @critical should register new user with valid data', async () => {
      const userData = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        organizationName: faker.company.name(),
        phoneNumber: faker.phone.number()
      };

      await page.goto('/register');
      await expect(page).toHaveTitle(/Register/);

      // Take screenshot of registration page
      await page.screenshot({ path: 'test-results/registration-page.png' });

      // Fill registration form
      await page.fill('[data-testid="firstName"]', userData.firstName);
      await page.fill('[data-testid="lastName"]', userData.lastName);
      await page.fill('[data-testid="email"]', userData.email);
      await page.fill('[data-testid="password"]', userData.password);
      await page.fill('[data-testid="confirmPassword"]', userData.confirmPassword);
      await page.fill('[data-testid="organizationName"]', userData.organizationName);
      await page.fill('[data-testid="phoneNumber"]', userData.phoneNumber);

      // Accept terms and conditions
      await page.check('[data-testid="acceptTerms"]');

      // Submit registration
      await page.click('[data-testid="registerButton"]');

      // Verify successful registration
      await expect(page).toHaveURL(/\/dashboard|\/verify-email/);
      await page.screenshot({ path: 'test-results/registration-success.png' });
    });

    test('@negative should reject registration with invalid email', async () => {
      await page.goto('/register');

      await page.fill('[data-testid="email"]', 'invalid-email');
      await page.fill('[data-testid="password"]', 'SecurePass123!');

      await page.click('[data-testid="registerButton"]');

      // Should show email validation error
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toContainText(/invalid email/i);
    });

    test('@negative should reject registration with weak password', async () => {
      await page.goto('/register');

      await page.fill('[data-testid="email"]', faker.internet.email());
      await page.fill('[data-testid="password"]', '123');
      await page.fill('[data-testid="confirmPassword"]', '123');

      await page.click('[data-testid="registerButton"]');

      // Should show password validation error
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('@negative should reject registration with mismatched passwords', async () => {
      await page.goto('/register');

      await page.fill('[data-testid="password"]', 'SecurePass123!');
      await page.fill('[data-testid="confirmPassword"]', 'DifferentPass456!');

      await page.click('[data-testid="registerButton"]');

      // Should show password mismatch error
      await expect(page.locator('[data-testid="confirmPassword-error"]')).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('@smoke @critical should login with valid credentials', async () => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/Login/);

      // Take screenshot of login page
      await page.screenshot({ path: 'test-results/login-page.png' });

      // Use test credentials
      await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecureAdmin123!');

      // Submit login
      await page.click('[data-testid="loginButton"]');

      // Wait for dashboard redirect
      await page.waitForURL('**/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);

      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await page.screenshot({ path: 'test-results/login-success.png' });
    });

    test('@negative should reject invalid credentials', async () => {
      await page.goto('/login');

      await page.fill('[data-testid="email"]', 'invalid@example.com');
      await page.fill('[data-testid="password"]', 'wrongpassword');

      await page.click('[data-testid="loginButton"]');

      // Should show error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-error"]')).toContainText(/invalid credentials/i);

      // Should remain on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('@security should implement rate limiting after multiple failed attempts', async () => {
      await page.goto('/login');

      const invalidEmail = 'test@example.com';
      const invalidPassword = 'wrongpassword';

      // Attempt login multiple times
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email"]', invalidEmail);
        await page.fill('[data-testid="password"]', invalidPassword);
        await page.click('[data-testid="loginButton"]');
        await page.waitForTimeout(1000);
      }

      // Should show rate limiting message
      await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    });
  });

  test.describe('Multi-Tenant Access Control', () => {
    test('@critical should enforce tenant isolation', async () => {
      // Login as user from tenant A
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'tenant1@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecurePass123!');
      await page.click('[data-testid="loginButton"]');

      await page.waitForURL('**/dashboard');

      // Try to access tenant B's data via URL manipulation
      await page.goto('/dashboard/tenant-b/clients');

      // Should be redirected or show access denied
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible().or(
        page.waitForURL('**/dashboard')
      );
    });

    test('@critical should display correct tenant context', async () => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecureAdmin123!');
      await page.click('[data-testid="loginButton"]');

      await page.waitForURL('**/dashboard');

      // Verify tenant name is displayed correctly
      await expect(page.locator('[data-testid="tenant-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="tenant-name"]')).toContainText(/GCMC|KAJ/);
    });
  });

  test.describe('Role-Based Permissions', () => {
    test('@critical should restrict admin functions for regular users', async () => {
      // Login as regular user
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'user@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecurePass123!');
      await page.click('[data-testid="loginButton"]');

      await page.waitForURL('**/dashboard');

      // Admin menu should not be visible
      await expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();

      // Direct access to admin pages should be blocked
      await page.goto('/admin/users');
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });

    test('@critical should allow admin functions for admin users', async () => {
      // Login as admin user
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecureAdmin123!');
      await page.click('[data-testid="loginButton"]');

      await page.waitForURL('**/dashboard');

      // Admin menu should be visible
      await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();

      // Should be able to access admin pages
      await page.click('[data-testid="admin-menu"]');
      await page.click('[data-testid="manage-users"]');

      await expect(page).toHaveURL(/\/admin\/users/);
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    });

    test('@critical should enforce client data access restrictions', async () => {
      // Login as accountant for specific clients
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'accountant1@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecurePass123!');
      await page.click('[data-testid="loginButton"]');

      await page.waitForURL('**/dashboard');

      // Should only see assigned clients
      await page.goto('/clients');

      const clientRows = page.locator('[data-testid="client-row"]');
      await expect(clientRows).toHaveCountGreaterThan(0);

      // Try to access client not assigned to this accountant
      await page.goto('/clients/999/details');
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('@security should timeout inactive sessions', async () => {
      // Login successfully
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecureAdmin123!');
      await page.click('[data-testid="loginButton"]');

      await page.waitForURL('**/dashboard');

      // Simulate session timeout (this would normally take 30+ minutes)
      // We'll manipulate the session cookie or use API to expire it
      await page.evaluate(() => {
        // Clear session storage
        localStorage.clear();
        sessionStorage.clear();
      });

      // Reload the page
      await page.reload();

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('@security should logout properly and clear session', async () => {
      // Login successfully
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecureAdmin123!');
      await page.click('[data-testid="loginButton"]');

      await page.waitForURL('**/dashboard');

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);

      // Try to access protected page
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('@security should prevent concurrent sessions with same credentials', async () => {
      // This test requires coordination between multiple browser contexts
      const context1 = await page.context().browser()?.newContext();
      const context2 = await page.context().browser()?.newContext();

      if (!context1 || !context2) return;

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Login from first session
      await page1.goto('/login');
      await page1.fill('[data-testid="email"]', 'admin@gcmckaj.com');
      await page1.fill('[data-testid="password"]', 'SecureAdmin123!');
      await page1.click('[data-testid="loginButton"]');
      await page1.waitForURL('**/dashboard');

      // Login from second session with same credentials
      await page2.goto('/login');
      await page2.fill('[data-testid="email"]', 'admin@gcmckaj.com');
      await page2.fill('[data-testid="password"]', 'SecureAdmin123!');
      await page2.click('[data-testid="loginButton"]');
      await page2.waitForURL('**/dashboard');

      // First session should be invalidated
      await page1.reload();
      await expect(page1).toHaveURL(/\/login/);

      await context1.close();
      await context2.close();
    });
  });

  test.describe('Password Reset Workflow', () => {
    test('@critical should initiate password reset', async () => {
      await page.goto('/login');

      // Click forgot password link
      await page.click('[data-testid="forgot-password-link"]');

      // Should navigate to password reset page
      await expect(page).toHaveURL(/\/forgot-password/);

      // Enter email and submit
      await page.fill('[data-testid="reset-email"]', 'admin@gcmckaj.com');
      await page.click('[data-testid="send-reset-button"]');

      // Should show confirmation message
      await expect(page.locator('[data-testid="reset-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="reset-confirmation"]')).toContainText(/reset link sent/i);
    });

    test('@negative should validate email format for password reset', async () => {
      await page.goto('/forgot-password');

      await page.fill('[data-testid="reset-email"]', 'invalid-email');
      await page.click('[data-testid="send-reset-button"]');

      // Should show email validation error
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    });
  });

  test.describe('Security Features', () => {
    test('@security should detect and prevent brute force attacks', async () => {
      await page.goto('/login');

      // Simulate multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
        await page.fill('[data-testid="password"]', 'wrongpassword');
        await page.click('[data-testid="loginButton"]');
        await page.waitForTimeout(500);
      }

      // Should show security warning or CAPTCHA
      await expect(
        page.locator('[data-testid="security-warning"]').or(
          page.locator('[data-testid="captcha"]')
        )
      ).toBeVisible();
    });

    test('@security should enforce secure password requirements', async () => {
      await page.goto('/register');

      const weakPasswords = [
        'password',      // Common password
        '123456',        // Too simple
        'abc',           // Too short
        'PASSWORD123',   // No special characters
        'password123!'   // No uppercase
      ];

      for (const password of weakPasswords) {
        await page.fill('[data-testid="password"]', password);
        await page.fill('[data-testid="confirmPassword"]', password);

        // Should show password strength warning
        await expect(page.locator('[data-testid="password-strength"]')).toBeVisible();
        await expect(page.locator('[data-testid="password-strength"]')).toContainText(/weak|too simple/i);

        await page.fill('[data-testid="password"]', '');
        await page.fill('[data-testid="confirmPassword"]', '');
      }
    });

    test('@security should implement CSRF protection', async () => {
      // Login successfully
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'admin@gcmckaj.com');
      await page.fill('[data-testid="password"]', 'SecureAdmin123!');
      await page.click('[data-testid="loginButton"]');

      await page.waitForURL('**/dashboard');

      // Try to make a form submission without proper CSRF token
      const response = await page.request.post('/api/clients', {
        data: {
          name: 'Test Client',
          email: 'test@example.com'
        }
      });

      // Should reject request without proper CSRF token
      expect(response.status()).toBe(403);
    });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Logout if logged in
    try {
      const userMenu = page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.click('[data-testid="logout-button"]');
      }
    } catch (error) {
      // Ignore errors during cleanup
    }

    // Clear auth state
    await page.context().clearCookies();
  });
});