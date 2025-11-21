import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import Login from '../pages/Login'

function PrivateRoutes({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className='text-center '> Creating your WorkSpace</div>;
  if (user) return <Navigate to="/dashboard" />;

  return children
}

export default PrivateRoutes
