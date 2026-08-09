import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AdfProvider } from "./contexts/AdfContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MapPanel } from "./components/layout/MapPanel";
import { usePreventLeave } from "./hooks/usePreventLeave";

export default function App() {
  usePreventLeave();

  return (
    <AuthProvider>
      <AdfProvider>
        <MapPanel />
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      </AdfProvider>
    </AuthProvider>
  );
}
