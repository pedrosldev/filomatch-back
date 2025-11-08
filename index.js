const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Configuración para XAMPP
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "enquesta_match",
  charset: "utf8mb4",
};

let db;

async function connectDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log("✅ Connectat a la base de dades MySQL");

    // Verificar y crear tablas si no existen
    await crearTablasSiNoExisten();
  } catch (error) {
    console.error("❌ Error connectant a la base de dades:", error.message);
  }
}

async function crearTablasSiNoExisten() {
  try {
    // Crear tabla usuaris si no existe
    await db.execute(`
            CREATE TABLE IF NOT EXISTS usuaris (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(100) NOT NULL UNIQUE,
                data_registre TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

    // Crear tabla preguntes si no existe
    await db.execute(`
            CREATE TABLE IF NOT EXISTS preguntes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                text_pregunta TEXT NOT NULL,
                opcions JSON NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

    // Crear tabla respostes si no existe
    await db.execute(`
            CREATE TABLE IF NOT EXISTS respostes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuari_id INT,
                pregunta_id INT,
                resposta_index INT,
                data_resposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuari_id) REFERENCES usuaris(id) ON DELETE CASCADE,
                FOREIGN KEY (pregunta_id) REFERENCES preguntes(id) ON DELETE CASCADE,
                UNIQUE KEY resposta_unica (usuari_id, pregunta_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

    console.log("✅ Taules verificades/creades correctament");
    await inicialitzarPreguntes();
  } catch (error) {
    console.error("Error creant taules:", error);
  }
}

// Preguntes adaptades per a estudiants de Filologia Catalana - AMPLIADO
const preguntesPredefinides = [
  {
    id: 1,
    text: "Quin tipus d'activitats prefereixes en el teu temps lliure?",
    options: [
      "Esports i exercici",
      "Llegir o estudiar",
      "Sortir amb amics",
      "Veure sèries o pel·lícules",
      "Videojocs",
    ],
  },
  {
    id: 2,
    text: "Quin tipus de menjar t'agrada més?",
    options: [
      "Mediterrani i saludable",
      "Asiàtic o exòtic",
      "Ràpid i informal (pizza, hamburgueses...)",
      "Gourmet o de fusió",
    ],
  },
  {
    id: 3,
    text: "Quin gènere musical escoltes més sovint?",
    options: [
      "Pop o música comercial",
      "Rock o indie",
      "Electrònica o urbana",
      "Clàssica, jazz o acústica",
    ],
  },
  {
    id: 4,
    text: "Com t'agrada passar un cap de setmana ideal?",
    options: [
      "Sortint amb amics o fent plans a l'aire lliure",
      "Relaxant-me a casa amb una sèrie o un llibre",
      "Viatjant i descobrint llocs nous",
      "Fent esport o alguna activitat física",
    ],
  },
  {
    id: 5,
    text: "Què valores més en una relació?",
    options: [
      "La confiança i l'honestedat",
      "L'humor i la diversió",
      "La passió i la química",
      "El suport i la complicitat",
    ],
  },
  {
    id: 6,
    text: "Quina activitat t'agradaria fer en una primera cita?",
    options: [
      "Prendre un cafè o fer una copa tranquil·la",
      "Fer una excursió o caminar per la natura",
      "Anar a un concert o esdeveniment cultural",
      "Sopar en un lloc especial",
    ],
  },
  {
    id: 7,
    text: "Quin tipus de viatge prefereixes?",
    options: [
      "Ciutats i cultura",
      "Platja i relax",
      "Muntanya i natura",
      "Aventures i improvisació",
    ],
  },
  {
    id: 8,
    text: "Com gestiones els conflictes en parella?",
    options: [
      "Parlant-ho amb calma i escoltant",
      "Necessito espai abans de parlar",
      "Evito discutir, prefereixo deixar-ho córrer",
      "Expressant-ho tot immediatament",
    ],
  },
  {
    id: 9,
    text: "Què busques actualment en una relació?",
    options: [
      "Una relació seriosa i estable",
      "Alguna cosa relaxada, sense pressa",
      "Conèixer gent nova i veure què passa",
      "Només amistat o companyia",
    ],
  },
  {
    id: 10,
    text: "Com descriuries la teva actitud davant la vida?",
    options: [
      "Positiva i optimista",
      "Tranquil·la i reflexiva",
      "Apassionada i intensa",
      "Pràctica i realista",
    ],
  },
];

async function inicialitzarPreguntes() {
  try {
    console.log("🔄 Sincronitzant preguntes amb la base de dades...");

    // 1. ELIMINAR todas las preguntas existentes
    await db.execute("DELETE FROM preguntes");
    console.log("🗑️  Preguntes antigues eliminades");

    // 2. INSERTAR todas las preguntas actualizadas
    for (const pregunta of preguntesPredefinides) {
      await db.execute(
        "INSERT INTO preguntes (id, text_pregunta, opcions) VALUES (?, ?, ?)",
        [pregunta.id, pregunta.text, JSON.stringify(pregunta.options)]
      );
    }

    console.log(
      `✅ Base de dades actualitzada amb ${preguntesPredefinides.length} preguntes`
    );
    console.log("📝 Inclosa la nova pregunta de test");
  } catch (error) {
    console.error("Error actualitzant preguntes:", error);
  }
}

// RUTAS API

// Obtenir totes les preguntes
app.get("/api/preguntes", async (req, res) => {
  try {
    const [preguntes] = await db.execute("SELECT * FROM preguntes ORDER BY id");

    if (preguntes.length === 0) {
      return res.json(preguntesPredefinides);
    }

    const preguntesFormatejades = preguntes.map((pregunta) => ({
      id: pregunta.id,
      text: pregunta.text_pregunta,
      options: JSON.parse(pregunta.opcions),
    }));

    res.json(preguntesFormatejades);
  } catch (error) {
    console.error("Error obtenint preguntes:", error);
    res.json(preguntesPredefinides); // Fallback a preguntas predefinidas
  }
});

// Guardar respostes d'un usuari
app.post("/api/respostes", async (req, res) => {
  try {
    const { nom, email, respostes } = req.body;

    if (!nom || !email || !respostes) {
      return res.status(400).json({ error: "Falten dades necessàries" });
    }

    // Verificar si l'usuari ja existeix
    const [usuarisExistents] = await db.execute(
      "SELECT id FROM usuaris WHERE email = ?",
      [email]
    );

    let usuariId;

    if (usuarisExistents.length > 0) {
      // Usuari existeix - actualitzar les seves respostes
      // usuariId = usuarisExistents[0].id;

      // Eliminar respostes anteriors
      // await db.execute("DELETE FROM respostes WHERE usuari_id = ?", [usuariId]);
           return res.status(400).json({
             error: "Aquest email ja ha participat en l'enquesta",
           });
    } else {
      // Usuari nou - crear registre
      const [result] = await db.execute(
        "INSERT INTO usuaris (nom, email) VALUES (?, ?)",
        [nom, email]
      );
      usuariId = result.insertId;
    }

    // Guardar totes les respostes
    for (const [preguntaId, respostaIndex] of Object.entries(respostes)) {
      await db.execute(
        "INSERT INTO respostes (usuari_id, pregunta_id, resposta_index) VALUES (?, ?, ?)",
        [usuariId, preguntaId, respostaIndex]
      );
    }

    res.json({
      success: true,
      usuari_id: usuariId,
      message: "Respostes guardades correctament",
    });
  } catch (error) {
    console.error("Error guardant respostes:", error);
    res.status(500).json({ error: "Error intern del servidor" });
  }
});

// Obtenir llista d'usuaris
app.get("/api/usuaris", async (req, res) => {
  try {
    const [usuaris] = await db.execute(`
      SELECT 
        u.id,
        u.nom,
        u.email,
        u.data_registre,
        COUNT(r.id) as comptador_respostes 
      FROM usuaris u 
      LEFT JOIN respostes r ON u.id = r.usuari_id 
      GROUP BY u.id, u.nom, u.email, u.data_registre
      ORDER BY u.nom
    `);

    res.json(usuaris);
  } catch (error) {
    console.error("Error obtenint usuaris:", error);
    res.status(500).json({
      error: "Error obtenint usuaris",
      details: error.message,
    });
  }
});
// Calcular matches d'un usuari específic
app.post("/api/matches", async (req, res) => {
  try {
    const { nom_usuari } = req.body;

    if (!nom_usuari) {
      return res.status(400).json({ error: "Falta el nom de l'usuari" });
    }

    // Obtenir ID de l'usuari
    const [usuaris] = await db.execute("SELECT id FROM usuaris WHERE nom = ?", [
      nom_usuari,
    ]);

    if (usuaris.length === 0) {
      return res.status(404).json({ error: "Usuari no trobat" });
    }

    const usuariId = usuaris[0].id;

    // Obtenir nombre total de preguntes
    const [preguntes] = await db.execute("SELECT id FROM preguntes");
    const totalPreguntes = preguntes.length;

    // Calcular similituds amb altres usuaris
    const [matches] = await db.execute(
      `
            SELECT 
                u2.nom as altre_usuari,
                COUNT(CASE WHEN r1.resposta_index = r2.resposta_index THEN 1 END) as respostes_iguals
            FROM usuaris u1
            CROSS JOIN usuaris u2
            LEFT JOIN respostes r1 ON u1.id = r1.usuari_id
            LEFT JOIN respostes r2 ON u2.id = r2.usuari_id AND r1.pregunta_id = r2.pregunta_id
            WHERE u1.id = ? 
              AND u2.id != u1.id
            GROUP BY u2.id, u2.nom
            HAVING COUNT(r1.id) = ? AND COUNT(r2.id) = ?
            ORDER BY respostes_iguals DESC
            LIMIT 5
        `,
      [usuariId, totalPreguntes, totalPreguntes]
    );

    const matchesFormatejats = matches.map((match) => {
      const percentatge = Math.round(
        (match.respostes_iguals / totalPreguntes) * 100
      );
      return {
        usuari: match.altre_usuari,
        similitud: percentatge,
        respostes_iguals: match.respostes_iguals,
        total_preguntes: totalPreguntes,
      };
    });

    res.json(matchesFormatejats);
  } catch (error) {
    console.error("Error calculant matches:", error);
    res.status(500).json({ error: "Error intern del servidor" });
  }
});

// Obtenir tots els matches del grup
app.get("/api/tots-matches", async (req, res) => {
  try {
    // Obtenir nombre total de preguntes
    const [preguntes] = await db.execute("SELECT id FROM preguntes");
    const totalPreguntes = preguntes.length;

    // Calcular tots els matches
    const [matches] = await db.execute(
      `
            SELECT 
                u1.nom as usuari1,
                u2.nom as usuari2,
                COUNT(CASE WHEN r1.resposta_index = r2.resposta_index THEN 1 END) as respostes_iguals
            FROM usuaris u1
            JOIN usuaris u2 ON u1.id < u2.id
            JOIN respostes r1 ON u1.id = r1.usuari_id
            JOIN respostes r2 ON u2.id = r2.usuari_id AND r1.pregunta_id = r2.pregunta_id
            GROUP BY u1.id, u2.id, u1.nom, u2.nom
            HAVING COUNT(r1.id) = ? AND COUNT(r2.id) = ?
            ORDER BY respostes_iguals DESC
        `,
      [totalPreguntes, totalPreguntes]
    );

    const matchesFormatejats = matches.map((match) => {
      const percentatge = Math.round(
        (match.respostes_iguals / totalPreguntes) * 100
      );
      return {
        usuaris: [match.usuari1, match.usuari2],
        similitud: percentatge,
        respostes_iguals: match.respostes_iguals,
        total_preguntes: totalPreguntes,
      };
    });

    res.json(matchesFormatejats);
  } catch (error) {
    console.error("Error obtenint tots els matches:", error);
    res.status(500).json({ error: "Error intern del servidor" });
  }
});

// Ruta principal - servir el frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Ruta de salud para verificar que el servidor funciona
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor funcionant correctament",
    timestamp: new Date().toISOString(),
  });
});

// Verificar si un email ya ha respondido
app.get("/api/email-existeix/:email", async (req, res) => {
  try {
    const email = req.params.email;
    
    const [usuaris] = await db.execute(
      "SELECT id, nom FROM usuaris WHERE email = ?",
      [email]
    );

    res.json({
      existeix: usuaris.length > 0,
      usuari_id: usuaris.length > 0 ? usuaris[0].id : null,
      nom: usuaris.length > 0 ? usuaris[0].nom : null
    });
  } catch (error) {
    console.error("Error verificant email:", error);
    res.status(500).json({ error: "Error intern del servidor" });
  }
});

// Manejo de errores para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Iniciar servidor
async function startServer() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corrent en http://localhost:${PORT}`);
    console.log(`📊 API endpoints disponibles en http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);
