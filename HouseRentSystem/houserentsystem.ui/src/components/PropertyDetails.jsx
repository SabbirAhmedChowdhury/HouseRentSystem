/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import { getImageUrl, getImageUrls } from '../utils/imageUtils';
import { getBackRoute, getDashboardRoute } from '../utils/navigationUtils';

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
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/Property/${id}`);
            const propertyData = response.data;
            
            // Normalize images - use imageDetails if available, fallback to images array
            // Convert relative paths to full URLs
            if (propertyData.imageDetails && propertyData.imageDetails.length > 0) {
                propertyData.images = getImageUrls(propertyData.imageDetails);
            } else if (propertyData.images && propertyData.images.length > 0) {
                propertyData.images = getImageUrls(propertyData.images);
            } else {
                propertyData.images = [];
            }
            
            setProperty(propertyData);
            setLeaseForm({ ...leaseForm, monthlyRent: propertyData.rentAmount });
            
            // Reset selected image index when property changes
            setSelectedImageIndex(0);
            
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
                                <>
                                    {/* Main Image Display */}
                                    <div className="position-relative" style={{ height: '400px', overflow: 'hidden' }}>
                                        <img
                                            src={property.images[selectedImageIndex]}
                                            className="w-100 h-100"
                                            alt={`Property ${selectedImageIndex + 1}`}
                                            style={{ objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => setShowImageModal(true)}
                                        />
                                        {property.images.length > 1 && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-light position-absolute top-50 start-0 m-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex((prev) => 
                                                            prev === 0 ? property.images.length - 1 : prev - 1
                                                        );
                                                    }}
                                                    title="Previous image"
                                                >
                                                    <i className="bi bi-chevron-left"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-light position-absolute top-50 end-0 m-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex((prev) => 
                                                            prev === property.images.length - 1 ? 0 : prev + 1
                                                        );
                                                    }}
                                                    title="Next image"
                                                >
                                                    <i className="bi bi-chevron-right"></i>
                                                </button>
                                                <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-50 text-white text-center p-2">
                                                    Image {selectedImageIndex + 1} of {property.images.length}
                                                    <button
                                                        className="btn btn-sm btn-light ms-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowImageModal(true);
                                                        }}
                                                    >
                                                        <i className="bi bi-arrows-fullscreen me-1"></i>
                                                        Maximize
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                        {property.images.length === 1 && (
                                            <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-50 text-white text-center p-2">
                                                <button
                                                    className="btn btn-sm btn-light"
                                                    onClick={() => setShowImageModal(true)}
                                                >
                                                    <i className="bi bi-arrows-fullscreen me-1"></i>
                                                    Maximize
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Thumbnail Gallery */}
                                    {property.images.length > 1 && (
                                        <div className="p-3 bg-light">
                                            <div className="d-flex gap-2 overflow-auto" style={{ maxHeight: '100px' }}>
                                                {property.images.map((img, index) => (
                                                    <img
                                                        key={index}
                                                        src={img}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        className={`rounded border ${
                                                            selectedImageIndex === index 
                                                                ? 'border-primary border-3' 
                                                                : 'border-secondary'
                                                        }`}
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            objectFit: 'cover',
                                                            cursor: 'pointer',
                                                            flexShrink: 0
                                                        }}
                                                        onClick={() => setSelectedImageIndex(index)}
                                                        title={`Select image ${index + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
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

                    {/* Image Modal for Maximized View */}
                    {showImageModal && property.images && property.images.length > 0 && (
                        <div
                            className="modal fade show d-block"
                            style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999 }}
                            onClick={() => setShowImageModal(false)}
                        >
                            <div className="modal-dialog modal-fullscreen">
                                <div className="modal-content bg-transparent border-0">
                                    <div className="modal-header border-0">
                                        <button
                                            type="button"
                                            className="btn-close btn-close-white"
                                            onClick={() => setShowImageModal(false)}
                                            aria-label="Close"
                                        ></button>
                                    </div>
                                    <div className="modal-body d-flex align-items-center justify-content-center position-relative">
                                        <img
                                            src={property.images[selectedImageIndex]}
                                            alt={`Property ${selectedImageIndex + 1}`}
                                            className="img-fluid"
                                            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        {property.images.length > 1 && (
                                            <>
                                                <button
                                                    className="btn btn-lg btn-light position-absolute start-0 top-50 translate-middle-y ms-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex((prev) => 
                                                            prev === 0 ? property.images.length - 1 : prev - 1
                                                        );
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-left"></i>
                                                </button>
                                                <button
                                                    className="btn btn-lg btn-light position-absolute end-0 top-50 translate-middle-y me-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex((prev) => 
                                                            prev === property.images.length - 1 ? 0 : prev + 1
                                                        );
                                                    }}
                                                >
                                                    <i className="bi bi-chevron-right"></i>
                                                </button>
                                                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 text-white text-center">
                                                    <p className="mb-0">
                                                        Image {selectedImageIndex + 1} of {property.images.length}
                                                    </p>
                                                    <div className="d-flex gap-2 justify-content-center mt-2">
                                                        {property.images.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                className={`btn btn-sm rounded-circle ${
                                                                    selectedImageIndex === index 
                                                                        ? 'btn-light' 
                                                                        : 'btn-outline-light'
                                                                }`}
                                                                style={{ width: '12px', height: '12px', padding: 0 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedImageIndex(index);
                                                                }}
                                                                title={`Go to image ${index + 1}`}
                                                            ></button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    <button
                                        onClick={() => navigate(getBackRoute(user?.role))}
                                        className="btn btn-outline-secondary flex-fill"
                                    >
                                        <i className="bi bi-arrow-left me-1"></i>
                                        Back to List
                                    </button>
                                    
                                    {/* Home button for quick navigation */}
                                    {user && (
                                        <button
                                            onClick={() => navigate(getDashboardRoute(user.role))}
                                            className="btn btn-outline-primary"
                                            title="Go to Dashboard"
                                        >
                                            <i className="bi bi-house"></i>
                                        </button>
                                    )}

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