import React from 'react';
import Navbar from '../components/Navbar';
import PropertyList from '../components/PropertyList';
import Layout from '../components/Layout';

const TenantDashboard = () => {
  return (
    <Layout>
      <Navbar />
      <div className="container mt-5">
        <h2>Tenant Dashboard</h2>
        <PropertyList />
      </div>
    </Layout>
  );
};

export default TenantDashboard;