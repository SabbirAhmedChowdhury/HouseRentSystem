// src/pages/CreateMaintenanceRequest.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const CreateMaintenanceRequest = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        description: '',
        propertyId: '',
    });
    const [properties, setProperties] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await api.get(`/Lease/tenant/${user.userId}`);
            const leases = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
            const activeLease = leases.find(l => l.isActive) || leases[0];
            if (activeLease) {
                setForm({ ...form, propertyId: activeLease.propertyId });
            }
        } catch (err) {
            setError('Failed to load your leased property');
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        if (!window.confirm('Are you sure you want to create the maintenance request?')) {
            return;
        }
        e.preventDefault();
        if (!form.description.trim()) {
            setError('Description is required');
            return;
        }

        setLoading(true);
        try {
            await api.post('/maintenance', {
                description: form.description,
                propertyId: parseInt(form.propertyId),
                tenantId: user.userId,
            });
            setSuccess('Maintenance request submitted successfully!');
            setTimeout(() => navigate('/tenant-dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-lg">
                            <div className="card-header bg-primary text-white">
                                <h4 className="mb-0">
                                    Report Maintenance Issue
                                </h4>
                            </div>
                            <div className="card-body p-5">

                                {error && <div className="alert alert-danger">{error}</div>}
                                {success && <div className="alert alert-success">{success}</div>}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label">Property</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={form.propertyId ? `Property #${form.propertyId}` : 'Loading...'}
                                            disabled
                                        />
                                        <small className="text-muted">Your current leased property</small>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label">Describe the Issue</label>
                                        <textarea
                                            name="description"
                                            className="form-control"
                                            rows="6"
                                            placeholder="e.g., Leaking faucet in kitchen, AC not cooling..."
                                            value={form.description}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary flex-fill"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                'Submit Request'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary flex-fill"
                                            onClick={() => navigate(-1)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CreateMaintenanceRequest;