import React from 'react';
import Navbar from '../components/Navbar';
import PropertyList from '../components/PropertyList';

const TenantDashboard = () => {
  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <h2>Tenant Dashboard</h2>
        <PropertyList />
      </div>
    </div>
  );
};

export default TenantDashboard;