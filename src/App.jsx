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

const App = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/taller" element={<Taller />} />
        <Route path="/oficina" element={<Oficina />} />
        <Route path="/empaste" element={<Empaste />} />
        <Route path="/troquelado" element={<Troquelado />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Layout>
  );
};

export default App;