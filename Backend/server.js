require("dotenv").config();
const express = require("express");
const pool = require("./db");
const cors = require("cors");
const path = require("path");

const PORT = process.env.PORT || 4000;
const app = express();

// Configuração de CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir arquivos do frontend
app.use(express.static(path.join(__dirname, "../Frontend")));

// Função de validação de email
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /\S+@\S+\.\S+/.test(email);
}

// --- ROTA DE INSCRIÇÃO ---
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!isValidEmail(email))
    return res.status(400).json({ error: "Email inválido" });

  try {
    // Primeiro, verifica se o email já existe
    const [rows] = await pool.execute("SELECT * FROM subscribers WHERE email = ?", [email.toLowerCase().trim()]);

    if (rows.length > 0) {
      const subscriber = rows[0];

      if (subscriber.active === 1) {
        // Já existe e está ativo → retorna erro 409
        return res.status(409).json({ error: "Email já cadastrado e ativo" });
      } else {
        // Existe mas está inativo → reativa
        await pool.execute("UPDATE subscribers SET active = 1 WHERE email = ?", [email.toLowerCase().trim()]);
        return res.status(200).json({ email, reactivated: true });
      }
    }

    // Não existe → insere novo
    const [result] = await pool.execute(
      "INSERT INTO subscribers (email, active) VALUES (?, 1)",
      [email.toLowerCase().trim()]
    );
    return res.status(201).json({ id: result.insertId, email });

  } catch (err) {
    console.error("DB error on /subscribe:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

// --- ROTA DE DESCADASTRO ---
app.post("/unsubscribe", async (req, res) => {
  const { email } = req.body;
  if (!isValidEmail(email))
    return res.status(400).json({ error: "Email inválido" });

  try {
    const sql = "UPDATE subscribers SET active = 0 WHERE email = ?";
    const [result] = await pool.execute(sql, [email.toLowerCase().trim()]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Email não encontrado" });
    }
    return res.status(200).json({ email });
  } catch (err) {
    console.error("DB error on /unsubscribe:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

// --- ROTA PÁGINA INICIAL ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

// --- INICIA SERVIDOR ---
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
