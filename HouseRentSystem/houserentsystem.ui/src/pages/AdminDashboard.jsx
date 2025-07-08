import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PropertyList from '../components/PropertyList';

const AdminDashboard = () => {
  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <h2>Admin Dashboard</h2>
        <Link to="/property/create" className="btn btn-primary mb-3">
          Create New Property
        </Link>
        <PropertyList />
      </div>
    </div>
  );
};

export default AdminDashboard;