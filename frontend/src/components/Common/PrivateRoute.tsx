/**
 * Private Route Component
 * Protects routes that require authentication
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { authService } from '../../services/auth';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requireAdmin = false }) => {
  const location = useLocation();

  // Check authentication status
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  const hasToken = localStorage.getItem('access_token');

  // If there's a token but user info is missing, try to load from storage
  if (hasToken && !authService.getCurrentUser()) {
    // Token exists but no user info - this shouldn't happen normally
    // Show loading briefly, then redirect to login
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if not admin but trying to access admin route
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
