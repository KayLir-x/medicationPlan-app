require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET fehlt. Bitte .env-Datei prüfen.");
}

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000"
  })
);

app.use(express.json());

function getDateiPfad(dateiname) {
  return path.join(__dirname, dateiname);
}

function leseJsonDatei(dateiname) {
  try {
    const vollerPfad = getDateiPfad(dateiname);

    if (!fs.existsSync(vollerPfad)) {
      return [];
    }

    const file = fs.readFileSync(vollerPfad, "utf-8");
    return file ? JSON.parse(file) : [];
  } catch (err) {
    console.error(`Fehler beim Lesen von ${dateiname}:`, err);
    return [];
  }
}

function schreibeJsonDatei(dateiname, daten) {
  try {
    const vollerPfad = getDateiPfad(dateiname);
    fs.writeFileSync(vollerPfad, JSON.stringify(daten, null, 2), "utf-8");
  } catch (err) {
    console.error(`Fehler beim Schreiben von ${dateiname}:`, err);
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Kein Token vorhanden" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Ungültiger Token" });
  }
}

function findePatientFuerUser(patientId, userId) {
  const patienten = leseJsonDatei("patienten.json");

  return patienten.find(
    (p) => Number(p.id) === Number(patientId) && Number(p.userId) === Number(userId)
  );
}

function validiereId(id, feldname = "ID") {
  if (Number.isNaN(Number(id))) {
    return `${feldname} ist ungültig`;
  }

  return null;
}

function validiereGeschlecht(geschlecht) {
  const gueltigeGeschlechter = ["männlich", "weiblich", "divers"];

  if (!geschlecht || !gueltigeGeschlechter.includes(geschlecht)) {
    return "Ungültiges Geschlecht";
  }

  return null;
}

function getStandardEinstellungen() {
  return {
    sprache: "de",
    hintergrund: "medizin",
    standardGeschlecht: "männlich"
  };
}

function entferneSensibleUserDaten(user) {
  return {
    id: user.id,
    name: user.name,
    einstellungen: user.einstellungen || getStandardEinstellungen()
  };
}

function validiereUserEinstellungen(einstellungen) {
  const erlaubteSprachen = ["de", "en"];
  const erlaubteHintergruende = ["medizin", "hell", "dunkel", "blau", "gruen"];
  const erlaubteGeschlechter = ["männlich", "weiblich", "divers"];

  if (!einstellungen) {
    return "Einstellungen fehlen";
  }

  if (!erlaubteSprachen.includes(einstellungen.sprache)) {
    return "Ungültige Sprache";
  }

  if (!erlaubteHintergruende.includes(einstellungen.hintergrund)) {
    return "Ungültiger Hintergrund";
  }

  if (!erlaubteGeschlechter.includes(einstellungen.standardGeschlecht)) {
    return "Ungültiges Standard-Geschlecht";
  }

  return null;
}

function validierePlanEingabe({ patientId, medikamentName, dosierung, uhrzeit, tage }) {
  const gueltigeTage = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag"
  ];

  if (!patientId) {
    return "Patient fehlt";
  }

  if (!medikamentName || !medikamentName.trim()) {
    return "Medikamentenname fehlt";
  }

  if (!dosierung || !dosierung.trim()) {
    return "Dosierung fehlt";
  }

  if (!uhrzeit || !/^\d{2}:\d{2}$/.test(uhrzeit)) {
    return "Ungültige Uhrzeit";
  }

  if (!Array.isArray(tage) || tage.length === 0) {
    return "Mindestens ein Tag ist erforderlich";
  }

  const alleTageGueltig = tage.every((tag) => gueltigeTage.includes(tag));
  if (!alleTageGueltig) {
    return "Ungültiger Wochentag";
  }

  return null;
}

app.get("/", (req, res) => {
  res.send("Server läuft!");
});

/* =========================
   AUTH
========================= */

