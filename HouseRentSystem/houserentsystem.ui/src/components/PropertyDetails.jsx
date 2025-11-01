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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/Property/${id}`);
            setProperty(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load property');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!property.isAvailable) {
            setDeleteError('Cannot delete an occupied property');
            return;
        }

        if (window.confirm('Are you sure you want want to delete this property?')) {
            try {
                await api.delete(`/Property/${id}`);
                navigate('/landlord-dashboard');
            } catch (err) {
                setDeleteError(err.response?.data?.message || 'Failed to delete property');
            }
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

                                {deleteError && (
                                    <div className="alert alert-danger mt-3 small">{deleteError}</div>
                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PropertyDetails;