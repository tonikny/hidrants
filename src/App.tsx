import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeafletMap } from './components/LeafletMap';

export default function App() {
  return (
    <>
      <div id="map-container" style={{ height: '100vh', width: '100%' }}>
        <LeafletMap />
      </div>
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
    </>
  );
}
