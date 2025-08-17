import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }

      if (requireAdmin && !isAdmin()) {
        // Redirect to library if user is not admin but admin access is required
        router.push('/library');
        return;
      }

      // Check if user account is still valid
      if (user && user.status !== 'active') {
        router.push('/login');
        return;
      }

      // Check if user account has expired
      if (user && user.expiryDate && new Date(user.expiryDate) < new Date()) {
        router.push('/login');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, router, isAdmin]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or if admin is required but user is not admin
  if (!isAuthenticated || (requireAdmin && !isAdmin())) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Check if user account is inactive or expired
  if (user && (user.status !== 'active' || (user.expiryDate && new Date(user.expiryDate) < new Date()))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Account Access Restricted
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {user.status !== 'active' 
                ? 'Your account has been deactivated. Please contact support.'
                : 'Your account has expired. Please contact support for renewal.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;