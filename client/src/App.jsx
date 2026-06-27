import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import SkillSetup from './pages/SkillSetup';
import Validate from './pages/Validate';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';
import RateSession from './pages/RateSession';
import AdminDashboard from './pages/Admin/AdminDashboard';
import NotFound from './pages/NotFound';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  
  return children;
};

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-dark-bg dark:bg-dark-bg bg-light-bg transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1A2E',
            color: '#F1F5F9',
            border: '1px solid #2D2D4E'
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#1A1A2E' }
          },
          error: {
            iconTheme: { primary: '#FF6584', secondary: '#1A1A2E' }
          }
        }}
      />
      
      {isAuthenticated && <Navbar />}
      
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        
        <Route path="/skill-setup" element={
          <ProtectedRoute><SkillSetup /></ProtectedRoute>
        } />
        <Route path="/validate/:skillName" element={
          <ProtectedRoute><Validate /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/matches" element={
          <ProtectedRoute><Matches /></ProtectedRoute>
        } />
        <Route path="/chat/:matchId?" element={
          <ProtectedRoute><Chat /></ProtectedRoute>
        } />
        <Route path="/profile/:userId?" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/chatbot" element={
          <ProtectedRoute><Chatbot /></ProtectedRoute>
        } />
        <Route path="/ratings/:sessionId" element={
          <ProtectedRoute><RateSession /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
