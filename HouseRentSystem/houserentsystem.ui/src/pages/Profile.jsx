import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        currentPassword: '',
        newPassword: '',
      });
    } else {
      // Fetch profile if user is not in context
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/User/profile');
      login(response.data, localStorage.getItem('token')); // Update context
      setFormData({
        fullName: response.data.fullName,
        phoneNumber: response.data.phoneNumber,
        currentPassword: '',
        newPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };
      const response = await api.put('/User/profile', updateData);
      login(response.data, localStorage.getItem('token')); // Update context with new profile
      setSuccess('Profile updated successfully');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <div className="auth-container">
          <h2 className="auth-header">User Profile</h2>
          {error && <div className="error-message mb-3">{error}</div>}
          {success && <div className="alert alert-success mb-3">{success}</div>}
          {user && (
            <div className="mb-3">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>NID:</strong> {user.nid}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>NID Verified:</strong> {user.isNIDVerified ? 'Yes' : 'No'}</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-control"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                className="form-control"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Current Password (if changing password)</label>
              <input
                type="password"
                name="currentPassword"
                className="form-control"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">New Password (if changing password)</label>
              <input
                type="password"
                name="newPassword"
                className="form-control"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Update Profile</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;