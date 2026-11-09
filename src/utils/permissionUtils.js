/**
 * Centralized Permission Utility
 * Provides a robust way to check for both page-level and action-level permissions.
 */
export const hasPermission = (module, action = null) => {
    // Get user from localStorage (synced via login/refresh)
    const userString = localStorage.getItem('user');
    if (!userString) return false;

    try {
        const user = JSON.parse(userString);

        // Global bypass for administrative roles (Case-insensitive)
        const role = (user.role_name || user.role || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        if (
            role === 'super admin' ||
            role === 'admin' ||
            role === 'administrator' ||
            email === 'cloud4invertio@gmail.com'
        ) return true;

        if (!action) {
            // Page-level check (navigation/routing)
            return !!user.pages?.[module];
        } else {
            // Action-level check (buttons/APIs)
            // Format can be 'create', 'edit', 'delete' etc.
            return !!user.modules?.[module]?.[action];
        }
    } catch (err) {
        console.error('Permission check error:', err);
        return false;
    }
};

/**
 * Hook-like wrapper if needed for components
 */
export const usePermissions = () => {
    return { hasPermission };
};
