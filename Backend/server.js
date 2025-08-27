require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../Frontend")));

const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /\S+@\S+\.\S+/.test(email);
};

const normalizeEmail = (email) => (email || "").toLowerCase().trim();

const findSubscriber = async (email) => {
  const [rows] = await pool.execute(
    "SELECT id, email, active FROM subscribers WHERE email = ?",
    [email]
  );
  return rows[0];
};

const reactivateSubscriber = (email) => {
  return pool.execute("UPDATE subscribers SET active = 1 WHERE email = ?", [
    email,
  ]);
};

const createSubscriber = async (email) => {
  const [result] = await pool.execute(
    "INSERT INTO subscribers (email) VALUES (?)",
    [email]
  );
  return { id: result.insertId, email };
};

const deactivateSubscriber = (email) => {
  return pool.execute("UPDATE subscribers SET active = 0 WHERE email = ?", [
    email,
  ]);
};

app.post("/subscribe", async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    const existingSubscriber = await findSubscriber(email);

    if (existingSubscriber) {
      if (existingSubscriber.active) {
        return res
          .status(409)
          .json({ error: "Este email já está cadastrado." });
      } else {
        await reactivateSubscriber(email);
        return res
          .status(200)
          .json({ message: "Sua inscrição foi reativada!", reactivated: true });
      }
    }

    const newSubscriber = await createSubscriber(email);
    return res.status(201).json(newSubscriber);
  } catch (error) {
    console.error("Erro em /subscribe:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

app.post("/unsubscribe", async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    const subscriber = await findSubscriber(email);

    if (!subscriber) {
      return res.status(404).json({ error: "Este e-mail não está inscrito." });
    }

    if (!subscriber.active) {
      return res.status(409).json({ error: "Este e-mail já foi desinscrito." });
    }

    await deactivateSubscriber(email);
    return res
      .status(200)
      .json({ message: "Você foi desinscrito com sucesso." });
  } catch (error) {
    console.error("Erro em /unsubscribe:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
