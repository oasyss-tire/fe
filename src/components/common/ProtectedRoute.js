import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roleRequired }) => {
  const token = sessionStorage.getItem('token');
  const userRole = sessionStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (roleRequired === 'ADMIN' && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 