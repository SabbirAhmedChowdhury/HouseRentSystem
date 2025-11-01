import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer py-5 mt-auto">
            <div className="container">
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <h5 className="text-white">House Rent System</h5>
                        <p className="small">Your trusted platform for renting homes.</p>
                    </div>
                    <div className="col-md-4 mb-3">
                        <h5 className="text-white">Quick Links</h5>
                        <ul className="list-unstyled">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/properties">Properties</Link></li>
                            <li><Link to="/about">About</Link></li>
                        </ul>
                    </div>
                    <div className="col-md-4 mb-3">
                        <h5 className="text-white">Contact</h5>
                        <p className="small mb-1">support@houserent.com</p>
                        <p className="small">+880 1738 03 4915</p>
                    </div>
                </div>
                <hr className="bg-secondary" />
                <p className="text-center small mb-0">
                    © {new Date().getFullYear()} House Rent System. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;