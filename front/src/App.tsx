import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/LeafletMap';
import { MunicipiProvider } from './contexts/MunicipiContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';

function AppContent() {
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
