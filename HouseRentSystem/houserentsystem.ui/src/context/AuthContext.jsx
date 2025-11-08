import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userProfileStr = localStorage.getItem('userProfile');
        if (token && userProfileStr) {
            try {
                const userProfile = JSON.parse(userProfileStr);
                setUser(userProfile);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing user profile:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('userProfile');
            }
        }
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userProfile', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};