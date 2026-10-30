import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pool from "./database.js";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { verifyLogin } from "./middleware/auth.js";
import path from "path";
import { fileURLToPath } from "url";
const app = express();
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET trebuie configurat în fișierul .env");
}

app.use(helmet({ contentSecurityPolicy: false }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//Când folosesc helmet(), el blochează implicit încărcarea anumitor resurse externe
// (cum ar fi scripturile Chart.js din CDN sau unele fonturi) prin antetul Content Security Policy (CSP).
// De asemenea, helmet() trebuie apelat înainte de express.static('.').
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../client/frontend")));
// Permite CDN-uri externe (Chart.js etc.)
//app.use(xss());
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "Prea multe incercari. Asteapta 1 minut!" },
});
let senzoriData = {}; //obiect, nu vector/array
let pragCurent = 25;
let ultimaComunicare;
let loguriEvenimente = [];
//adauga un eveniment in istoric
function adaugaLogServer(tip, mesaj, valoare) {
  const oraActuala = new Date().toLocaleTimeString();
  loguriEvenimente.unshift({
    ora: oraActuala,
    tip: tip,
    mesaj: mesaj,
    valoare: valoare,
  });
  if (loguriEvenimente.length > 20) {
    loguriEvenimente.pop();
  }
}
app.get("/", (req, res) => {
  res.redirect("/login.html");
});
app.get("/api/dashboard-data", verifyLogin, (req, res) => {
  // Această linie se execută DOAR dacă token-ul a fost validat cu succes!
  res.json({ dateUtile: "Date secrete din baza de date..." });
});
app.post("/api/senzori", async (req, res) => {
  //pentru esp32 cand trimite datele spre server
  if (req.body.prag !== undefined) {
    const prag = Number(req.body.prag);
    if (!Number.isFinite(prag) || prag < -40 || prag > 100) {
      return res
        .status(400)
        .json({ error: "Pragul trebuie să fie între -40 și 100" });
    }
    pragCurent = prag;
    ultimaComunicare = Date.now();
    return res.json({ status: "prag actualizat", prag: pragCurent });
  }

  const { temperatura, umiditate, miscare } = req.body;
  if (
    !Number.isFinite(Number(temperatura)) ||
    !Number.isFinite(Number(umiditate)) ||
    typeof miscare !== "boolean" ||
    Number(temperatura) < -40 ||
    Number(temperatura) > 100 ||
    Number(umiditate) < 0 ||
    Number(umiditate) > 100
  ) {
    return res.status(400).json({
      error: "Datele senzorilor sunt invalide",
    });
  }

  ultimaComunicare = Date.now();
  senzoriData = req.body;
  //const {temperatura, umiditate, miscare}=req.body;
  ultimaComunicare = Date.now(); //memorez momentul comunicarii datelor
  //================VERIFICARE DATE ESP32==============================
  if (senzoriData.temperatura > pragCurent) {
    adaugaLogServer(
      "ALERT",
      `Prag depasit! Temperatura peste ${pragCurent}°C`,
      `${senzoriData.temperatura} °C`,
    );
  } else if (senzoriData.temperatura >= pragCurent - 2) {
    adaugaLogServer(
      "WARN",
      `Prag depășit! Temp peste ${pragCurent}°C`,
      `${senzoriData.temperatura} °C`,
    );
  } else if (senzoriData.miscare === true) {
    adaugaLogServer("WARN", "Mișcare detectată în incintă", "PIR ACTIV");
  } else {
    adaugaLogServer(
      "INFO",
      "Pachet date recepționat cu succes",
      `${senzoriData.temperatura} °C`,
    );
  }
  //INSERARE DATE IN BAZA DE DATE
  try {
    await pool.query(
      `INSERT INTO sensors(temperatura,miscare,umiditate) VALUES(?,?,?)`,
      [Number(temperatura), miscare, Number(umiditate)],
    );
  } catch (err) {
    console.error("Eroare la salvarea datelor in DB:", err);
    return res.status(503).json({ error: "Datele nu au putut fi salvate" });
  }
  res.json({ success: true, prag: pragCurent });
});
//verifica statusul esp32, daca au trecut prea multe secunde de la ultima comunicare
app.get("/api/status-esp", async (req, res) => {
  const secundeTrecute = ultimaComunicare
    ? (Date.now() - ultimaComunicare) / 1000
    : Infinity;
  if (secundeTrecute < 10) {
    res.json({ online: true });
  } else {
    res.json({ online: false });
  }
});
//cerere de la frontend pentru a vedea datele
app.get("/api/senzori", verifyLogin, (req, res) => {
  res.json(senzoriData);
});
app.get("/api/verify-token", verifyLogin, (req, res) => {
  res.json({ valid: true, user: req.user });
});
//pentru security logs ( istoric date )
app.get("/api/evenimente", verifyLogin, (req, res) => {
  res.json(loguriEvenimente);
});
//
app.get("/api/alerta-maxima", verifyLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM sensors WHERE temperatura>30",
    );
    res.json(rows);
  } catch (err) {
    console.error("Eroare la citirea alertelor:", err);
    res.status(503).json({ error: "Alertele nu au putut fi încărcate" });
  }
});
//istoric evenimente
app.get("/api/istoric", verifyLogin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM sensors ORDER BY id DESC LIMIT 20",
    );
    res.json(rows);
  } catch (err) {
    console.error("Eroare la citirea istoricului:", err);
    res.status(503).json({ error: "Istoricul nu a putut fi încărcat" });
  }
});
//autentificare rfid
app.post("/rfid_login", async (req, res) => {
  const { rfid } = req.body;
  if (typeof rfid !== "string" || rfid.trim().length === 0) {
    return res.status(400).json({ error: "RFID invalid" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, role FROM users WHERE rfid_tag = ? LIMIT 1",
      [rfid.trim()],
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: "ACCESS DENIED" });
    }

    const token = jwt.sign(
      { userId: rows[0].id, role: rows[0].role || "user" },
      jwtSecret,
      { expiresIn: "1h" },
    );
    return res.status(200).json({
      message: "ACCESS GRANTED",
      token,
      role: rows[0].role || "user",
    });
  } catch (err) {
    console.error("Eroare la autentificarea RFID:", err);
    return res
      .status(503)
      .json({ error: "Autentificarea nu este disponibilă" });
  }
});
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (
    typeof username !== "string" ||
    username.trim().length < 3 ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      error: "Username-ul trebuie să aibă cel puțin 3 caractere, iar parola 8",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users(username,password) VALUES(?,?)", [
      username.trim(),
      hashedPassword,
    ]);
    res.status(201).json({ status: "utilizator creat" });
  } catch (err) {
    console.error("Eroare la înregistrare:", err);
    res.status(500).json({ error: "Utilizatorul nu a putut fi creat" });
  }
});
//cautare user existent pentru conectare
app.post("/api/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Date de autentificare invalide" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username.trim(),
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Date de autentificare invalide" });
    }
    const parolaCorecta = await bcrypt.compare(password, rows[0].password);
    if (!parolaCorecta) {
      return res.status(401).json({ error: "Date de autentificare invalide" });
    }
    const token = jwt.sign(
      { userId: rows[0].id, role: rows[0].role || "user" },
      jwtSecret,
      { expiresIn: "1h" },
    );
    return res.json({ token });
  } catch (err) {
    console.error("Eroare la autentificare:", err);
    return res
      .status(503)
      .json({ error: "Autentificarea nu este disponibilă" });
  }
});
const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, () => {
  console.log(`Serverul rulează pe http://localhost:${PORT}`);
});
export default app;
