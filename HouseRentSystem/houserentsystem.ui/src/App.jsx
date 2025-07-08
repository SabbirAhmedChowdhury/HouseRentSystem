import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import LandlordDashboard from './pages/LandlordDashboard';
import TenantDashboard from './pages/TenantDashboard';
import AdminDashboard from './pages/AdminDashboard';
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
      </Routes>
    </Router>
  );
}

export default App;