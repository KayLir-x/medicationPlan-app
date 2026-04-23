import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginSeite() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false); 
  const [fehler, setFehler] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 const handleAuth = async () => {
  setFehler("");
  setSuccessMessage("");

  if (!name || !password) {
    setFehler("Bitte Name und Passwort eingeben.");
    return;
  }

  const endpoint = isRegister ? "/register" : "/login";

  try {
    setLoading(true);

    const res = await fetch(`https://medicationplan-backend.onrender.com${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setFehler(data.message || "Fehler bei Anmeldung");
      return;
    }

    if (!isRegister) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/patienten");
    } else {
      setSuccessMessage("Registrierung erfolgreich. Jetzt einloggen.");
      setIsRegister(false);
      setPassword("");
    }
  } catch (err) {
    console.error(err);
    setFehler("Server nicht erreichbar");
  } finally {
    setLoading(false);
  }
};

 return (
  <div className="centered-page">
    <div className="glass-card form-card">
      <h1 className="hero-title">
        {isRegister ? "Registrieren" : "Willkommen"}
      </h1>

      <div className="form-group">
        <input
          className="input"
          placeholder="Dein Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="button button-primary button-full"
          onClick={handleAuth}
          disabled={loading}
        >
          {loading
            ? "Bitte warten..."
            : isRegister
            ? "Registrieren"
            : "Einloggen"}
        </button>

        <button
          className="button button-secondary button-full"
          onClick={() => {
            setIsRegister(!isRegister);
            setFehler("");
            setSuccessMessage("");
          }}
          disabled={loading}
        >
          {isRegister
            ? "Zurück zum Login"
            : "Noch kein Konto? Registrieren"}
        </button>
      </div>

      {fehler && <div className="message message-error">{fehler}</div>}
      {successMessage && (
        <div className="message message-success">{successMessage}</div>
      )}
    </div>
  </div>
);
}

export default LoginSeite;