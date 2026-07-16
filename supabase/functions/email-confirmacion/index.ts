import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Reservas <reservas@mail.romerogill.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reserva_id } = await req.json();
    if (!reserva_id) {
      return json({ error: "Falta reserva_id" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: reserva, error } = await supabase
      .from("reservas")
      .select(
        `id, inicio, cliente_nombre, cliente_email,
         negocios ( nombre, zona_horaria ),
         servicios ( nombre ),
         empleados ( nombre )`
      )
      .eq("id", reserva_id)
      .single();

    if (error || !reserva) {
      return json({ error: "Reserva no encontrada" }, 404);
    }

    const negocio = reserva.negocios?.nombre ?? "el negocio";
    const zona = reserva.negocios?.zona_horaria ?? "Europe/Madrid";

    const html = plantillaConfirmacion({
      cliente: reserva.cliente_nombre,
      negocio,
      servicio: reserva.servicios?.nombre ?? "tu servicio",
      empleado: reserva.empleados?.nombre,
      fechaBonita: formatearFecha(reserva.inicio, zona),
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: reserva.cliente_email,
        subject: `Reserva confirmada en ${negocio}`,
        html,
      }),
    });

    if (!res.ok) {
      return json({ error: "Resend falló", detalle: await res.text() }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

function plantillaConfirmacion(p: {
  cliente: string;
  negocio: string;
  servicio: string;
  empleado?: string;
  fechaBonita: string;
}): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #2b2b2b;">
    <div style="background: #c66b4a; padding: 24px; border-radius: 12px 12px 0 0;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Reserva confirmada ✅</h1>
    </div>
    <div style="border: 1px solid #eee; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
      <p>Hola ${p.cliente},</p>
      <p>Tu reserva en <strong>${p.negocio}</strong> está confirmada. Estos son los detalles:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #888;">Servicio</td><td style="padding: 6px 0; text-align: right;"><strong>${p.servicio}</strong></td></tr>
        ${p.empleado ? `<tr><td style="padding: 6px 0; color: #888;">Con</td><td style="padding: 6px 0; text-align: right;">${p.empleado}</td></tr>` : ""}
        <tr><td style="padding: 6px 0; color: #888;">Cuándo</td><td style="padding: 6px 0; text-align: right;"><strong>${p.fechaBonita}</strong></td></tr>
      </table>
      <p style="color: #888; font-size: 13px;">Si necesitas cancelar o cambiar tu cita, responde a este correo.</p>
    </div>
  </div>`;
}