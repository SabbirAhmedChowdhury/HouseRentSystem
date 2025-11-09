/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import { getImageUrl } from '../utils/imageUtils';

const PropertyList = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [properties, setProperties] = useState([]);
    const [searchParams, setSearchParams] = useState({
        city: '',
        minRent: '',
        maxRent: '',
        bedrooms: '',
        sortBy: 'rentAmount',
        sortDirection: 'asc',
        page: 1,
        pageSize: 9,
    });
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProperties();
    }, [searchParams]);

    const fetchProperties = async () => {
        setLoading(true);
        setError('');
        try {
            const params = { ...searchParams };
            // Remove empty filters
            Object.keys(params).forEach((key) => {
                if (!params[key] && params[key] !== 0) delete params[key];
            });

            const res = await api.get('/Property/search', { params });
            setProperties(res.data.items);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams({
            ...searchParams,
            [name]: value,
            page: 1,
        });
    };

    const handlePageChange = (page) => {
        setSearchParams({ ...searchParams, page });
    };

    const resetSearch = () => {
        setSearchParams({
            city: '',
            minRent: '',
            maxRent: '',
            bedrooms: '',
            sortBy: 'rentAmount',
            sortDirection: 'asc',
            page: 1,
            pageSize: 9,
        });
    };

    return (
        <>
            <div className="container py-5">
                {/* Hero Section */}
                <div className="text-center mb-5">
                    <h1 className="display-5 fw-bold text-primary">Find Your Next Home</h1>
                    <p className="lead text-muted">Browse {properties.length} available properties</p>
                </div>

                {/* Search & Filters */}
                <div className="card border-0 shadow-lg mb-5">
                    <div className="card-body p-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                fetchProperties();
                            }}
                            className="row g-3"
                        >
                            <div className="col-md-3">
                                <label className="form-label">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    className="form-control"
                                    placeholder="Dhaka"
                                    value={searchParams.city}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Min Rent</label>
                                <input
                                    type="number"
                                    name="minRent"
                                    className="form-control"
                                    placeholder="1000"
                                    value={searchParams.minRent}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Max Rent</label>
                                <input
                                    type="number"
                                    name="maxRent"
                                    className="form-control"
                                    placeholder="50000"
                                    value={searchParams.maxRent}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Bedrooms</label>
                                <select
                                    name="bedrooms"
                                    className="form-select"
                                    value={searchParams.bedrooms}
                                    onChange={handleSearchChange}
                                >
                                    <option value="">Any</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4+</option>
                                </select>
                            </div>
                            <div className="col-md-3 d-flex align-items-end gap-2">
                                <button type="submit" className="btn btn-primary flex-fill">
                                    <i className="bi bi-search me-1"></i> Search
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={resetSearch}
                                >
                                    <i className="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-danger text-center">{error}</div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                )}

                {/* Property Grid */}
                {!loading && properties.length === 0 && !error && (
                    <div className="text-center py-5">
                        <p className="text-muted">No properties found matching your criteria.</p>
                    </div>
                )}

                <div className="row g-4">
                    {properties.map((property) => (
                        <div key={property.propertyId} className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-lg h-100">
                                {property.thumbnail ? (
                                    <img
                                        src={getImageUrl(property.thumbnail)}
                                        className="card-img-top"
                                        alt={property.address}
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div
                                        className="card-img-top bg-light d-flex align-items-center justify-content-center"
                                        style={{ height: '200px' }}
                                    >
                                        <i className="bi bi-house fs-1 text-muted"></i>
                                    </div>
                                )}
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{property.address}</h5>
                                    <p className="card-text text-muted">{property.city}</p>
                                    <p className="card-text">
                                        <strong>BDT {property.rentAmount.toLocaleString()}</strong>/month
                                    </p>
                                    <p className="card-text">
                                        <i className="bi bi-bed"></i> {property.bedrooms} bed |{' '}
                                        <i className="bi bi-droplet"></i> {property.bathrooms} bath
                                    </p>
                                    <div className="mt-auto">
                                        <span
                                            className={`badge ${property.isAvailable ? 'bg-success' : 'bg-secondary'
                                                } mb-2`}
                                        >
                                            {property.isAvailable ? 'Available' : 'Occupied'}
                                        </span>
                                        <Link
                                            to={`/property/${property.propertyId}`}
                                            className="btn btn-primary w-100"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <nav className="mt-5 d-flex justify-content-center">
                        <ul className="pagination">
                            <li className={`page-item ${searchParams.page === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => handlePageChange(searchParams.page - 1)}
                                    disabled={searchParams.page === 1}
                                >
                                    Previous
                                </button>
                            </li>
                            {[...Array(totalPages)].map((_, i) => (
                                <li
                                    key={i + 1}
                                    className={`page-item ${searchParams.page === i + 1 ? 'active' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                </li>
                            ))}
                            <li
                                className={`page-item ${searchParams.page === totalPages ? 'disabled' : ''}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => handlePageChange(searchParams.page + 1)}
                                    disabled={searchParams.page === totalPages}
                                >
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </>
    );
};

export default PropertyList;