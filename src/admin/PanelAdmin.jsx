import { useAuth } from "../lib/AuthContext";
import AgendaSemana from './AgendaSemana';

export default function PanelAdmin() {
  const { perfil, salir } = useAuth();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Panel de {perfil.negocios?.nombre}</h1>
      <p>Hola, {perfil.nombre} ({perfil.rol})</p>
      <button onClick={salir}>Cerrar sesión</button>
      
      <AgendaSemana />
    </div>
  );
}