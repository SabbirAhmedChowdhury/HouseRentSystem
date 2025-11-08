/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const PropertyDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [property, setProperty] = useState(null);
    const [lease, setLease] = useState(null);
    const [leaseForm, setLeaseForm] = useState({
        startDate: '',
        endDate: '',
        monthlyRent: '',
        termsAndConditions: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLeaseForm, setShowLeaseForm] = useState(false);
    const [renewDate, setRenewDate] = useState('');

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/Property/${id}`);
            setProperty(response.data);
            setLeaseForm({ ...leaseForm, monthlyRent: response.data.rentAmount });
            const leaseResponse = await api.get(`/Lease/property/${id}`);
            if (leaseResponse.data.length > 0) {
                setLease(leaseResponse.data[0]);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load property');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaseChange = (e) => {
        setLeaseForm({ ...leaseForm, [e.target.name]: e.target.value });
    };

    const handleCreateLease = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/Lease', {
                startDate: leaseForm.startDate,
                endDate: leaseForm.endDate,
                monthlyRent: leaseForm.monthlyRent,
                termsAndConditions: leaseForm.termsAndConditions,
                propertyId: id,
                tenantId: user.userId,
            });
            setLease(response.data);
            setShowLeaseForm(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create lease');
        }
    };

    const handleEndLease = async () => {
        try {
            await api.put(`/Lease/${lease.leaseId}/end`);
            setLease(null);
            fetchProperty();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to end lease');
        }
    };

    const handleRenewLease = async () => {
        try {
            await api.put(`/Lease/${lease.leaseId}/renew`, { newEndDate: renewDate });
            fetchProperty();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to renew lease');
        }
    };

    const handleDownloadDocument = async () => {
        try {
            const response = await api.get(`/Lease/${lease.leaseId}/document`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'lease_document.pdf');
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to download document');
        }
    };

    const handleDelete = async () => {
        if (!property.isAvailable) {
            setError('Cannot delete an occupied property');
            return;
        }
        if (window.confirm('Are you sure you want to delete this property?')) {
            try {
                await api.delete(`/Property/${id}`);
                navigate('/landlord-dashboard');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete property');
            }
        }
    };

    if (isLoading) {
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

    if (error || !property) {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="alert alert-danger text-center">
                        {error || 'Property not found'}
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-5">
                <div className="row">
                    {/* Image Gallery */}
                    <div className="col-lg-6 mb-4">
                        <div className="card border-0 shadow-lg">
                            {property.images && property.images.length > 0 ? (
                                <div id="propertyCarousel" className="carousel slide">
                                    <div className="carousel-inner">
                                        {property.images.map((img, index) => (
                                            <div
                                                key={index}
                                                className={`carousel-item ${index === 0 ? 'active' : ''}`}
                                            >
                                                <img
                                                    src={img}
                                                    className="d-block w-100"
                                                    alt={`Property ${index + 1}`}
                                                    style={{ height: '400px', objectFit: 'cover' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {property.images.length > 1 && (
                                        <>
                                            <button
                                                className="carousel-control-prev"
                                                type="button"
                                                data-bs-target="#propertyCarousel"
                                                data-bs-slide="prev"
                                            >
                                                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                                <span className="visually-hidden">Previous</span>
                                            </button>
                                            <button
                                                className="carousel-control-next"
                                                type="button"
                                                data-bs-target="#propertyCarousel"
                                                data-bs-slide="next"
                                            >
                                                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                                <span className="visually-hidden">Next</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className="d-flex align-items-center justify-content-center bg-light"
                                    style={{ height: '400px' }}
                                >
                                    <i className="bi bi-house fs-1 text-muted"></i>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Property Info */}
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-lg h-100">
                            <div className="card-body p-5">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h3 className="card-title mb-0">{property.address}</h3>
                                    <span
                                        className={`badge fs-6 ${property.isAvailable ? 'bg-success' : 'bg-secondary'
                                            }`}
                                    >
                                        {property.isAvailable ? 'Available' : 'Occupied'}
                                    </span>
                                </div>
                                <p className="text-muted mb-3">
                                    <i className="bi bi-geo-alt"></i> {property.city}
                                </p>

                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <div className="bg-light p-3 rounded text-center">
                                            <h5 className="mb-1 text-primary">
                                                BDT {property.rentAmount.toLocaleString()}
                                            </h5>
                                            <small className="text-muted">Monthly Rent</small>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="bg-light p-3 rounded text-center">
                                            <h5 className="mb-1 text-primary">
                                                BDT {property.securityDeposit.toLocaleString()}
                                            </h5>
                                            <small className="text-muted">Security Deposit</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <p className="mb-1">
                                            <i className="bi bi-bed text-primary"></i>{' '}
                                            <strong>{property.bedrooms}</strong> Bedrooms
                                        </p>
                                    </div>
                                    <div className="col-6">
                                        <p className="mb-1">
                                            <i className="bi bi-droplet text-primary"></i>{' '}
                                            <strong>{property.bathrooms}</strong> Bathrooms
                                        </p>
                                    </div>
                                </div>

                                {property.amenities && (
                                    <div className="mb-4">
                                        <h6 className="text-primary">Amenities</h6>
                                        <p className="small text-muted">{property.amenities}</p>
                                    </div>
                                )}

                                {property.description && (
                                    <div className="mb-4">
                                        <h6 className="text-primary">Description</h6>
                                        <p className="text-muted">{property.description}</p>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <h6 className="text-primary">Landlord</h6>
                                    <p className="mb-0">{property.landlordName}</p>
                                </div>

                                <hr />

                                <div className="d-flex gap-2">
                                    <Link
                                        to="/properties"
                                        className="btn btn-outline-secondary flex-fill"
                                    >
                                        Back to List
                                    </Link>

                                    {(user?.role === 'Landlord' || user?.role === 'Admin') && (
                                        <>
                                            <Link
                                                to={`/property/edit/${id}`}
                                                className="btn btn-primary flex-fill"
                                            >
                                                <i className="bi bi-pencil me-1"></i> Edit
                                            </Link>
                                            <button
                                                className="btn btn-danger flex-fill"
                                                onClick={handleDelete}
                                                disabled={!property.isAvailable}
                                                title={
                                                    !property.isAvailable
                                                        ? 'Cannot delete occupied property'
                                                        : 'Delete property'
                                                }
                                            >
                                                <i className="bi bi-trash me-1"></i> Delete
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Lease Section */}
                                <div className="mt-4">
                                    <h6 className="text-primary">Lease Information</h6>
                                    {lease ? (
                                        <div>
                                            <p>Lease ID: {lease.leaseId}</p>
                                            <p>Start Date: {new Date(lease.startDate).toLocaleDateString()}</p>
                                            <p>End Date: {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Open-ended'}</p>
                                            <p>Monthly Rent: {lease.monthlyRent}</p>
                                            {lease.termsAndConditions && (
                                                <p>Terms and Conditions: {lease.termsAndConditions}</p>
                                            )}
                                            <button onClick={handleDownloadDocument} className="btn btn-primary">Download Lease Document</button>
                                            <div className="mt-3">
                                                <label className="form-label">New End Date for Renewal</label>
                                                <input type="date" className="form-control" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} />
                                                <button onClick={handleRenewLease} className="btn btn-primary mt-2">Renew Lease</button>
                                            </div>
                                            <button onClick={handleEndLease} className="btn btn-danger mt-2">End Lease</button>
                                        </div>
                                    ) : (
                                        <p>No current lease for this property.</p>
                                    )}
                                </div>

                                {/*{deleteError && (*/}
                                {/*    <div className="alert alert-danger mt-3 small">{deleteError}</div>*/}
                                {/*)}*/}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PropertyDetails;