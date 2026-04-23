import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function KalenderSeite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [plaene, setPlaene] = useState([]);
  const [zeit, setZeit] = useState("");
  const [tag, setTag] = useState("");
  const [medikament, setMedikament] = useState("");
  const [dosierung, setDosierung] = useState("");
  const [loading, setLoading] = useState(true);
  const [fehler, setFehler] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [offenesMenueId, setOffenesMenueId] = useState(null);
  const [bearbeitePlanId, setBearbeitePlanId] = useState(null);
  const [bearbeitenForm, setBearbeitenForm] = useState({
    medikamentName: "",
    dosierung: "",
    uhrzeit: "",
    tag: ""
  });

  const tage = useMemo(
    () => [
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
      "Sonntag"
    ],
    []
  );

  const zeiten = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
    []
  );

  const formularZuruecksetzen = () => {
    setMedikament("");
    setDosierung("");
    setZeit("");
    setTag("");
  };

  const bearbeitungsFormZuruecksetzen = () => {
    setBearbeitePlanId(null);
    setBearbeitenForm({
      medikamentName: "",
      dosierung: "",
      uhrzeit: "",
      tag: ""
    });
    setOffenesMenueId(null);
  };

  const ladePlaene = useCallback(async () => {
    try {
      setLoading(true);
      setFehler("");

      const res = await fetch(`http://localhost:5000/einnahmeplaene/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Fehler beim Laden des Wochenplans");
      }

      setPlaene(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    ladePlaene();
  }, [ladePlaene, navigate, token]);

  const planHinzufuegen = async () => {
    setFehler("");
    setSuccessMessage("");

    const medikamentName = medikament.trim();
    const dosierungWert = dosierung.trim();

    if (!medikamentName || !dosierungWert || !zeit || !tag) {
      setFehler("Bitte Medikament, Dosierung, Zeit und Tag ausfüllen.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/einnahmeplaene", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: parseInt(id, 10),
          medikamentName,
          dosierung: dosierungWert,
          uhrzeit: zeit,
          tage: [tag],
          hinweis: ""
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Eintrag konnte nicht gespeichert werden");
      }

      setPlaene((prev) => [...prev, data]);
      formularZuruecksetzen();
      setSuccessMessage("Eintrag erfolgreich gespeichert.");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Fehler beim Speichern");
    }
  };

  const deletePlan = async (planId) => {
    setFehler("");
    setSuccessMessage("");

    const sicher = window.confirm("Eintrag wirklich löschen?");
    if (!sicher) return;

    try {
      const res = await fetch(`http://localhost:5000/einnahmeplaene/${planId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Eintrag konnte nicht gelöscht werden");
      }

      setPlaene((prev) => prev.filter((plan) => plan.id !== planId));

      if (bearbeitePlanId === planId) {
        bearbeitungsFormZuruecksetzen();
      }

      setOffenesMenueId(null);
      setSuccessMessage("Eintrag erfolgreich gelöscht.");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Fehler beim Löschen");
    }
  };

  const bearbeitungStarten = (eintrag, tagName) => {
    setBearbeitePlanId(eintrag.id);
    setBearbeitenForm({
      medikamentName: eintrag.medikamentName || "",
      dosierung: eintrag.dosierung || "",
      uhrzeit: eintrag.uhrzeit || "",
      tag: tagName || ""
    });
    setOffenesMenueId(null);
    setFehler("");
    setSuccessMessage("");
  };

  const planBearbeiten = async (planId) => {
    setFehler("");
    setSuccessMessage("");

    const medikamentName = bearbeitenForm.medikamentName.trim();
    const dosierungWert = bearbeitenForm.dosierung.trim();

    if (!medikamentName || !dosierungWert || !bearbeitenForm.uhrzeit || !bearbeitenForm.tag) {
      setFehler("Bitte Medikament, Dosierung, Zeit und Tag ausfüllen.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/einnahmeplaene/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          medikamentName,
          dosierung: dosierungWert,
          uhrzeit: bearbeitenForm.uhrzeit,
          tage: [bearbeitenForm.tag],
          hinweis: ""
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Eintrag konnte nicht bearbeitet werden");
      }

      setPlaene((prev) =>
        prev.map((plan) => (plan.id === planId ? data : plan))
      );

      bearbeitungsFormZuruecksetzen();
      setSuccessMessage("Eintrag erfolgreich aktualisiert.");
    } catch (err) {
      console.error(err);
      setFehler(err.message || "Fehler beim Bearbeiten");
    }
  };

  const wochenplan = useMemo(() => {
    const plan = {};

    tage.forEach((t) => {
      plan[t] = [];
    });

    plaene.forEach((eintrag) => {
      const eintragTage = Array.isArray(eintrag.tage) ? eintrag.tage : [];

      eintragTage.forEach((t) => {
        if (plan[t]) {
          plan[t].push(eintrag);
        }
      });
    });

    Object.keys(plan).forEach((t) => {
      plan[t].sort((a, b) => a.uhrzeit.localeCompare(b.uhrzeit));
    });

    return plan;
  }, [plaene, tage]);

  return (
    <div className="page-bg">
      <button
        className="button button-primary"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/patienten");
          }
        }}
        style={{ marginBottom: "20px" }}
      >
        Zurück zu Patienten
      </button>

      <div style={{ marginBottom: "30px" }}>
        <h1 className="page-title">Wochenplan</h1>
      </div>

      <div className="glass-card section-card">
        <div className="row" style={{ alignItems: "center" }}>
          <input
            className="input"
            placeholder="Medikament"
            value={medikament}
            onChange={(e) => setMedikament(e.target.value)}
            style={{ flex: 2 }}
          />

          <input
            className="input"
            placeholder="Dosierung"
            value={dosierung}
            onChange={(e) => setDosierung(e.target.value)}
            style={{ flex: 1 }}
          />

          <select
            className="select"
            value={zeit}
            onChange={(e) => setZeit(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Zeit</option>
            {zeiten.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Tag</option>
            {tage.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            className="button button-primary"
            onClick={planHinzufuegen}
            style={{ whiteSpace: "nowrap" }}
          >
            Eintrag hinzufügen
          </button>
        </div>

        {fehler && <div className="message message-error">{fehler}</div>}
        {successMessage && (
          <div className="message message-success">{successMessage}</div>
        )}
      </div>

      {loading ? (
        <p className="state-text">Wochenplan wird geladen...</p>
      ) : (
        <div className="calendar-grid">
          {tage.map((tagName) => (
            <div key={tagName} className="day-card glass-card">
              <h3 className="day-title">{tagName}</h3>

              {wochenplan[tagName]?.length > 0 ? (
                wochenplan[tagName].map((eintrag) => {
                  const istImBearbeitenModus = bearbeitePlanId === eintrag.id;

                  return (
                    <div key={eintrag.id} className="plan-item">
                      {istImBearbeitenModus ? (
                        <div className="edit-box">
                          <input
                            className="input"
                            placeholder="Medikament"
                            value={bearbeitenForm.medikamentName}
                            onChange={(e) =>
                              setBearbeitenForm((prev) => ({
                                ...prev,
                                medikamentName: e.target.value
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                planBearbeiten(eintrag.id);
                              }
                            }}
                            autoFocus
                          />

                          <input
                            className="input"
                            placeholder="Dosierung"
                            value={bearbeitenForm.dosierung}
                            onChange={(e) =>
                              setBearbeitenForm((prev) => ({
                                ...prev,
                                dosierung: e.target.value
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                planBearbeiten(eintrag.id);
                              }
                            }}
                          />

                          <select
                            className="select"
                            value={bearbeitenForm.uhrzeit}
                            onChange={(e) =>
                              setBearbeitenForm((prev) => ({
                                ...prev,
                                uhrzeit: e.target.value
                              }))
                            }
                          >
                            <option value="">Zeit</option>
                            {zeiten.map((z) => (
                              <option key={z} value={z}>
                                {z}
                              </option>
                            ))}
                          </select>

                          <select
                            className="select"
                            value={bearbeitenForm.tag}
                            onChange={(e) =>
                              setBearbeitenForm((prev) => ({
                                ...prev,
                                tag: e.target.value
                              }))
                            }
                          >
                            <option value="">Tag</option>
                            {tage.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          <div className="row" style={{ marginTop: "10px" }}>
                            <button
                              className="button button-primary"
                              onClick={() => planBearbeiten(eintrag.id)}
                            >
                              Speichern
                            </button>

                            <button
                              className="button button-secondary"
                              onClick={bearbeitungsFormZuruecksetzen}
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p>
                            <strong>{eintrag.uhrzeit}</strong>
                          </p>
                          <p>{eintrag.medikamentName}</p>
                          <p>{eintrag.dosierung}</p>

                          <div className="action-menu-wrapper">
                            <button
                              className="button button-primary"
                              onClick={() =>
                                setOffenesMenueId((prev) =>
                                  prev === eintrag.id ? null : eintrag.id
                                )
                              }
                            >
                              Bearbeiten
                            </button>

                            {offenesMenueId === eintrag.id && (
                              <div className="action-menu glass-card">
                                <button
                                  className="button button-secondary button-full"
                                  onClick={() => bearbeitungStarten(eintrag, tagName)}
                                >
                                  Eintrag ändern
                                </button>

                                <button
                                  className="button button-danger button-full"
                                  onClick={() => {
                                    setOffenesMenueId(null);
                                    deletePlan(eintrag.id);
                                  }}
                                >
                                  Löschen
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <p>Keine Einträge</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KalenderSeite;