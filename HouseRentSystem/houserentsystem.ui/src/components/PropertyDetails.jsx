import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const PropertyDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [property, setProperty] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const response = await api.get(`/Property/${id}`);
            setProperty(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load property');
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

    if (!property) return <div>Loading...</div>;

    return (
        <div className="container mt-5">
            <h2>Property Details</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="card">
                <div className="card-body">
                    <h3>{property.address}, {property.city}</h3>
                    <p><strong>Rent:</strong> ${property.rentAmount}</p>
                    <p><strong>Security Deposit:</strong> ${property.securityDeposit}</p>
                    <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
                    <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
                    <p><strong>Amenities:</strong> {property.amenities || 'None'}</p>
                    <p><strong>Description:</strong> {property.description || 'No description'}</p>
                    <p><strong>Status:</strong> {property.isAvailable ? 'Available' : 'Occupied'}</p>
                    <p><strong>Landlord:</strong> {property.landlordName}</p>
                    <p><strong>Created At:</strong> {new Date(property.createdAt).toLocaleDateString()}</p>
                    {property.images.length > 0 && (
                        <div>
                            <h5>Images</h5>
                            <div className="row g-2">
                                {property.images.map((image, index) => (
                                    <div key={index} className="col-md-3">
                                        <img
                                            src={image}
                                            alt={`Property ${index + 1}`}
                                            className="img-fluid"
                                            style={{ maxHeight: '150px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {(user?.role === 'Landlord' || user?.role === 'Admin') && (
                        <div className="mt-3">
                            <Link
                                to={`/property/edit/${id}`}
                                className="btn btn-primary me-2"
                                style={{ backgroundColor: '#008080', borderColor: '#008080' }}
                            >
                                Edit Property
                            </Link>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={!property.isAvailable}
                                title={property.isAvailable ? 'Delete this property' : 'Cannot delete occupied property'}
                                style={{ opacity: property.isAvailable ? 1 : 0.65 }}
                            >
                                Delete Property
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;