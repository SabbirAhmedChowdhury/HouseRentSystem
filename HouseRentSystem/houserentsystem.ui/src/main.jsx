import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    //<StrictMode>
    //    <App />
    //</StrictMode>,
    <AuthProvider>
        <App />
    </AuthProvider>
);