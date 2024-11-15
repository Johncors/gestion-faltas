// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/ui/Layout';
import Login from './pages/Login';
import Taller from './pages/Taller';
import Oficina from './pages/Oficina';
import Empaste from './pages/Empaste';
import Troquelado from './pages/Troquelado';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/taller" element={
          <PrivateRoute allowedRoles={['Taller']}>
            <Taller />
          </PrivateRoute>
        } />
        <Route path="/oficina" element={
          <PrivateRoute allowedRoles={['Oficina']}>
            <Oficina />
          </PrivateRoute>
        } />
        <Route path="/empaste" element={
          <PrivateRoute allowedRoles={['Empaste']}>
            <Empaste />
          </PrivateRoute>
        } />
        <Route path="/troquelado" element={
          <PrivateRoute allowedRoles={['Troquelado']}>
            <Troquelado />
          </PrivateRoute>
        } />
        <Route path="/" element={
          user ? (
            <Navigate to={`/${user.role.toLowerCase()}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </Layout>
  );
};

export default App;