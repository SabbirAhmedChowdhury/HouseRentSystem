import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const PropertyList = () => {
  const { user } = useContext(AuthContext);
  const [properties, setProperties] = useState([]);
  const [searchParams, setSearchParams] = useState({
    city: '',
    minRent: '',
    maxRent: '',
    bedrooms: '',
    page: 1,
    pageSize: 10,
    sortBy: 'RentAmount',
    sortDirection: 'asc',
  });
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, [searchParams]);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/Property/search', { params: searchParams });
      setProperties(response.data.items);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load properties');
    }
  };

  const handleSearchChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ ...searchParams, page: newPage });
  };

  const handleSortDirectionChange = (e) => {
    setSearchParams({ ...searchParams, sortDirection: e.target.value, page: 1 });
  };

  return (
    <div className="container mt-5">
      <h2>Properties</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {(user?.role === 'Tenant' || !user) && (
        <div className="card p-3 mb-4">
          <h4>Search Properties</h4>
          <form className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                name="city"
                className="form-control"
                placeholder="City"
                value={searchParams.city}
                onChange={handleSearchChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                name="minRent"
                className="form-control"
                placeholder="Min Rent"
                value={searchParams.minRent}
                onChange={handleSearchChange}
                min="1000"
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                name="maxRent"
                className="form-control"
                placeholder="Max Rent"
                value={searchParams.maxRent}
                onChange={handleSearchChange}
                max="1000000"
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                name="bedrooms"
                className="form-control"
                placeholder="Bedrooms"
                value={searchParams.bedrooms}
                onChange={handleSearchChange}
                min="1"
                max="10"
              />
            </div>
            <div className="col-md-2">
              <select
                name="sortBy"
                className="form-select"
                value={searchParams.sortBy}
                onChange={handleSearchChange}
              >
                <option value="RentAmount">Rent</option>
                <option value="Bedrooms">Bedrooms</option>
                <option value="Date">Date</option>
              </select>
            </div>
            <div className="col-md-1">
              <select
                name="sortDirection"
                className="form-select"
                value={searchParams.sortDirection}
                onChange={handleSortDirectionChange}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </form>
        </div>
      )}
      <div className="row g-3">
        {properties.map((property) => (
          <div key={property.propertyId} className="col-md-4">
            <div className="card h-100">
              {property.thumbnail && (
                <img
                  src={property.thumbnail}
                  className="card-img-top"
                  alt="Property"
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              )}
              <div className="card-body">
                <h5 className="card-title">{property.address}</h5>
                <p className="card-text">{property.city}</p>
                <p className="card-text">Rent: ${property.rentAmount}</p>
                <p className="card-text">Bedrooms: {property.bedrooms}</p>
                <p className="card-text">
                  Status: {property.isAvailable ? 'Available' : 'Occupied'}
                </p>
                <Link
                  to={`/property/${property.propertyId}`}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#008080', borderColor: '#008080' }}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li
                  key={page}
                  className={`page-item ${searchParams.page === page ? 'active' : ''}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default PropertyList;