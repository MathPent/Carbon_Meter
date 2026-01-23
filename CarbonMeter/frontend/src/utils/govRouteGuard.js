/**
 * Government Route Guard Utility
 * Ensures only government users can access government routes
 */

export const isGovernmentUser = (user) => {
  return user && user.role === 'Government';
};

export const getRedirectPath = (user) => {
  if (!user) return '/auth';
  
  switch (user.role) {
    case 'Government':
      return '/gov/dashboard';
    case 'Industry':
    case 'Individual':
    default:
      return '/dashboard';
  }
};

export const canAccessRoute = (user, routePrefix) => {
  if (!user) return false;
  
  if (routePrefix === '/gov') {
    return user.role === 'Government';
  }
  
  if (routePrefix === '/dashboard' || routePrefix === '/log-activity') {
    return user.role === 'Individual' || user.role === 'Industry';
  }
  
  return true;
};
