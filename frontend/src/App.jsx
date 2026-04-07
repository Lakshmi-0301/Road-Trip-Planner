import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TripResult from './pages/TripResult';
import TripHistory from './pages/TripHistory';
import Profile from './pages/Profile';
import Budget from './pages/Budget';
import SavedRoutes from './pages/SavedRoutes';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/trip-result" element={<TripResult />} />
        <Route path="/history"   element={<ProtectedRoute><TripHistory /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/budget"    element={<ProtectedRoute><Budget /></ProtectedRoute>} />
        <Route path="/saved-routes" element={<SavedRoutes />} />
        {/* catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}