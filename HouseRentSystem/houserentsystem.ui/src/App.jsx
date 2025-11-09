import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import LandlordDashboard from './pages/LandlordDashboard';
import TenantDashboard from './pages/TenantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateMaintenanceRequest from './pages/CreateMaintenanceRequest';
import TenantLeaseManagement from './pages/TenantLeaseManagement';
import LandlordLeaseManagement from './pages/LandlordLeaseManagement';
import TenantPaymentManagement from './pages/TenantPaymentManagement';
import LandlordPaymentManagement from './pages/LandlordPaymentManagement';
import CreateLease from './pages/CreateLease';
import PropertyList from './components/PropertyList';
import PropertyDetails from './components/PropertyDetails';
import CreateProperty from './components/CreateProperty';
import UpdateProperty from './components/UpdateProperty';
import UploadPropertyImages from './components/UploadPropertyImages';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - redirect to dashboard if already logged in */}
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        {/* Protected routes - require authentication */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/landlord-dashboard" element={<ProtectedRoute allowedRoles={['Landlord', 'Admin']}><LandlordDashboard /></ProtectedRoute>} />
        <Route path="/tenant-dashboard" element={<ProtectedRoute allowedRoles={['Tenant']}><TenantDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
        
        {/* Property routes - accessible to all authenticated users */}
        <Route path="/properties" element={<ProtectedRoute><PropertyList /></ProtectedRoute>} />
        <Route path="/property/:id" element={<ProtectedRoute><PropertyDetails /></ProtectedRoute>} />
        
        {/* Landlord-only routes */}
        <Route path="/property/create" element={<ProtectedRoute allowedRoles={['Landlord', 'Admin']}><CreateProperty /></ProtectedRoute>} />
        <Route path="/property/edit/:id" element={<ProtectedRoute allowedRoles={['Landlord', 'Admin']}><UpdateProperty /></ProtectedRoute>} />
        <Route path="/property/:id/images" element={<ProtectedRoute allowedRoles={['Landlord', 'Admin']}><UploadPropertyImages /></ProtectedRoute>} />
        <Route path="/landlord-lease-management" element={<ProtectedRoute allowedRoles={['Landlord', 'Admin']}><LandlordLeaseManagement /></ProtectedRoute>} />
        <Route path="/landlord-payment-management" element={<ProtectedRoute allowedRoles={['Landlord', 'Admin']}><LandlordPaymentManagement /></ProtectedRoute>} />
        <Route path="/lease/create" element={<ProtectedRoute allowedRoles={['Landlord', 'Admin']}><CreateLease /></ProtectedRoute>} />
        
        {/* Tenant routes */}
        <Route path="/maintenance/request" element={<ProtectedRoute allowedRoles={['Tenant']}><CreateMaintenanceRequest /></ProtectedRoute>} />
        <Route path="/tenant-lease-management" element={<ProtectedRoute allowedRoles={['Tenant']}><TenantLeaseManagement /></ProtectedRoute>} />
        <Route path="/tenant-payment-management" element={<ProtectedRoute allowedRoles={['Tenant']}><TenantPaymentManagement /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;