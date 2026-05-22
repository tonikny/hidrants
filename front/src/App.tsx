import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/LeafletMap';
import { AdfProvider, useAdf } from './contexts/AdfContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdfSelector } from './components/AdfSelector';

function AppContent() {
  const { activeAdf, isLoading } = useAdf();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Carregant...
      </div>
    );
  }

  if (!activeAdf) {
    return <AdfSelector />;
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
      <AdfProvider>
        <AppContent />
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      </AdfProvider>
    </AuthProvider>
  );
}
