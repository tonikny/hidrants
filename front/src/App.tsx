import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/LeafletMap';
import { MunicipiProvider, useMunicipi } from './contexts/MunicipiContext';
import { AuthProvider } from './contexts/AuthContext';
import { MunicipiSelector } from './components/MunicipiSelector';

function AppContent() {
  const { municipi, isLoading } = useMunicipi();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregant...
      </div>
    );
  }

  if (!municipi) {
    return <MunicipiSelector />;
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
