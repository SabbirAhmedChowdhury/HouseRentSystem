/* eslint-disable no-unused-vars */
// src/pages/TenantDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const TenantDashboard = () => {
    const { user } = useContext(AuthContext);
    const [lease, setLease] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch active lease first
            let activeLease = null;
            try {
                const activeRes = await api.get(`/Lease/tenant/${user.userId}/active`);
                activeLease = activeRes.data;
            } catch (err) {
                // No active lease found, try to get from all leases
                try {
                    const allLeasesRes = await api.get(`/Lease/tenant/${user.userId}`);
                    const allLeases = Array.isArray(allLeasesRes.data) ? allLeasesRes.data : [];
                    activeLease = allLeases.find(l => l.isActive) || null;
                } catch (err2) {
                    // No leases found
                }
            }
            setLease(activeLease);

            // Fetch maintenance requests
            const reqRes = await api.get(`/maintenance/tenant/${user.userId}`).catch(() => ({ data: [] }));
            setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            Pending: 'bg-warning',
            InProgress: 'bg-info',
            Resolved: 'bg-success',
        };
        return `badge ${map[status] || 'bg-secondary'}`;
    };

    return (
        <Layout>
            <div className="container py-5">
                <div className="text-center mb-5">
                    <h1 className="display-5 fw-bold text-primary">Hello, {user?.fullName}!</h1>
                    <p className="lead text-muted">Manage your tenancy</p>
                </div>

                {error && <div className="alert alert-danger text-center">{error}</div>}

                <div className="row g-4 mb-5">
                    {/* Current Lease */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-lg h-100">
                            <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">Current Lease</h5>
                            </div>
                            <div className="card-body">
                                {lease ? (
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p><strong>Property ID:</strong> {lease.propertyId}</p>
                                            <p><strong>Rent:</strong> BDT {lease.monthlyRent?.toLocaleString() || 'N/A'}/month</p>
                                            <p><strong>Start Date:</strong> {new Date(lease.startDate).toLocaleDateString()}</p>
                                            <p><strong>End Date:</strong> {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Open-ended'}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p><strong>Status:</strong> {lease.isActive ? 'Active' : 'Inactive'}</p>
                                            {lease.startDate && lease.endDate && (
                                                <>
                                                    <p><strong>Duration:</strong> {Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 30))} months</p>
                                                </>
                                            )}
                                            {lease.startDate && !lease.endDate && (
                                                <>
                                                    <p><strong>Duration:</strong> Open-ended lease</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-muted">No active lease.</p>
                                        <div className="d-flex gap-2">
                                            <Link to="/properties" className="btn btn-sm btn-primary">
                                                Browse Properties
                                            </Link>
                                            <Link to="/tenant-lease-management" className="btn btn-sm btn-outline-primary">
                                                View Lease History
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-lg h-100">
                            <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">Quick Actions</h5>
                            </div>
                            <div className="card-body d-grid gap-2">
                                <Link to="/tenant-lease-management" className="btn btn-primary">
                                    <i className="bi bi-file-earmark-text me-1"></i>
                                    Manage Leases
                                </Link>
                                <Link to="/maintenance/request" className="btn btn-outline-primary">
                                    <i className="bi bi-wrench me-1"></i>
                                    Report Issue
                                </Link>
                                <Link to="/properties" className="btn btn-outline-primary">
                                    <i className="bi bi-house me-1"></i>
                                    Browse Properties
                                </Link>
                                <Link to="/profile" className="btn btn-outline-secondary">
                                    <i className="bi bi-person me-1"></i>
                                    Update Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Maintenance Requests */}
                <div className="card border-0 shadow-lg">
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Maintenance Requests</h5>
                        <Link to="/maintenance/request" className="btn btn-sm btn-light">
                            New Request
                        </Link>
                    </div>
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-tools display-1 d-block mb-3"></i>
                                <p>No maintenance requests yet.</p>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {requests.map((r) => (
                                    <div
                                        key={r.requestId}
                                        className="list-group-item d-flex justify-content-between align-items-center"
                                    >
                                        <div>
                                            <strong>{r.description}</strong>
                                            <br />
                                            <small className="text-muted">
                                                {new Date(r.requestDate).toLocaleDateString()} � {r.property?.address || 'N/A'}
                                            </small>
                                        </div>
                                        <span className={getStatusBadge(r.status)}>
                                            {r.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TenantDashboard;