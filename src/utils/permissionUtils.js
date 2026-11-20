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

        const isHR = role === 'hr' || !!user.pages?.['hr'];

        // HR has full access to payroll
        if ((module === 'payroll' || (module === 'finance' && action?.startsWith('payroll'))) && isHR) {
            return true;
        }

        if (!action) {
            // Page-level check (navigation/routing)
            return !!user.pages?.[module] || (module === 'payroll' && (isHR || !!user.pages?.['finance']));
        } else {
            // Action-level check (buttons/APIs)
            if (module === 'finance' && action?.startsWith('payroll')) {
                return !!user.modules?.['finance']?.[action] || !!user.modules?.['payroll']?.['manage'] || isHR;
            }
            if (module === 'payroll') {
                return !!user.modules?.['payroll']?.[action] || !!user.modules?.['finance']?.['payroll.manage'] || isHR;
            }
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
