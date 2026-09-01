import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AdfProvider } from "./contexts/AdfContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MapPanel } from "./components/layout/MapPanel";

export default function App() {
  return (
    <AuthProvider>
      <AdfProvider>
        <MapPanel />
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      </AdfProvider>
    </AuthProvider>
  );
}
