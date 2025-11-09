import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/properties" element={<PropertyList />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/property/create" element={<CreateProperty />} />
        <Route path="/property/edit/:id" element={<UpdateProperty />} />
        <Route path="/property/:id/images" element={<UploadPropertyImages />} />
        <Route path="/maintenance/request" element={<CreateMaintenanceRequest />} />
        <Route path="/tenant-lease-management" element={<TenantLeaseManagement />} />
        <Route path="/landlord-lease-management" element={<LandlordLeaseManagement />} />
        <Route path="/tenant-payment-management" element={<TenantPaymentManagement />} />
        <Route path="/landlord-payment-management" element={<LandlordPaymentManagement />} />
        <Route path="/lease/create" element={<CreateLease />} />
      </Routes>
    </Router>
  );
}

export default App;