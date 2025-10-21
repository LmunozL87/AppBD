import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import oracledb from "oracledb";

dotenv.config();

// Inicializa Oracle Instant Client (Thick) y apunta al wallet
oracledb.initOracleClient({
  libDir: process.env.ORACLE_CLIENT_LIB_DIR, // C:\oracle\instantclient_23_9
  configDir: process.env.ORACLE_TNS_ADMIN    // C:\oracle\Wallet
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

let pool;
async function initPool() {
  if (pool) return pool;
  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectionString: process.env.ORACLE_CONNECT_STRING, // ALIAS del wallet
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1
  });
  return pool;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Prueba de conexión
app.get("/api/testdb", async (req, res) => {
  let conn;
  try {
    await initPool();
    conn = await pool.getConnection();
    const r = await conn.execute(`SELECT 1 AS ok FROM dual`);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: "DB_ERROR", message: err.message, code: err.errorNum || null });
    console.error("Test DB error:", err);
  } finally {
    if (conn) { try { await conn.close(); } catch {} }
  }
});

// Cumpleaños por mes (usa el esquema BANKSOLUTIONS explícito)
app.get("/api/cumpleanos", async (req, res) => {
  const mes = Number(req.query.mes);
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    return res.status(400).json({ error: "Parámetro 'mes' inválido. Use 1..12." });
  }

    const sqlTruncate = `TRUNCATE TABLE BANKSOLUTIONS.cumpleanno_cliente`; // opcional
    const sqlRunPkg  = `BEGIN BANKSOLUTIONS.PKG_CUMPLEANNOS.SP_GENERAR_CUMPLES(:mes); END;`;
    const sqlSelect = `
        SELECT
            nro_cliente       AS NRO_CLIENTE,
            run_cliente       AS RUN_CLIENTE,
            nombre_cliente    AS NOMBRE_CLIENTE,
            profesion_oficio  AS PROFESION_OFICIO,
            dia_cumpleano     AS DIA_CUMPLEANO,
            monto_gifcard     AS MONTO_GIFTCARD,
            observacion       AS OBSERVACION
        FROM BANKSOLUTIONS.cumpleanno_cliente
        ORDER BY dia_cumpleano, nombre_cliente
    `;


  let conn;
  try {
    await initPool();
    conn = await pool.getConnection();

    // 1) Limpia la tabla antes de generar (puedes comentar esta línea si no quieres borrar)
    await conn.execute(sqlTruncate);

    // 2) Ejecuta el paquete para el mes solicitado
    await conn.execute(sqlRunPkg, { mes });

    // 3) Lee los registros generados
    const result = await conn.execute(sqlSelect, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(result.rows || []);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "DB_ERROR", message: err.message, code: err.errorNum || null });
  } finally {
    if (conn) { try { await conn.close(); } catch {} }
  }
});


app.listen(PORT, async () => {
  try {
    await initPool();
    console.log(`✅ Backend en http://localhost:${PORT}`);
  } catch (e) {
    console.error("❌ Pool init error:", e);
    process.exit(1);
  }
});

// Cierre limpio
process.on("SIGINT", async () => {
  try { if (pool) await pool.close(0); } finally { process.exit(0); }
});
