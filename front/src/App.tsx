import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/LeafletMap';
import { MunicipiProvider } from './contexts/MunicipiContext';

export default function App() {
  return (
    <MunicipiProvider>
      <div id="map-container">
        <LeafletMap />
      </div>
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
    </MunicipiProvider>
  );
}
