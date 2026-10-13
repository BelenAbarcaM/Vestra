
import React, { useEffect, useState } from "react";
import "./Inicio.css";
import "../fontello/css/fontello.css";
import "./Base_Club.css";
import logito from "../assets/logito.png";
import NutriaEscondida from "./Nutria_escondida";


const API = "http://localhost/vestra/backend/api/club/ver.php";

function formatearHora(hora) {
    if (!hora) return "";

    const partes = hora.split(":");
    const horas = Number(partes[0]);
    const minutos = partes[1] || "00";

    if (Number.isNaN(horas)) return hora;

    const periodo = horas >= 12 ? "p. m." : "a. m.";
    const hora12 = horas % 12 || 12;

    return `${hora12}:${minutos} ${periodo}`;
}

function formatearCuota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "No especificada";
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return valor;
    }

    return new Intl.NumberFormat("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0
    }).format(numero);
}

export default function BaseClub({
  idClub,
  onVolver,
  puedeSolicitar = false,
  onSolicitarInscripcion,
  onEditar,
  onAbrirForo
}) {
    const [club, setClub] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarClub() {
            if (!idClub) {
                setError("No se indicó qué club se desea consultar.");
                setCargando(false);
                return;
            }

            setCargando(true);
            setError("");
            setClub(null);

            try {
                const respuesta = await fetch(
                    `${API}?id=${encodeURIComponent(idClub)}`,
                    {
                        method: "GET",
                        credentials: "include",
                        signal: controlador.signal
                    }
                );

                const datos = await respuesta.json();

                if (!respuesta.ok || datos.error) {
                    throw new Error(
                        datos.error || "No se pudo cargar la información del club."
                    );
                }

                setClub(datos);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Error cargando club:", err);
                    setError(
                        err.message || "No se pudo conectar con el servidor."
                    );
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargando(false);
                }
            }
        }

        cargarClub();

        return () => controlador.abort();
    }, [idClub]);

    if (cargando) {
        return (
            <div className="base-club-container">
                <main className="base-club-page">
                    <p>Cargando información del club...</p>
                </main>
            </div>
        );
    }

    if (error || !club) {
        return (
            <div className="base-club-container">
                <main className="base-club-page">
                    {onVolver && (
                        <button
                            className="solicitud-back"
                            type="button"
                            onClick={onVolver}
                        >
                            ← Volver a clubes
                        </button>
                    )}

                    <p role="alert">
                        {error || "No se encontró el club."}
                    </p>
                </main>
            </div>
        );
    }

    return (
        <>
            <NutriaEscondida />

            <div className="base-club-container">
                <main className="base-club-page">
                    <section className="base-club-overview">
                        {onVolver && (
                            <button
                                className="solicitud-back"
                                type="button"
                                onClick={onVolver}
                            >
                                ← Volver a clubes
                            </button>
                        )}

                        <header className="base-club-header">
    <div className="base-club-title-group">
        <h1>{club.Nombre}</h1>

        <p className="base-club-creator">
            <span
                className="base-club-creator-icon"
                aria-hidden="true"
            >
                ●
            </span>
            {club.profesor || "Profesor no especificado"}
        </p>
    </div>

    {club.puede_editar && (
        <button
            type="button"
            className="base-club-edit-btn"
            onClick={onEditar}
            title="Editar información del club"
            aria-label="Editar información del club"
        >
            <i className="icon-pencil" aria-hidden="true"></i>
        </button>
    )}
</header>

                        <p className="base-club-subtitle">
                            Información general del club
                        </p>

                        <img
                            className="base-club-photo"
                            src={club.Foto_url || logito}
                            alt={`Imagen del club ${club.Nombre}`}
                            onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = logito;
                            }}
                        />
                    </section>

                    <div className="base-club-details">
                        <section className="base-club-section">
                            <h2>¿Qué es?</h2>

                            <p>
                                {club.Descripcion ||
                                    "Este club todavía no tiene una descripción."}
                            </p>
                        </section>

                        <section className="base-club-section">
                            <h2>Horario</h2>

                            <div className="base-club-schedule">
                                <h3>Horarios de reunión</h3>

                                {club.horarios?.length > 0 ? (
                                    <div className="base-club-activity-list">
                                        {club.horarios.map((horario, index) => (
                                            <article
                                                className="base-club-activity"
                                                key={`${horario.dia}-${horario.hora_inicio}-${index}`}
                                            >
                                                <span className="base-club-activity-day">
                                                    {horario.dia}
                                                </span>

                                                <span>
                                                    Sesión del club
                                                </span>

                                                <span className="base-club-activity-time">
                                                    {formatearHora(horario.hora_inicio)}
                                                    {" – "}
                                                    {formatearHora(horario.hora_fin)}
                                                </span>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p>
                                        No hay horarios registrados para este club.
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="base-club-section">
                            <h2>Cuota</h2>

                            {club.cuotas?.length > 0 ? (
                                <table className="base-club-fees">
                                    <tbody>
                                        {club.cuotas.map((cuota, index) => (
                                            <tr
                                                key={`${cuota.curso}-${index}`}
                                            >
                                                <th scope="row">
                                                    {cuota.curso}
                                                </th>

                                                <td>
                                                    {formatearCuota(cuota.valor)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>
                                    No hay cuotas registradas para este club.
                                </p>
                            )}
                        </section>

                        <section className="base-club-section base-club-requirements">
                            <h2>Requisitos</h2>

                            {club.requisitos?.length > 0 ? (
                                <ul>
                                    {club.requisitos.map((item, index) => (
                                        <li
                                            key={`${item.requisito}-${index}`}
                                        >
                                            {item.requisito}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>
                                    No hay requisitos registrados para este club.
                                </p>
                            )}
                        </section>


<div className="base-club-actions">
  <button
    type="button"
    className="base-club-foro-btn"
    onClick={() => {
      if (idClub) {
        onAbrirForo?.({
          id_club: idClub,
          nombre: club.Nombre
        });
      }
    }}
  >
    <i className="icon-comment" aria-hidden="true"></i>
    Entrar al foro
  </button>

  {puedeSolicitar && (
    <button
      type="button"
      className="insc-btn"
      onClick={() => onSolicitarInscripcion?.()}
    >
      Solicitar inscripción
    </button>
  )}
</div>
                    </div>
                </main>
            </div>
        </>
    );
}