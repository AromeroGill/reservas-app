import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function RutaProtegida({ children }) {
  const { sesion, perfil, cargando } = useAuth();

  if (cargando) return <div className="cargando">Cargando…</div>;
  if (!sesion) return <Navigate to="/admin/login" replace />;

  if (!perfil) {
    return (
      <div className="sin-acceso">
        <h2>Sin acceso</h2>
        <p>Tu cuenta no está asociada a ningún negocio.</p>
      </div>
    );
  }

  return children;
}