app.post("/register", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Name und Passwort erforderlich" });
  }

  if (name.trim().length < 3) {
    return res.status(400).json({ message: "Name muss mindestens 3 Zeichen haben" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Passwort muss mindestens 6 Zeichen haben" });
  }

  const users = leseJsonDatei("users.json");

  const userExistiert = users.some(
    (u) => u.name.toLowerCase() === name.trim().toLowerCase()
  );

  if (userExistiert) {
    return res.status(409).json({ message: "Benutzer existiert bereits" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const neuerUser = {
    id: Date.now(),
    name: name.trim(),
    passwordHash,
    einstellungen: getStandardEinstellungen()
  };

  users.push(neuerUser);
  schreibeJsonDatei("users.json", users);

  res.status(201).json({
    message: "User erstellt",
    user: {
      id: neuerUser.id,
      name: neuerUser.name
    }
  });
});

app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Name und Passwort erforderlich" });
  }

  const users = leseJsonDatei("users.json");

  const user = users.find(
    (u) => u.name.toLowerCase() === name.trim().toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ message: "Ungültige Anmeldedaten" });
  }

  const passwordKorrekt = await bcrypt.compare(password, user.passwordHash);

  if (!passwordKorrekt) {
    return res.status(401).json({ message: "Ungültige Anmeldedaten" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    message: "Login erfolgreich",
    token,
    user: entferneSensibleUserDaten(user)
  });
});

/* =========================
   USER / EINSTELLUNGEN
========================= */

app.get("/me", authMiddleware, (req, res) => {
  const users = leseJsonDatei("users.json");

  const user = users.find((u) => Number(u.id) === Number(req.user.userId));

  if (!user) {
    return res.status(404).json({ message: "User nicht gefunden" });
  }

  if (!user.einstellungen) {
    user.einstellungen = getStandardEinstellungen();
    schreibeJsonDatei("users.json", users);
  }

  res.json(entferneSensibleUserDaten(user));
});

app.put("/me/profile", authMiddleware, async (req, res) => {
  const { name, neuesPasswort } = req.body;

  const users = leseJsonDatei("users.json");
  const userIndex = users.findIndex((u) => Number(u.id) === Number(req.user.userId));

  if (userIndex === -1) {
    return res.status(404).json({ message: "User nicht gefunden" });
  }

  if (!name || name.trim().length < 3) {
    return res.status(400).json({ message: "Name muss mindestens 3 Zeichen haben" });
  }

  const nameExistiert = users.some(
    (u) =>
      Number(u.id) !== Number(req.user.userId) &&
      u.name.toLowerCase() === name.trim().toLowerCase()
  );

  if (nameExistiert) {
    return res.status(409).json({ message: "Benutzername ist bereits vergeben" });
  }

  users[userIndex].name = name.trim();

  if (neuesPasswort && neuesPasswort.trim()) {
    if (neuesPasswort.length < 6) {
      return res.status(400).json({ message: "Passwort muss mindestens 6 Zeichen haben" });
    }

    users[userIndex].passwordHash = await bcrypt.hash(neuesPasswort, 10);
  }

  schreibeJsonDatei("users.json", users);

  res.json({
    message: "Profil aktualisiert",
    user: entferneSensibleUserDaten(users[userIndex])
  });
});

app.put("/me/einstellungen", authMiddleware, (req, res) => {
  const { einstellungen } = req.body;

  const validierungsfehler = validiereUserEinstellungen(einstellungen);

  if (validierungsfehler) {
    return res.status(400).json({ message: validierungsfehler });
  }

  const users = leseJsonDatei("users.json");
  const userIndex = users.findIndex((u) => Number(u.id) === Number(req.user.userId));

  if (userIndex === -1) {
    return res.status(404).json({ message: "User nicht gefunden" });
  }

  users[userIndex].einstellungen = {
    sprache: einstellungen.sprache,
    hintergrund: einstellungen.hintergrund,
    standardGeschlecht: einstellungen.standardGeschlecht
  };

  schreibeJsonDatei("users.json", users);

  res.json({
    message: "Einstellungen gespeichert",
    user: entferneSensibleUserDaten(users[userIndex])
  });
});

/* =========================
   PATIENTEN
========================= */

app.get("/me/patienten", authMiddleware, (req, res) => {
  const daten = leseJsonDatei("patienten.json");
  const gefiltert = daten.filter((p) => Number(p.userId) === Number(req.user.userId));
  res.json(gefiltert);
});

app.post("/me/patienten", authMiddleware, (req, res) => {
  const { name, geschlecht } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Patientenname fehlt" });
  }

  const geschlechtFehler = validiereGeschlecht(geschlecht);
  if (geschlechtFehler) {
    return res.status(400).json({ message: geschlechtFehler });
  }

  const daten = leseJsonDatei("patienten.json");

  const neuerPatient = {
    id: Date.now(),
    name: name.trim(),
    geschlecht,
    userId: req.user.userId
  };

  daten.push(neuerPatient);
  schreibeJsonDatei("patienten.json", daten);

  res.status(201).json(neuerPatient);
});

