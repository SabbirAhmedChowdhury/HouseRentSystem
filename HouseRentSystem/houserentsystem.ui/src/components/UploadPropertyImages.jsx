import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const UploadPropertyImages = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Landlord' && user?.role !== 'Admin') {
      setError('Unauthorized: Only landlords or admins can upload images');
      return;
    }
    if (files.length === 0) {
      setError('Please select at least one image');
      return;
    }
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    try {
      await api.post(`/Property/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Images uploaded successfully');
      setFiles([]);
      setTimeout(() => navigate(`/property/${id}`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload images');
    }
  };

  return (
    <div className="container mt-5">
      <div className="auth-container">
        <h2 className="auth-header">Upload Property Images</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Select Images</label>
            <input
              type="file"
              className="form-control"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Upload Images</button>
        </form>
      </div>
    </div>
  );
};

export default UploadPropertyImages;