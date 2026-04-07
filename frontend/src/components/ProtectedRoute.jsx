/**
 * ProtectedRoute — Road Trip Planner
 *
 * Usage:
 *   <ProtectedRoute>               → requires login only
 *   <ProtectedRoute role="admin">  → requires admin role
 *
 * Redirects to /login if not authenticated.
 * Redirects to /dashboard if authenticated but wrong role.
 */

import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const stored = localStorage.getItem('user');

  if (!token || !stored) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try { user = JSON.parse(stored); } catch {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Authenticated but wrong role — send back to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}