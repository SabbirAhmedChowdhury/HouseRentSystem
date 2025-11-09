/**
 * Navigation utility functions
 * Centralized navigation helpers for consistent routing
 */

/**
 * Get the dashboard route based on user role
 * @param {string} role - User role (Landlord, Tenant, Admin)
 * @returns {string} Dashboard route path
 */
export const getDashboardRoute = (role) => {
    const roleRoutes = {
        'Landlord': '/landlord-dashboard',
        'Tenant': '/tenant-dashboard',
        'Admin': '/admin-dashboard'
    };
    return roleRoutes[role] || '/properties';
};

/**
 * Get the appropriate "back" route based on user role
 * For landlords: landlord dashboard
 * For tenants: properties list
 * @param {string} role - User role
 * @returns {string} Back route path
 */
export const getBackRoute = (role) => {
    if (role === 'Landlord' || role === 'Admin') {
        return '/landlord-dashboard';
    }
    return '/properties';
};

export default {
    getDashboardRoute,
    getBackRoute
};

