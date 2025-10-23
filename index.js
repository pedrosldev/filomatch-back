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
      "Veure sèries/pel·lícules",
      "Videojocs",
    ],
  },
  {
    id: 2,
    text: "En quina àrea de la filologia catalana t'agradaria especialitzar-te?",
    options: [
      "Lingüística diacrònica (història de la llengua)",
      "Lingüística sincrònica (gramàtica, sintaxi)",
      "Literatura medieval",
      "Literatura contemporània",
      "Sociolingüística i planificació lingüística",
      "Dialectologia i varietats del català",
    ],
  },
  {
    id: 3,
    text: "Com prefereixes treballar en projectes?",
    options: [
      "Sol, amb total autonomia",
      "En equip col·laboratiu",
      "Amb rols ben definits",
      "Amb flexibilitat per canviar enfocaments",
      "Amb supervisió i retroalimentació constant",
    ],
  },
  {
    id: 4,
    text: "Quin àmbit de la filologia catalana et resulta més interessant?",
    options: [
      "Anàlisi de textos literaris",
      "Estudi de la variació lingüística",
      "Edició i crítica textual",
      "Ensenyament del català com a llengua",
      "Traducció i interpretació",
      "Lexicografia i terminologia",
    ],
  },
  {
    id: 5,
    text: "Què busques principalment en un company de treball?",
    options: [
      "Responsabilitat i compromís",
      "Creativitat i idees innovadores",
      "Coneixement tècnic sòlid",
      "Bones habilitats de comunicació",
      "Capacitat per resoldre problemes",
    ],
  },
  // NUEVAS PREGUNTAS SOBRE EL AMOR COMO CONCEPTO
  {
    id: 6,
    text: "Quina definició d'amor s'apropa més a la teva visió?",
    options: [
      "Una connexió emocional profunda",
      "Una decisió conscient i un compromís",
      "Una atracció física i passional",
      "Una amistat intensa que creix amb el temps",
      "Una fusió d'ànimes o esperits",
      "Una construcció social i cultural",
    ],
  },
  {
    id: 7,
    text: "Quin aspecte creus que és més important en una relació amorosa?",
    options: [
      "La confiança i l'honestedat",
      "La comunicació oberta",
      "La passió i l'atracció",
      "Els valors i objectius compartits",
      "El respecte i la llibertat individual",
      "El suport mutu en moments difícils",
    ],
  },
  {
    id: 8,
    text: "Com creus que s'expressa millor l'amor?",
    options: [
      "Mitjançant paraules i declaracions",
      "A través d'accions i detalls quotidians",
      "Amb contacte físic i afecte",
      "Dedicant temps de qualitat",
      "Compartint projectes i somnis",
      "Donant suport incondicional",
    ],
  },
  {
    id: 9,
    text: "Quin tipus d'amor consideres que té més influència en la vida de les persones?",
    options: [
      "L'amor romàntic de parella",
      "L'amor familiar",
      "L'amor als amics",
      "L'amor propi i l'autoacceptació",
      "L'amor als animals o mascotes",
      "L'amor a la humanitat en general",
    ],
  },
  {
    id: 10,
    text: "Com veus la relació entre l'amor i la llibertat?",
    options: [
      "L'amor veritable dóna llibertat",
      "L'amor implica certs límits i compromisos",
      "Són conceptes contradictoris",
      "La llibertat és necessària per experimentar l'amor",
      "L'amor veritable no neix la llibertat",
      "Depèn del tipus d'amor i la relació",
    ],
  },
  {
    id: 11,
    text: "test",
    options: [
      "test1",
      "test2",
      "test3",
      "test4",
      "test5",
      "test6",
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
    const { nom, respostes } = req.body;

    if (!nom || !respostes) {
      return res.status(400).json({ error: "Falten dades necessàries" });
    }

    // Verificar si l'usuari ja existeix
    const [usuarisExistents] = await db.execute(
      "SELECT id FROM usuaris WHERE nom = ?",
      [nom]
    );

    let usuariId;

    if (usuarisExistents.length > 0) {
      // Usuari existeix - actualitzar les seves respostes
      usuariId = usuarisExistents[0].id;

      // Eliminar respostes anteriors
      await db.execute("DELETE FROM respostes WHERE usuari_id = ?", [usuariId]);
    } else {
      // Usuari nou - crear registre
      const [result] = await db.execute(
        "INSERT INTO usuaris (nom) VALUES (?)",
        [nom]
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
            SELECT u.*, COUNT(r.id) as comptador_respostes 
            FROM usuaris u 
            LEFT JOIN respostes r ON u.id = r.usuari_id 
            GROUP BY u.id 
            ORDER BY u.nom
        `);

    const usuarisFormatejats = usuaris.map((usuari) => ({
      id: usuari.id,
      nom: usuari.nom,
      comptador_respostes: usuari.comptador_respostes,
    }));

    res.json(usuarisFormatejats);
  } catch (error) {
    console.error("Error obtenint usuaris:", error);
    res.status(500).json({ error: "Error intern del servidor" });
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
