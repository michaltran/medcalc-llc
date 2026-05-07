import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Patients from './pages/Patients.jsx';
import PatientDetail from './pages/PatientDetail.jsx';
import { HistoryList, HistoryDetail } from './pages/History.jsx';
import { ProtocolsList, ProtocolDetail, ProtocolNew } from './pages/Protocols.jsx';
import CalculatorRunner from './pages/CalculatorRunner.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="text-muted">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/history" element={<HistoryList />} />
        <Route path="/history/:id" element={<HistoryDetail />} />
        <Route path="/protocols" element={<ProtocolsList />} />
        <Route path="/protocols/new" element={<ProtocolNew />} />
        <Route path="/protocols/:id" element={<ProtocolDetail />} />
        <Route path="/calc/:id" element={<CalculatorRunner />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
