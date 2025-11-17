/* eslint-disable no-unused-vars */
/**
 * Landlord Lease Management Page
 * Allows landlords to view all leases for their properties, create new leases, renew, and end leases
 */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const LandlordLeaseManagement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [leases, setLeases] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [renewDates, setRenewDates] = useState({});
    const [filterProperty, setFilterProperty] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    /**
     * Fetches all properties and leases for the landlord
     */
    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch properties
            const propsRes = await api.get(`/Property/landlord/${user.userId}`);
            const propertiesList = propsRes.data || [];
            setProperties(propertiesList);

            // Fetch leases for all properties
            const allLeases = [];
            for (const prop of propertiesList) {
                try {
                    const leaseRes = await api.get(`/Lease/property/${prop.propertyId}`);
                    if (leaseRes.data && Array.isArray(leaseRes.data)) {
                        allLeases.push(...leaseRes.data);
                    }
                } catch (err) {
                    // Property might not have leases
                }
            }
            setLeases(allLeases);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Ends an active lease
     * @param {number} leaseId - The ID of the lease to end
     */
    const handleEndLease = async (leaseId) => {
        if (!window.confirm('Are you sure you want to end this lease? This will make the property available again.')) {
            return;
        }
        try {
            await api.put(`/Lease/${leaseId}/end`);
            fetchData();
            alert('Lease ended successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to end lease');
        }
    };

    /**
     * Renews a lease by extending the end date
     * @param {number} leaseId - The ID of the lease to renew
     */
    const handleRenewLease = async (leaseId) => {
        const newEndDate = renewDates[leaseId];
        if (!newEndDate) {
            alert('Please select a new end date');
            return;
        }
        if (new Date(newEndDate) <= new Date()) {
            alert('New end date must be in the future');
            return;
        }
        try {
            await api.put(`/Lease/${leaseId}/renew`, { newEndDate });
            setRenewDates({ ...renewDates, [leaseId]: '' });
            fetchData();
            alert('Lease renewed successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to renew lease');
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
     * Filters leases based on property and status
     */
    const filteredLeases = leases.filter((lease) => {
        const matchesProperty = filterProperty === 'all' || lease.propertyId === parseInt(filterProperty);
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'active' && lease.isActive) ||
            (filterStatus === 'inactive' && !lease.isActive);
        return matchesProperty && matchesStatus;
    });

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
                <div className="mb-5 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="display-5 fw-bold text-primary">Lease Management</h1>
                        <p className="lead text-muted">Manage all leases for your properties</p>
                    </div>
                    <Link to="/lease/create" className="btn btn-primary btn-lg">
                        <i className="bi bi-plus-circle me-2"></i>
                        Create New Lease
                    </Link>
                </div>

                {error && (
                    <div className="alert alert-danger text-center">{error}</div>
                )}

                {/* Filters */}
                <div className="card border-0 shadow-lg mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Filter by Property</label>
                                <select
                                    className="form-select"
                                    value={filterProperty}
                                    onChange={(e) => setFilterProperty(e.target.value)}
                                >
                                    <option value="all">All Properties</option>
                                    {properties.map((prop) => (
                                        <option key={prop.propertyId} value={prop.propertyId}>
                                            {prop.address}, {prop.city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Filter by Status</label>
                                <select
                                    className="form-select"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leases Table */}
                <div className="card border-0 shadow-lg">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-list-ul me-2"></i>
                            All Leases ({filteredLeases.length})
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        {filteredLeases.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-file-earmark display-1 d-block mb-3"></i>
                                <p>No leases found matching your filters.</p>
                                <Link to="/lease/create" className="btn btn-primary">
                                    Create New Lease
                                </Link>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Property</th>
                                            <th>Tenant</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Monthly Rent</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeases.map((lease) => (
                                            <tr key={lease.leaseId}>
                                                <td>
                                                    <strong>{lease.property?.address || 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">{lease.property?.city || ''}</small>
                                                </td>
                                                <td>
                                                    {lease.tenant?.fullName || `Tenant #${lease.tenantId}`}
                                                    <br />
                                                    <small className="text-muted">{lease.tenant?.email || ''}</small>
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
                                                    <div className="d-flex flex-column gap-2">
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
                                                            {lease.isActive && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleEndLease(lease.leaseId)}
                                                                    title="End Lease"
                                                                >
                                                                    <i className="bi bi-x-circle"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                        {lease.isActive && lease.endDate && (
                                                            <div className="d-flex gap-1">
                                                                <input
                                                                    type="date"
                                                                    className="form-control form-control-sm"
                                                                    value={renewDates[lease.leaseId] || ''}
                                                                    onChange={(e) =>
                                                                        setRenewDates({
                                                                            ...renewDates,
                                                                            [lease.leaseId]: e.target.value,
                                                                        })
                                                                    }
                                                                    min={lease.endDate ? new Date(lease.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                                                    placeholder="New end date"
                                                                />
                                                                <button
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => handleRenewLease(lease.leaseId)}
                                                                    disabled={!renewDates[lease.leaseId]}
                                                                >
                                                                    <i className="bi bi-arrow-repeat"></i> Renew
                                                                </button>
                                                            </div>
                                                        )}
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

export default LandlordLeaseManagement;

