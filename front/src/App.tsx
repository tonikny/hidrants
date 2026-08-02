import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/map/LeafletMap';
import { AdfProvider, useAdf } from './contexts/AdfContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdfSelector } from './components/ui/AdfSelector';

function AppContent() {
  const { isLoading } = useAdf();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregant...
      </div>
    );
  }

  return (
    <div id="map-container" className="h-screen max-h-[100svh] w-full overflow-hidden">
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
