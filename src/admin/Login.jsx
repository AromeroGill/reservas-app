import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setEnviando(false);
    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    navegar("/admin", { replace: true });
  }

  return (
    <div className="login-fondo">
      <form className="login-caja" onSubmit={entrar}>
        <h1>Panel de reservas</h1>
        <p className="login-sub">Accede para gestionar tus citas</p>

        <label htmlFor="email">Email</label>
        <input
          id="email" type="email" value={email} autoComplete="username"
          onChange={(e) => setEmail(e.target.value)} required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password" type="password" value={password} autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)} required
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}