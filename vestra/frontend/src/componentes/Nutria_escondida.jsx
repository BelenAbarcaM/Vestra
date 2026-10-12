import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Nutria_escondida.css";
import nutria from "../assets/Vivi.png";

const API = "http://localhost/vestra/backend/api/dinamica/nutria_escondida.php";
const DURACION_CAPTURA = 1100;

function obtenerPosicionAleatoria(posicionActual) {
  const x = Math.floor(Math.random() * 76) + 12;
  const y = Math.floor(Math.random() * 72) + 12;
  if (posicionActual && x === posicionActual.x && y === posicionActual.y) {
    return { x: x === 88 ? x - 2 : x + 2, y };
  }
  return { x, y };
}

export default function NutriaEscondida({ activa = true }) {
  const [visible, setVisible] = useState(false);
  const [atrapada, setAtrapada] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [posicion, setPosicion] = useState(obtenerPosicionAleatoria);
  const [cargando, setCargando] = useState(true);
  const temporizadorCaptura = useRef(null);
  const temporizadorMovimiento = useRef(null);
  const bloqueada = useRef(false);

  const consultarEstado = useCallback(async () => {
    if (!activa) {
      setVisible(false);
      setCargando(false);
      return;
    }
    try {
      const respuesta = await fetch(API, { method: "GET", credentials: "include" });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.success) throw new Error(datos.mensaje || "No se pudo verificar la dinámica.");
      setVisible(Boolean(datos.puede_atrapar));
    } catch (error) {
      console.error("No se pudo consultar Nutria Escondida:", error);
      setVisible(false); // No permitir capturas sin validar la fecha en el servidor.
    } finally {
      setCargando(false);
    }
  }, [activa]);

  useEffect(() => {
    consultarEstado();
    return () => {
      window.clearTimeout(temporizadorCaptura.current);
      window.clearInterval(temporizadorMovimiento.current);
    };
  }, [consultarEstado]);

  useEffect(() => {
    if (!visible || atrapada || cargando) {
      window.clearInterval(temporizadorMovimiento.current);
      return undefined;
    }
    // La nutria cambia de lugar cada cierto tiempo, sin salir de la ventana.
    temporizadorMovimiento.current = window.setInterval(() => {
      setPosicion((actual) => obtenerPosicionAleatoria(actual));
    }, 12000);
    return () => window.clearInterval(temporizadorMovimiento.current);
  }, [visible, atrapada, cargando]);

  const atraparNutria = async () => {
    if (bloqueada.current || !visible || atrapada) return;
    bloqueada.current = true;
    setAtrapada(true);
    setMensaje("");
    window.clearInterval(temporizadorMovimiento.current);

    try {
      const respuesta = await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "capturar" }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.success) {
        throw new Error(datos.mensaje || "No se pudo registrar la captura.");
      }
      setMensaje(datos.mensaje || (datos.insignia_nueva ? "¡Insignia Nutria Exploradora desbloqueada!" : "¡Encontraste a Vivi!"));
    } catch (error) {
      console.error("Error registrando la captura:", error);
      setMensaje(error.message || "No se pudo guardar la captura. Inténtalo de nuevo.");
    }

    temporizadorCaptura.current = window.setTimeout(() => {
      setAtrapada(false);
      setVisible(false);
      bloqueada.current = false;
    }, DURACION_CAPTURA);
  };

  if (!activa || cargando || !visible) return null;

  return (
    <button
      className={`nutria-escondida${atrapada ? " nutria-escondida-atrapada" : ""}`}
      type="button"
      style={{ left: `${posicion.x}%`, top: `${posicion.y}%` }}
      onClick={atraparNutria}
      aria-label="¡Encontraste a Vivi, atrapar nutria!"
      title="¡Encontraste a Vivi!"
      disabled={atrapada}
    >
      <img src={nutria} alt="" />
      {atrapada && (
        <>
          <span className="nutria-captura-destello nutria-captura-destello-uno" aria-hidden="true">✦</span>
          <span className="nutria-captura-destello nutria-captura-destello-dos" aria-hidden="true">✦</span>
          <span className="nutria-captura-destello nutria-captura-destello-tres" aria-hidden="true">✦</span>
          <span className="nutria-captura-mensaje" role="status">{mensaje || "¡La atrapaste!"}</span>
        </>
      )}
    </button>
  );
}
