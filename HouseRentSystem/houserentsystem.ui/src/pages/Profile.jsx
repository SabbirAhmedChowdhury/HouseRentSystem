import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const Profile = () => {
    const { user, login } = useContext(AuthContext);
    const [form, setForm] = useState({
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
            setForm({
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
                currentPassword: '',
                newPassword: '',
            });
        } else {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/User/profile');
            const profile = res.data;
            login(profile, localStorage.getItem('token'));
            setForm({
                fullName: profile.fullName,
                phoneNumber: profile.phoneNumber,
                currentPassword: '',
                newPassword: '',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load profile');
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                fullName: form.fullName,
                phoneNumber: form.phoneNumber,
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            };
            const response = await api.put('/User/profile', updateData);
            login(response.data, localStorage.getItem('token')); // Update context with new profile
            setSuccess('Profile updated successfully');
            setForm({
                ...form,
                currentPassword: '',
                newPassword: '',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        }
    };

    return (
        <Layout>
            <div className="container my-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-lg">
                            <div className="card-header bg-primary text-white">
                                <h4 className="mb-0">
                                    <i className="bi bi-person-circle me-2"></i>
                                    My Profile
                                </h4>
                            </div>
                            <div className="card-body p-5">
                                {/* Avatar + Name */}
                                <div className="text-center mb-4">
                                    <div
                                        className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                                        style={{ width: 100, height: 100, fontSize: '2.5rem' }}
                                    >
                                        {user?.fullName?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <h5 className="mt-3">{user?.fullName}</h5>
                                    <p className="text-muted">{user?.email}</p>
                                    <span className="badge bg-success fs-6">{user?.role}</span>
                                </div>

                                {error && <div className="alert alert-danger">{error}</div>}
                                {success && <div className="alert alert-success">{success}</div>}

                                <form onSubmit={handleSubmit} className="mt-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Full Name</label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                className="form-control"
                                                required
                                                value={form.fullName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                className="form-control"
                                                required
                                                value={form.phoneNumber}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Current Password (optional)</label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                className="form-control"
                                                value={form.currentPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">New Password (optional)</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                className="form-control"
                                                value={form.newPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 text-end">
                                        <button type="submit" className="btn btn-primary px-5">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>

                                <hr className="my-5" />

                                <h6>Account Details</h6>
                                <ul className="list-group list-group-flush">
                                    <li className="list-group-item d-flex justify-content-between">
                                        <span>NID</span>
                                        <strong>{user?.nid}</strong>
                                    </li>
                                    <li className="list-group-item d-flex justify-content-between">
                                        <span>NID Verified</span>
                                        <span className={`badge ${user?.isNIDVerified ? 'bg-success' : 'bg-warning'}`}>
                                            {user?.isNIDVerified ? 'Yes' : 'No'}
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;