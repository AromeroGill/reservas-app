import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import './App.css'
import PaginaReserva from "./PaginaReserva";
import Login from "./admin/Login";
import RutaProtegida from "./admin/RutaProtegida";
import PanelAdmin from "./admin/PanelAdmin";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/reservar/tu-negocio" replace />} />
          <Route path="/reservar/:slug" element={<PaginaReserva />} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin/*"
            element={
              <RutaProtegida>
                <PanelAdmin />
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}