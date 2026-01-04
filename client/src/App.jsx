import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashBoardPage'; 
import AuthCallbackPage from './pages/AuthCallbackPage';
import SubjectNotesPage from './pages/SubjectNotesPage';
import GroupsPage from './pages/GroupsPage';
import ProtectedRoute from './components/ProtectedRoute';

const useAuth = () => {
  const token = localStorage.getItem('authToken');
  return token ? true : false;
};

function App() {
  const isAuth = useAuth();

  return (
    <div>
      <Routes>
        <Route 
          path="/login" 
          element={isAuth ? <Navigate to="/dashboard" /> : <LoginPage />} 
        />
        
        <Route path="/auth-success" element={<AuthCallbackPage />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/groups" 
          element={
            <ProtectedRoute>
              <Layout>
                <GroupsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/subjects/:subjectId/notes" 
          element={
            <ProtectedRoute>
              <Layout>
                <SubjectNotesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/" 
          element={isAuth ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  );
}

export default App;