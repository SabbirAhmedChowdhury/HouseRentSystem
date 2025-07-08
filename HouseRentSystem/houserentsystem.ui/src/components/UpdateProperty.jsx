import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const UpdateProperty = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    rentAmount: '',
    securityDeposit: '',
    bedrooms: '',
    bathrooms: '',
    amenities: '',
    description: '',
    isAvailable: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await api.get(`/Property/${id}`);
      setFormData({
        address: response.data.address,
        city: response.data.city,
        rentAmount: response.data.rentAmount,
        securityDeposit: response.data.securityDeposit,
        bedrooms: response.data.bedrooms,
        bathrooms: response.data.bathrooms,
        amenities: response.data.amenities || '',
        description: response.data.description || '',
        isAvailable: response.data.isAvailable,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load property');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Landlord' && user?.role !== 'Admin') {
      setError('Unauthorized: Only landlords or admins can update properties');
      return;
    }
    try {
      await api.put(`/Property/${id}`, formData);
      setSuccess('Property updated successfully');
      setTimeout(() => navigate('/landlord-dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update property');
    }
  };

  return (
    <div className="container mt-5">
      <div className="auth-container">
        <h2 className="auth-header">Update Property</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">City</label>
            <input
              type="text"
              name="city"
              className="form-control"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Rent Amount</label>
            <input
              type="number"
              name="rentAmount"
              className="form-control"
              value={formData.rentAmount}
              onChange={handleChange}
              min="1000"
              max="1000000"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Security Deposit</label>
            <input
              type="number"
              name="securityDeposit"
              className="form-control"
              value={formData.securityDeposit}
              onChange={handleChange}
              min="0"
              max="1000000"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Bedrooms</label>
            <input
              type="number"
              name="bedrooms"
              className="form-control"
              value={formData.bedrooms}
              onChange={handleChange}
              min="1"
              max="10"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Bathrooms</label>
            <input
              type="number"
              name="bathrooms"
              className="form-control"
              value={formData.bathrooms}
              onChange={handleChange}
              min="1"
              max="10"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Amenities</label>
            <textarea
              name="amenities"
              className="form-control"
              value={formData.amenities}
              onChange={handleChange}
              maxLength="500"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              maxLength="1000"
            />
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              name="isAvailable"
              className="form-check-input"
              checked={formData.isAvailable}
              onChange={handleChange}
            />
            <label className="form-check-label">Available</label>
          </div>
          <button type="submit" className="btn btn-primary w-100">Update Property</button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProperty;