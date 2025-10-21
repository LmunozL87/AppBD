import { useState } from "react";

/** Cambia a true para usar datos de ejemplo sin backend */
const USE_MOCK = false;

const mockData = [
  {
    NRO_CLIENTE: 101,
    RUN_CLIENTE: "12345678-9",
    NOMBRE_CLIENTE: "JUAN PÉREZ GARCÍA",
    PROFESION_OFICIO: "INGENIERO",
    DIA_CUMPLEANO: 5,
    MONTO_GIFTCARD: 15000,
    OBSERVACION: "Ejemplo mock"
  },
  {
    NRO_CLIENTE: 202,
    RUN_CLIENTE: "11111111-1",
    NOMBRE_CLIENTE: "MARÍA LÓPEZ RIVERA",
    PROFESION_OFICIO: "ABOGADA",
    DIA_CUMPLEANO: 17,
    MONTO_GIFTCARD: 60000,
    OBSERVACION: "Ejemplo mock"
  }
];

export default function App() {
  const [mes, setMes] = useState("");
  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const apiBase = import.meta.env.VITE_API_BASE || "";

  async function fetchCumpleanos(m) {
    if (USE_MOCK) return mockData;
    const url = apiBase ? `${apiBase}/api/cumpleanos?mes=${m}` : `/api/cumpleanos?mes=${m}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || "Error consultando API");
    }
    return await resp.json();
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRows([]);

    const n = Number(mes);
    if (!Number.isInteger(n) || n < 1 || n > 12) {
      setError("Ingrese un mes válido (1 a 12).");
      return;
    }

    setCargando(true);
    try {
      const data = await fetchCumpleanos(n);
      setRows(data); // ya vienen con alias (NRO_CLIENTE, MONTO_GIFTCARD, etc.)
      console.log("Datos obtenidos:", data);
    } catch (err) {
      setError(err.message || "Error consultando API");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>🎂 Cumpleaños de Clientes</h1>

      {/* Formulario para ingresar el mes */}
      <form
        onSubmit={onSubmit}
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        <input
          type="number"
          min="1"
          max="12"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          placeholder="Mes (1-12)"
          required
          style={{
            width: "120px",
            padding: "0.4rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textAlign: "center",
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "0.4rem 1rem",
            cursor: "pointer",
          }}
        >
          Buscar
        </button>
      </form>

      {/* Mensajes de estado */}
      {error && (
        <div style={{ color: "#b00020", textAlign: "center", marginBottom: "0.75rem" }}>
          {error}
        </div>
      )}
      {cargando && (
        <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
          Cargando…
        </div>
      )}

      {/* Tabla de resultados */}
      {rows.length > 0 ? (
        <table
          border="1"
          cellPadding="8"
          cellSpacing="0"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead style={{ backgroundColor: "#f2f2f2" }}>
            <tr>
              <th>Nro Cliente</th>
              <th>RUN</th>
              <th>Nombre</th>
              <th>Profesión/Oficio</th>
              <th>Día</th>
              <th>Giftcard</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              // Forzamos número para formatear correctamente
              const monto = Number(
                r.MONTO_GIFTCARD ??
                r.monto_gifcard ??
                0
              );

              return (
                <tr key={idx}>
                  <td>{r.NRO_CLIENTE ?? r.nro_cliente}</td>
                  <td>{r.RUN_CLIENTE ?? r.run_cliente}</td>
                  <td>{r.NOMBRE_CLIENTE ?? r.nombre_cliente}</td>
                  <td>{(r.PROFESION_OFICIO ?? r.profesion_oficio) || "(sin dato)"}</td>
                  <td style={{ textAlign: "center" }}>
                    {r.DIA_CUMPLEANO ?? r.dia_cumpleano}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {monto.toLocaleString("es-CL")}
                  </td>
                  <td>{r.OBSERVACION ?? r.observacion}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        !cargando && (
          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            No hay datos para mostrar.
          </p>
        )
      )}
    </div>
  );
}

/* estilos inline simples (no indispensables, pero los dejo por si los usas) */
const container = {
  maxWidth: 960,
  margin: "2rem auto",
  padding: "0 1rem",
  fontFamily:
    "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif",
};
const formRow = { display: "flex", gap: 8, alignItems: "center", marginTop: 8 };
const input = {
  width: 120,
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
};
const btn = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #111",
  background: "#111",
  color: "white",
  cursor: "pointer",
};
const table = { borderCollapse: "collapse", width: "100%" };
const th = {
  padding: "10px 8px",
  borderBottom: "1px solid #ddd",
  textAlign: "left",
  background: "#f7f7f7",
};
const td = { padding: "8px 8px", borderBottom: "1px solid #eee" };
const errorBox = {
  marginTop: 12,
  padding: "10px 12px",
  border: "1px solid #e78484",
  background: "#fde8e8",
  borderRadius: 6,
  color: "#a33",
};