app.put("/patienten/:id", authMiddleware, (req, res) => {
  const patientId = parseInt(req.params.id, 10);

  const idFehler = validiereId(patientId, "Patienten-ID");
  if (idFehler) {
    return res.status(400).json({ message: idFehler });
  }

  const { name, geschlecht } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Patientenname fehlt" });
  }

  const geschlechtFehler = validiereGeschlecht(geschlecht);
  if (geschlechtFehler) {
    return res.status(400).json({ message: geschlechtFehler });
  }

  let patienten = leseJsonDatei("patienten.json");

  const patientIndex = patienten.findIndex(
    (p) => Number(p.id) === Number(patientId)
  );

  if (patientIndex === -1) {
    return res.status(404).json({ message: "Patient nicht gefunden" });
  }

  if (Number(patienten[patientIndex].userId) !== Number(req.user.userId)) {
    return res.status(403).json({ message: "Kein Zugriff auf diesen Patienten" });
  }

  patienten[patientIndex] = {
    ...patienten[patientIndex],
    name: name.trim(),
    geschlecht
  };

  schreibeJsonDatei("patienten.json", patienten);

  res.json(patienten[patientIndex]);
});

app.delete("/patienten/:id", authMiddleware, (req, res) => {
  const patientId = parseInt(req.params.id, 10);

  const idFehler = validiereId(patientId, "Patienten-ID");
  if (idFehler) {
    return res.status(400).json({ message: idFehler });
  }

  let patienten = leseJsonDatei("patienten.json");
  let plaene = leseJsonDatei("einnahmeplaene.json");

  const patient = patienten.find((p) => Number(p.id) === Number(patientId));

  if (!patient) {
    return res.status(404).json({ message: "Patient nicht gefunden" });
  }

  if (Number(patient.userId) !== Number(req.user.userId)) {
    return res.status(403).json({ message: "Kein Zugriff auf diesen Patienten" });
  }

  patienten = patienten.filter((p) => Number(p.id) !== Number(patientId));
  plaene = plaene.filter((p) => Number(p.patientId) !== Number(patientId));

  schreibeJsonDatei("patienten.json", patienten);
  schreibeJsonDatei("einnahmeplaene.json", plaene);

  res.json({ message: "Patient und Einnahmepläne gelöscht" });
});

/* =========================
   EINNAHMEPLÄNE
========================= */

app.post("/einnahmeplaene", authMiddleware, (req, res) => {
  const { patientId, medikamentName, dosierung, uhrzeit, tage, hinweis } = req.body;

  const validierungsfehler = validierePlanEingabe({
    patientId,
    medikamentName,
    dosierung,
    uhrzeit,
    tage
  });

  if (validierungsfehler) {
    return res.status(400).json({ message: validierungsfehler });
  }

  const patient = findePatientFuerUser(patientId, req.user.userId);

  if (!patient) {
    return res.status(403).json({ message: "Kein Zugriff auf diesen Patienten" });
  }

  const plan = {
    id: Date.now(),
    patientId: Number(patientId),
    medikamentName: medikamentName.trim(),
    dosierung: dosierung.trim(),
    uhrzeit,
    tage,
    hinweis: hinweis ? hinweis.trim() : ""
  };

  const daten = leseJsonDatei("einnahmeplaene.json");
  daten.push(plan);
  schreibeJsonDatei("einnahmeplaene.json", daten);

  res.status(201).json(plan);
});

app.put("/einnahmeplaene/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);

  const idFehler = validiereId(id, "Eintrags-ID");
  if (idFehler) {
    return res.status(400).json({ message: idFehler });
  }

  const { medikamentName, dosierung, uhrzeit, tage, hinweis } = req.body;

  let plaene = leseJsonDatei("einnahmeplaene.json");
  const planIndex = plaene.findIndex((p) => Number(p.id) === Number(id));

  if (planIndex === -1) {
    return res.status(404).json({ message: "Eintrag nicht gefunden" });
  }

  const vorhandenerPlan = plaene[planIndex];
  const patient = findePatientFuerUser(vorhandenerPlan.patientId, req.user.userId);

  if (!patient) {
    return res.status(403).json({ message: "Kein Zugriff auf diesen Eintrag" });
  }

  const validierungsfehler = validierePlanEingabe({
    patientId: vorhandenerPlan.patientId,
    medikamentName,
    dosierung,
    uhrzeit,
    tage
  });

  if (validierungsfehler) {
    return res.status(400).json({ message: validierungsfehler });
  }

  plaene[planIndex] = {
    ...vorhandenerPlan,
    medikamentName: medikamentName.trim(),
    dosierung: dosierung.trim(),
    uhrzeit,
    tage,
    hinweis: hinweis ? hinweis.trim() : ""
  };

  schreibeJsonDatei("einnahmeplaene.json", plaene);

  res.json(plaene[planIndex]);
});

