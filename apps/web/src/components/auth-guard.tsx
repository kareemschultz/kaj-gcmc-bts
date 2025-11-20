"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/login"
}: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const sessionResponse = await authClient.getSession();

        // Extract the actual session data from Better Auth client response structure
        const session = sessionResponse?.data || sessionResponse;

        const authenticated = !!(session?.user);
        setIsAuthenticated(authenticated);

        if (requireAuth && !authenticated) {
          router.push(redirectTo);
        }

      } catch (error) {
        console.error("💥 AuthGuard: Session check failed:", error);
        setIsAuthenticated(false);

        if (requireAuth) {
          router.push(redirectTo);
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [requireAuth, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-300 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render content
  // (redirect will happen in useEffect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If no auth required, or user is authenticated, render children
  return <>{children}</>;
}