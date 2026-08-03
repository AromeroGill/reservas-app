import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      if (!data.session) setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSesion(s);
      if (!s) {
        setPerfil(null);
        setCargando(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sesion) return;
    let vivo = true;

    (async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("id, negocio_id, rol, nombre, negocios ( id, nombre, slug, zona_horaria )")
        .eq("id", sesion.user.id)
        .maybeSingle();

      if (!vivo) return;
      if (error) console.error("Error cargando perfil:", error);
      setPerfil(data ?? null);
      setCargando(false);
    })();

    return () => { vivo = false; };
  }, [sesion]);

  const salir = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ sesion, perfil, cargando, salir }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}