app.delete("/einnahmeplaene/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);

  const idFehler = validiereId(id, "Eintrags-ID");
  if (idFehler) {
    return res.status(400).json({ message: idFehler });
  }

  let plaene = leseJsonDatei("einnahmeplaene.json");
  const plan = plaene.find((p) => Number(p.id) === Number(id));

  if (!plan) {
    return res.status(404).json({ message: "Eintrag nicht gefunden" });
  }

  const patient = findePatientFuerUser(plan.patientId, req.user.userId);

  if (!patient) {
    return res.status(403).json({ message: "Kein Zugriff auf diesen Eintrag" });
  }

  plaene = plaene.filter((p) => Number(p.id) !== Number(id));
  schreibeJsonDatei("einnahmeplaene.json", plaene);

  res.json({ message: "Eintrag gelöscht" });
});

app.get("/einnahmeplaene/:patientId", authMiddleware, (req, res) => {
  const patientId = parseInt(req.params.patientId, 10);

  const idFehler = validiereId(patientId, "Patienten-ID");
  if (idFehler) {
    return res.status(400).json({ message: idFehler });
  }

  const patient = findePatientFuerUser(patientId, req.user.userId);

  if (!patient) {
    return res.status(403).json({ message: "Kein Zugriff auf diesen Patienten" });
  }

  const plaene = leseJsonDatei("einnahmeplaene.json");

  const gefiltert = plaene.filter(
    (plan) => Number(plan.patientId) === Number(patientId)
  );

  res.json(gefiltert);
});

app.get("/einnahmeplaene/:patientId/:tag", authMiddleware, (req, res) => {
  const patientId = parseInt(req.params.patientId, 10);
  const tag = req.params.tag;

  const idFehler = validiereId(patientId, "Patienten-ID");
  if (idFehler) {
    return res.status(400).json({ message: idFehler });
  }

  const patient = findePatientFuerUser(patientId, req.user.userId);

  if (!patient) {
    return res.status(403).json({ message: "Kein Zugriff auf diesen Patienten" });
  }

  const plaene = leseJsonDatei("einnahmeplaene.json");

  const gefiltert = plaene.filter(
    (plan) =>
      Number(plan.patientId) === Number(patientId) &&
      Array.isArray(plan.tage) &&
      plan.tage.includes(tag)
  );

  res.json(gefiltert);
});

app.get("/wochenplan/:patientId", authMiddleware, (req, res) => {
  const patientId = parseInt(req.params.patientId, 10);

  const idFehler = validiereId(patientId, "Patienten-ID");
  if (idFehler) {
    return res.status(400).json({ message: idFehler });
  }

  const patient = findePatientFuerUser(patientId, req.user.userId);

  if (!patient) {
    return res.status(403).json({ message: "Kein Zugriff auf diesen Patienten" });
  }

  const tageDerWoche = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag"
  ];

  const plaene = leseJsonDatei("einnahmeplaene.json");
  const wochenplan = {};

  tageDerWoche.forEach((tag) => {
    wochenplan[tag] = [];
  });

  plaene.forEach((plan) => {
    if (Number(plan.patientId) === Number(patientId) && Array.isArray(plan.tage)) {
      plan.tage.forEach((tag) => {
        if (wochenplan[tag]) {
          wochenplan[tag].push({
            id: plan.id,
            uhrzeit: plan.uhrzeit,
            hinweis: plan.hinweis,
            medikamentName: plan.medikamentName,
            dosierung: plan.dosierung,
            tage: plan.tage
          });
        }
      });
    }
  });

  Object.keys(wochenplan).forEach((tag) => {
    wochenplan[tag].sort((a, b) => a.uhrzeit.localeCompare(b.uhrzeit));
  });

  res.json(wochenplan);
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});