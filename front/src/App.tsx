import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/LeafletMap';
import { MunicipiProvider } from './contexts/MunicipiContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregant...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div id="map-container">
      <LeafletMap />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MunicipiProvider>
        <AppContent />
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      </MunicipiProvider>
    </AuthProvider>
  );
}
