import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const AdminDashboard = () => {
    return (
        <Layout>
          <div className="container mt-5">
            <h2>Admin Dashboard</h2>
            {/*<Link to="/property/create" className="btn btn-primary mb-3">*/}
            {/*  Create New Property*/}
            {/*</Link>*/}
            {/*<PropertyList />*/}
          </div>
        </Layout>
  );
};

export default AdminDashboard;