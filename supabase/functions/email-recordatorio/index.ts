import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Reservas <reservas@mail.romerogill.com>";

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Ventana: reservas que empiezan entre 24h y 25h desde ahora.
  // Corriendo cada hora, cada reserva cae en la ventana una sola vez.
  const ahora = Date.now();
  const desde = new Date(ahora + 24 * 60 * 60 * 1000).toISOString();
  const hasta = new Date(ahora + 25 * 60 * 60 * 1000).toISOString();

  const { data: reservas, error } = await supabase
    .from("reservas")
    .select(
      `id, inicio, cliente_nombre, cliente_email, estado, recordatorio_enviado,
       negocios ( nombre, zona_horaria ),
       servicios ( nombre ),
       empleados ( nombre )`
    )
    .gte("inicio", desde)
    .lt("inicio", hasta)
    .eq("recordatorio_enviado", false);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  let enviados = 0;

  for (const r of reservas ?? []) {
    // Si manejas cancelaciones vía la columna `estado`, sáltate las canceladas
    if (r.estado && r.estado !== "confirmada" && r.estado !== "activa") continue;

    const negocio = r.negocios?.nombre ?? "el negocio";
    const zona = r.negocios?.zona_horaria ?? "Europe/Madrid";

    const html = plantillaRecordatorio({
      cliente: r.cliente_nombre,
      negocio,
      servicio: r.servicios?.nombre ?? "tu servicio",
      empleado: r.empleados?.nombre,
      fechaBonita: formatearFecha(r.inicio, zona),
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: r.cliente_email,
        subject: `Recordatorio: tu cita mañana en ${negocio}`,
        html,
      }),
    });

    if (res.ok) {
      await supabase
        .from("reservas")
        .update({ recordatorio_enviado: true })
        .eq("id", r.id);
      enviados++;
    }
  }

  return new Response(JSON.stringify({ ok: true, enviados }), {
    headers: { "Content-Type": "application/json" },
  });
});

function formatearFecha(inicio: string, zona: string): string {
  return new Date(inicio).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zona,
  });
}

function plantillaRecordatorio(p: {
  cliente: string;
  negocio: string;
  servicio: string;
  empleado?: string;
  fechaBonita: string;
}): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #2b2b2b;">
    <div style="background: #7a8b6f; padding: 24px; border-radius: 12px 12px 0 0;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Tu cita es mañana 👋</h1>
    </div>
    <div style="border: 1px solid #eee; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
      <p>Hola ${p.cliente},</p>
      <p>Te recordamos tu cita en <strong>${p.negocio}</strong>:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #888;">Servicio</td><td style="padding: 6px 0; text-align: right;"><strong>${p.servicio}</strong></td></tr>
        ${p.empleado ? `<tr><td style="padding: 6px 0; color: #888;">Con</td><td style="padding: 6px 0; text-align: right;">${p.empleado}</td></tr>` : ""}
        <tr><td style="padding: 6px 0; color: #888;">Cuándo</td><td style="padding: 6px 0; text-align: right;"><strong>${p.fechaBonita}</strong></td></tr>
      </table>
      <p style="color: #888; font-size: 13px;">¿No puedes venir? Responde a este correo para cancelar.</p>
    </div>
  </div>`;
}