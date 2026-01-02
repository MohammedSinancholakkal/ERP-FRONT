import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasPermission } from '../utils/permissionUtils';

const ProtectedRoute = ({ children, permission }) => {
  const location = useLocation();

  // 1. Check for Token (Authentication)
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. Check for Permission (Authorization)
  // If no permission key is passed, allow access (but User IS authenticated)
  if (!permission) {
    return children;
  }

  if (!hasPermission(permission)) {
    // Redirect to dashboard if unauthorized
    // You might want to show a Toast or "Restricted" page instead, but redirect is what was requested
    return <Navigate to="/app/dashboard" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
