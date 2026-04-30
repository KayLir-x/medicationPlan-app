import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./api";
import { BACKGROUND_OPTIONS, getBackgroundStyle } from "./backgroundOptions";

function PatientenSeite() {
  const [patienten, setPatienten] = useState([]);
  const [neuerPatient, setNeuerPatient] = useState("");
  const [neuesGeschlecht, setNeuesGeschlecht] = useState("männlich");
  const [geschlechtFilter, setGeschlechtFilter] = useState("alle");
  const [loading, setLoading] = useState(true);
  const [fehler, setFehler] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [offenesMenueId, setOffenesMenueId] = useState(null);
  const [bearbeitePatientId, setBearbeitePatientId] = useState(null);
  const [bearbeiteterName, setBearbeiteterName] = useState("");
  const [bearbeitetesGeschlecht, setBearbeitetesGeschlecht] = useState("männlich");

  const [user, setUser] = useState(null);
  const [einstellungenOffen, setEinstellungenOffen] = useState(false);
  const [profilName, setProfilName] = useState("");
  const [profilPasswort, setProfilPasswort] = useState("");
  const [sprache, setSprache] = useState("de");
  const [hintergrund, setHintergrund] = useState("medizin");
  const [standardGeschlecht, setStandardGeschlecht] = useState("männlich");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const ladeUser = useCallback(async () => {
    try {
      const data = await apiRequest("/me");

      setUser(data);
      setProfilName(data.name || "");

      const userEinstellungen = data.einstellungen || {};
      setSprache(userEinstellungen.sprache || "de");
      setHintergrund(userEinstellungen.hintergrund || "medizin");
      setStandardGeschlecht(userEinstellungen.standardGeschlecht || "männlich");
      setNeuesGeschlecht(userEinstellungen.standardGeschlecht || "männlich");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "User konnte nicht geladen werden");
    }
  }, []);

  const ladePatienten = useCallback(async () => {
    try {
      setLoading(true);
      setFehler("");

      const data = await apiRequest("/me/patienten");

      setPatienten(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    ladeUser();
    ladePatienten();
  }, [token, navigate, ladeUser, ladePatienten]);

  const patientHinzufuegen = async () => {
    setFehler("");
    setSuccessMessage("");

    const name = neuerPatient.trim();

    if (!name) {
      setFehler("Bitte einen Patientennamen eingeben.");
      return;
    }

    try {
      const data = await apiRequest("/me/patienten", {
        method: "POST",
        body: JSON.stringify({
          name,
          geschlecht: neuesGeschlecht
        })
      });

      setPatienten((prev) => [...prev, data]);
      setNeuerPatient("");
      setNeuesGeschlecht(standardGeschlecht);
      setSuccessMessage("Patient erfolgreich angelegt.");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Fehler beim Speichern");
    }
  };

  const patientLoeschen = async (id) => {
    setFehler("");
    setSuccessMessage("");

    const sicher = window.confirm("Willst du diesen Patienten wirklich löschen?");
    if (!sicher) return;

    try {
      await apiRequest(`/patienten/${id}`, {
        method: "DELETE"
      });

      setPatienten((prev) => prev.filter((p) => p.id !== id));
      setOffenesMenueId(null);

      if (bearbeitePatientId === id) {
        setBearbeitePatientId(null);
        setBearbeiteterName("");
        setBearbeitetesGeschlecht("männlich");
      }

      setSuccessMessage("Patient erfolgreich gelöscht.");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Fehler beim Löschen");
    }
  };

  const patientBearbeiten = async (id) => {
    setFehler("");
    setSuccessMessage("");

    const name = bearbeiteterName.trim();

    if (!name) {
      setFehler("Bitte einen neuen Patientennamen eingeben.");
      return;
    }

    try {
      const data = await apiRequest(`/patienten/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          geschlecht: bearbeitetesGeschlecht
        })
      });

      setPatienten((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
              ...p,
              name: data.name,
              geschlecht: data.geschlecht
            }
            : p
        )
      );

      setBearbeitePatientId(null);
      setBearbeiteterName("");
      setBearbeitetesGeschlecht("männlich");
      setOffenesMenueId(null);
      setSuccessMessage("Patient erfolgreich aktualisiert.");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Fehler beim Bearbeiten");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const profilSpeichern = async () => {
    setFehler("");
    setSuccessMessage("");

    try {
      const data = await apiRequest("/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profilName,
          neuesPasswort: profilPasswort
        })
      });

      setUser(data.user);
      setProfilPasswort("");
      setSuccessMessage("Profil erfolgreich gespeichert.");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Profil konnte nicht gespeichert werden");
    }
  };

  const einstellungenSpeichern = async () => {
    setFehler("");
    setSuccessMessage("");

    try {
      const data = await apiRequest("/me/einstellungen", {
        method: "PUT",
        body: JSON.stringify({
          einstellungen: {
            sprache,
            hintergrund,
            standardGeschlecht
          }
        })
      });

      setUser(data.user);
      setNeuesGeschlecht(standardGeschlecht);
      setSuccessMessage("Einstellungen erfolgreich gespeichert.");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Einstellungen konnten nicht gespeichert werden");
    }
  };

  const gefilterteUndSortiertePatienten = [...patienten]
    .filter((patient) =>
      geschlechtFilter === "alle"
        ? true
        : patient.geschlecht === geschlechtFilter
    )
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  return (
    <div className="page-bg" style={getBackgroundStyle(hintergrund)}>
      <div style={{ marginBottom: "30px" }}>
        <h1 className="page-title">Patienten</h1>
        <p className="page-subtitle">
          Eingeloggt als: <strong>{user?.name || "Unbekannt"}</strong>
        </p>

        <div className="row" style={{ marginTop: "16px" }}>
          <button
            className="button button-secondary"
            onClick={() => setEinstellungenOffen((prev) => !prev)}
          >
            Einstellungen
          </button>

          <button className="button button-danger" onClick={logout}>
            Ausloggen
          </button>
        </div>
        {einstellungenOffen && (
          <div className="glass-card section-card">
            <h2 className="section-title">Einstellungen</h2>

            <div className="settings-grid">
              <div className="settings-block">
                <h3>Profil bearbeiten</h3>

                <input
                  className="input"
                  type="text"
                  placeholder="Benutzername"
                  value={profilName}
                  onChange={(e) => setProfilName(e.target.value)}
                />

                <input
                  className="input"
                  type="password"
                  placeholder="Neues Passwort optional"
                  value={profilPasswort}
                  onChange={(e) => setProfilPasswort(e.target.value)}
                />

                <button className="button button-primary" onClick={profilSpeichern}>
                  Profil speichern
                </button>
              </div>

              <div className="settings-block">
                <h3>Standard-Einstellungen</h3>

                <select
                  className="select"
                  value={sprache}
                  onChange={(e) => setSprache(e.target.value)}
                >
                  <option value="de">Deutsch</option>
                  <option value="en">Englisch</option>
                </select>

                <select
                  className="select"
                  value={standardGeschlecht}
                  onChange={(e) => setStandardGeschlecht(e.target.value)}
                >
                  <option value="männlich">Standard: Männlich</option>
                  <option value="weiblich">Standard: Weiblich</option>
                  <option value="divers">Standard: Divers</option>
                </select>

                <select
                  className="select"
                  value={hintergrund}
                  onChange={(e) => setHintergrund(e.target.value)}
                >
                  {BACKGROUND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      Hintergrund: {option.label}
                    </option>
                  ))}
                </select>

                <button className="button button-primary" onClick={einstellungenSpeichern}>
                  Einstellungen speichern
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="glass-card section-card">
          <div className="row">
            <input
              className="input"
              type="text"
              placeholder="Neuen Patienten eingeben"
              value={neuerPatient}
              onChange={(e) => setNeuerPatient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  patientHinzufuegen();
                }
              }}
            />

            <select
              className="select"
              value={neuesGeschlecht}
              onChange={(e) => setNeuesGeschlecht(e.target.value)}
            >
              <option value="männlich">Männlich</option>
              <option value="weiblich">Weiblich</option>
              <option value="divers">Divers</option>
            </select>

            <button className="button button-primary" onClick={patientHinzufuegen}>
              Patient hinzufügen
            </button>
          </div>

          {fehler && <div className="message message-error">{fehler}</div>}
          {successMessage && (
            <div className="message message-success">{successMessage}</div>
          )}
        </div>

        <div className="glass-card section-card">
          <div className="row">
            <select
              className="select"
              value={geschlechtFilter}
              onChange={(e) => setGeschlechtFilter(e.target.value)}
              style={{ maxWidth: "240px" }}
            >
              <option value="alle">Alle Geschlechter</option>
              <option value="männlich">Männlich</option>
              <option value="weiblich">Weiblich</option>
              <option value="divers">Divers</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="state-text">Patienten werden geladen...</p>
        ) : gefilterteUndSortiertePatienten.length === 0 ? (
          <p className="state-text">Keine Patienten für diesen Filter vorhanden.</p>
        ) : (
          <div className="list">
            {gefilterteUndSortiertePatienten.map((patient) => {
              const istImBearbeitenModus = bearbeitePatientId === patient.id;

              return (
                <div key={patient.id} className="list-item glass-card">
                  <div style={{ flex: 1 }}>
                    {istImBearbeitenModus ? (
                      <div className="edit-box">
                        <input
                          className="input"
                          type="text"
                          value={bearbeiteterName}
                          onChange={(e) => setBearbeiteterName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              patientBearbeiten(patient.id);
                            }
                          }}
                          placeholder="Neuen Namen eingeben"
                          autoFocus
                        />

                        <select
                          className="select"
                          value={bearbeitetesGeschlecht}
                          onChange={(e) => setBearbeitetesGeschlecht(e.target.value)}
                        >
                          <option value="männlich">Männlich</option>
                          <option value="weiblich">Weiblich</option>
                          <option value="divers">Divers</option>
                        </select>

                        <div className="row">
                          <button
                            className="button button-primary"
                            onClick={() => patientBearbeiten(patient.id)}
                          >
                            Speichern
                          </button>

                          <button
                            className="button button-secondary"
                            onClick={() => {
                              setBearbeitePatientId(null);
                              setBearbeiteterName("");
                              setBearbeitetesGeschlecht("männlich");
                              setOffenesMenueId(null);
                            }}
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="list-item-title">{patient.name}</h3>
                        <p className="list-item-text">
                          Geschlecht: {patient.geschlecht || "Nicht angegeben"}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="row">
                    <button
                      className="button button-secondary"
                      onClick={() => navigate(`/kalender/${patient.id}`)}
                    >
                      Wochenplan öffnen
                    </button>

                    {!istImBearbeitenModus && (
                      <div className="action-menu-wrapper">
                        <button
                          className="button button-primary"
                          onClick={() =>
                            setOffenesMenueId((prev) =>
                              prev === patient.id ? null : patient.id
                            )
                          }
                        >
                          Bearbeiten
                        </button>

                        {offenesMenueId === patient.id && (
                          <div className="action-menu glass-card">
                            <button
                              className="button button-secondary button-full"
                              onClick={() => {
                                setBearbeitePatientId(patient.id);
                                setBearbeiteterName(patient.name);
                                setBearbeitetesGeschlecht(
                                  patient.geschlecht || "männlich"
                                );
                                setOffenesMenueId(null);
                              }}
                            >
                              Daten ändern
                            </button>

                            <button
                              className="button button-danger button-full"
                              onClick={() => {
                                setOffenesMenueId(null);
                                patientLoeschen(patient.id);
                              }}
                            >
                              Löschen
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientenSeite;