/* eslint-disable no-unused-vars */
/**
 * Tenant Lease Management Page
 * Allows tenants to view their lease history, active leases, and manage lease-related actions
 */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const TenantLeaseManagement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [leases, setLeases] = useState([]);
    const [activeLease, setActiveLease] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [renewDate, setRenewDate] = useState('');

    useEffect(() => {
        fetchLeases();
    }, []);

    /**
     * Fetches all leases for the current tenant
     * Separates active and inactive leases
     */
    const fetchLeases = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch all leases for the tenant
            const leasesRes = await api.get(`/Lease/tenant/${user.userId}`);
            const allLeases = Array.isArray(leasesRes.data) ? leasesRes.data : [];
            setLeases(allLeases);

            // Fetch active lease separately
            try {
                const activeRes = await api.get(`/Lease/tenant/${user.userId}/active`);
                setActiveLease(activeRes.data);
            } catch (err) {
                // No active lease found
                setActiveLease(null);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load leases');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Downloads the lease document as a PDF
     * @param {number} leaseId - The ID of the lease to download
     */
    const handleDownloadDocument = async (leaseId) => {
        try {
            const response = await api.get(`/Lease/${leaseId}/document`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Lease_${leaseId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to download document');
        }
    };

    /**
     * Ends an active lease
     * @param {number} leaseId - The ID of the lease to end
     */
    const handleEndLease = async (leaseId) => {
        if (!window.confirm('Are you sure you want to end this lease? This action cannot be undone.')) {
            return;
        }
        try {
            await api.put(`/Lease/${leaseId}/end`);
            fetchLeases();
            alert('Lease ended successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to end lease');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="container py-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-5">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="display-5 fw-bold text-primary">My Leases</h1>
                    <p className="lead text-muted">Manage your rental agreements</p>
                </div>

                {error && (
                    <div className="alert alert-danger text-center">{error}</div>
                )}

                {/* Active Lease Section */}
                {activeLease && (
                    <div className="card border-0 shadow-lg mb-5">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-check-circle me-2"></i>
                                Active Lease
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <h6 className="text-primary">Property Information</h6>
                                    <p className="mb-1">
                                        <strong>Address:</strong> {activeLease.property?.address || 'N/A'}, {activeLease.property?.city || ''}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Property ID:</strong> {activeLease.propertyId}
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="text-primary">Lease Details</h6>
                                    <p className="mb-1">
                                        <strong>Monthly Rent:</strong> BDT {activeLease.monthlyRent?.toLocaleString() || '0'}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Start Date:</strong> {new Date(activeLease.startDate).toLocaleDateString()}
                                    </p>
                                    <p className="mb-1">
                                        <strong>End Date:</strong> {activeLease.endDate ? new Date(activeLease.endDate).toLocaleDateString() : 'Open-ended'}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Status:</strong>{' '}
                                        <span className="badge bg-success">Active</span>
                                    </p>
                                </div>
                            </div>
                            {activeLease.termsAndConditions && (
                                <div className="mt-3">
                                    <h6 className="text-primary">Terms and Conditions</h6>
                                    <p className="text-muted">{activeLease.termsAndConditions}</p>
                                </div>
                            )}
                            <div className="mt-4 d-flex gap-2">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleDownloadDocument(activeLease.leaseId)}
                                >
                                    <i className="bi bi-download me-1"></i>
                                    Download Lease Document
                                </button>
                                <Link
                                    to={`/property/${activeLease.propertyId}`}
                                    className="btn btn-outline-primary"
                                >
                                    <i className="bi bi-house me-1"></i>
                                    View Property
                                </Link>
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleEndLease(activeLease.leaseId)}
                                >
                                    <i className="bi bi-x-circle me-1"></i>
                                    End Lease
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Leases Section */}
                <div className="card border-0 shadow-lg">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-file-earmark-text me-2"></i>
                            Lease History
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        {leases.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-inbox display-1 d-block mb-3"></i>
                                <p>No lease history found.</p>
                                <Link to="/properties" className="btn btn-primary">
                                    Browse Properties
                                </Link>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Property</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Monthly Rent</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leases.map((lease) => (
                                            <tr key={lease.leaseId}>
                                                <td>
                                                    <strong>{lease.property?.address || 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">{lease.property?.city || ''}</small>
                                                </td>
                                                <td>{new Date(lease.startDate).toLocaleDateString()}</td>
                                                <td>{lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Open-ended'}</td>
                                                <td>BDT {lease.monthlyRent?.toLocaleString() || '0'}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${lease.isActive ? 'bg-success' : 'bg-secondary'}`}
                                                    >
                                                        {lease.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleDownloadDocument(lease.leaseId)}
                                                            title="Download Document"
                                                        >
                                                            <i className="bi bi-download"></i>
                                                        </button>
                                                        <Link
                                                            to={`/property/${lease.propertyId}`}
                                                            className="btn btn-sm btn-outline-info"
                                                            title="View Property"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TenantLeaseManagement;

