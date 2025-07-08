import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const LandlordDashboard = () => {
  const { user } = useContext(AuthContext);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'Landlord') {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const response = await api.get(`/property/landlord/${user.userId}`);
      //setProperties(response.data.filter(p => p.landlordId === user.userId));
      setProperties(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load properties');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <h2>Landlord Dashboard</h2>
        <Link to="/property/create" className="btn btn-primary mb-3">
          Create New Property
        </Link>
        {error && <div className="alert alert-danger">{error}</div>}
        <h4>Your Properties</h4>
        <div className="row g-3">
          {properties.map((property) => (
            <div key={property.propertyId} className="col-md-4">
              <div className="card h-100">
                {property.thumbnail && (
                  <img
                    src={property.thumbnail}
                    className="card-img-top"
                    alt="Property"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{property.address}</h5>
                  <p className="card-text">{property.city}</p>
                  <p className="card-text">Rent: ${property.rentAmount}</p>
                  <p className="card-text">Bedrooms: {property.bedrooms}</p>
                  <p className="card-text">
                    Status: {property.isAvailable ? 'Available' : 'Occupied'}
                  </p>
                  <Link
                    to={`/property/${property.propertyId}`}
                    className="btn btn-primary"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandlordDashboard;