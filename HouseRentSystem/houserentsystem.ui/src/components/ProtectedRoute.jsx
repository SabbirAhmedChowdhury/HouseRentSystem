/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 * Redirects to appropriate dashboard if user tries to access login while logged in
 * Note: Child components should already include Layout wrapper
 */
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/navigationUtils';

/**
 * ProtectedRoute - Requires authentication
 * @param {React.ReactNode} children - Child components to render (should already include Layout)
 * @param {string[]} allowedRoles - Optional array of allowed roles (if not provided, any authenticated user can access)
 */
export const ProtectedRoute = ({ children, allowedRoles = null }) => {
    const { user, isAuthenticated } = useContext(AuthContext);
    const location = useLocation();

    // If not authenticated, redirect to login with return path
    // Use replace to avoid adding login page to history when redirecting
    if (!isAuthenticated || !user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // If specific roles are required and user doesn't have one, redirect to their dashboard
    // Use replace to avoid cluttering browser history
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={getDashboardRoute(user.role)} replace />;
    }

    // User is authenticated and authorized, render children (children already have Layout)
    return <>{children}</>;
};

/**
 * PublicRoute - Redirects to dashboard if already logged in
 * Used for login/register pages
 * Note: Register uses Layout, Login doesn't
 */
export const PublicRoute = ({ children }) => {
    const { user, isAuthenticated } = useContext(AuthContext);

    // If already logged in, redirect to appropriate dashboard
    // Use replace: true to prevent back button from going to login when logged in
    if (isAuthenticated && user) {
        return <Navigate to={getDashboardRoute(user.role)} replace />;
    }

    // Not logged in, show public page
    return <>{children}</>;
};

export default ProtectedRoute;

