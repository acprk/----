import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MusicProvider } from './context/MusicContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Reading from './pages/Reading';
import Tech from './pages/Tech';
import Ideas from './pages/Ideas';
import Resources from './pages/Resources';
import Travel from './pages/Travel';
import Music from './pages/Music';
import AIChat from './pages/AIChat';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <MusicProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/reading" replace />} />
              <Route path="reading" element={<Reading />} />
              <Route path="tech" element={<Tech />} />
              <Route path="ideas" element={<Ideas />} />
              <Route path="music" element={<Music />} />
              <Route path="resources" element={<Resources />} />
              <Route path="travel" element={<Travel />} />
              <Route path="ai" element={<AIChat />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MusicProvider>
    </AuthProvider>
  );
};

export default App;
