import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './JuegoCisco.css';
import vivi from '../assets/Vivi.png';
import {
  NIVELES,
  MAX_ESTRELLAS_NIVEL,
  rutaDelPaquete,
  calcularEstrellas,
  rangoPara,
  totalEstrellas,
  barajar,
  leerLinea,
  validarNivel,
} from './JuegoCisco_logica';

/* =====================================================================
   JUEGO DE CISCO · "La red": arregla la red del colegio
   - Todo el juego corre en el teléfono: no usa backend ni base de datos.
   - Las estrellas de cada misión y el sonido se guardan en el dispositivo
     (localStorage).
   - Las misiones viven en JuegoCisco_logica.js (NIVELES). Para agregar una,
     copia una existente y cambia sus datos.
   ===================================================================== */

const SALTO_MS = 650; // lo que tarda el paquete entre dos dispositivos
const FINAL_MS = 750; // pausa al terminar el recorrido
const CLAVE_ESTRELLAS = 'juego_cisco_estrellas';
const CLAVE_SONIDO = 'juego_cisco_sonido';
const ETIQUETA_TIPO = { pc: 'PC', switch: 'Switch', router: 'Router', server: 'Servidor' };
const R_LUZ = 27; // distancia del centro del dispositivo a la luz del cable

// Si una misión está mal escrita, avisa en la consola del navegador
NIVELES.forEach((nivel) => {
  const problemas = validarNivel(nivel);
  if (problemas.length) console.warn(`[JuegoCisco] Misión "${nivel.id}": ${problemas.join(' · ')}`);
});

/* ---------- progreso guardado ---------- */
function leerEstrellas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ESTRELLAS)) || {};
  } catch (error) {
    return {};
  }
}

function guardarEstrellas(estrellas) {
  try {
    localStorage.setItem(CLAVE_ESTRELLAS, JSON.stringify(estrellas));
  } catch (error) {
    /* si no se puede guardar, el juego sigue funcionando */
  }
}

function leerSonido() {
  try {
    return localStorage.getItem(CLAVE_SONIDO) !== '0';
  } catch (error) {
    return true;
  }
}

function guardarSonido(activo) {
  try {
    localStorage.setItem(CLAVE_SONIDO, activo ? '1' : '0');
  } catch (error) {
    /* no pasa nada */
  }
}

/* ---------- sonido (Web Audio, sin archivos) ---------- */
let contextoAudio = null;

function obtenerAudio() {
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;
  if (!contextoAudio) contextoAudio = new Contexto();
  if (contextoAudio.state === 'suspended') contextoAudio.resume();
  return contextoAudio;
}

function tono(ctx, cuando, freq, dur, tipo, vol, freqFin) {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, cuando);
  if (freqFin) osc.frequency.exponentialRampToValueAtTime(freqFin, cuando + dur);
  ganancia.gain.setValueAtTime(0.0001, cuando);
  ganancia.gain.exponentialRampToValueAtTime(vol, cuando + 0.01);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
  osc.connect(ganancia);
  ganancia.connect(ctx.destination);
  osc.start(cuando);
  osc.stop(cuando + dur + 0.03);
}

const SONIDOS = {
  salto: (c, t) => tono(c, t, 880, 0.07, 'triangle', 0.12),
  toque: (c, t) => tono(c, t, 640, 0.05, 'triangle', 0.1),
  error: (c, t) => tono(c, t, 300, 0.2, 'square', 0.08, 170),
  fallo: (c, t) => {
    tono(c, t, 330, 0.15, 'square', 0.08);
    tono(c, t + 0.17, 220, 0.28, 'square', 0.08);
  },
  exito: (c, t) => [523, 659, 784, 1047].forEach((f, i) => tono(c, t + i * 0.09, f, 0.2, 'triangle', 0.16)),
};

function sonar(nombre, activo) {
  if (!activo) return;
  const ctx = obtenerAudio();
  if (ctx) SONIDOS[nombre](ctx, ctx.currentTime);
}

/* ---------- dibujo de los dispositivos (SVG) ---------- */
function Icono({ tipo }) {
  if (tipo === 'pc') {
    return (
      <g>
        <rect className="jc-cuerpo" x="-17" y="-17" width="34" height="24" rx="4" />
        <rect className="jc-pantalla" x="-13" y="-13" width="26" height="16" rx="2" />
        <rect className="jc-cuerpo" x="-3" y="7" width="6" height="6" />
        <rect className="jc-cuerpo" x="-10" y="12" width="20" height="4" rx="2" />
      </g>
    );
  }
  if (tipo === 'switch') {
    return (
      <g>
        <rect className="jc-cuerpo" x="-21" y="-10" width="42" height="20" rx="5" />
        <path className="jc-trazo" d="M-13 -4 H11 M7 -7.5 L11 -4 L7 -0.5" />
        <path className="jc-trazo" d="M13 3 H-11 M-7 -0.5 L-11 3 L-7 6.5" />
      </g>
    );
  }
  if (tipo === 'router') {
    return (
      <g>
        <circle className="jc-cuerpo" r="18" />
        <path
          className="jc-trazo"
          d="M-9 0 H9 M-9 0 l3 -3 M-9 0 l3 3 M9 0 l-3 -3 M9 0 l-3 3 M0 -9 V9 M0 -9 l-3 3 M0 -9 l3 3 M0 9 l-3 -3 M0 9 l3 -3"
        />
      </g>
    );
  }
  return (
    <g>
      <rect className="jc-cuerpo" x="-12" y="-18" width="24" height="36" rx="4" />
      {[-13, -4, 5].map((y) => (
        <g key={y}>
          <rect className="jc-pantalla" x="-8" y={y} width="16" height="6" rx="1.5" />
          <circle className="jc-led" cx="4.5" cy={y + 3} r="1.2" />
        </g>
      ))}
    </g>
  );
}

function MarcaFallo({ x, y }) {
  return (
    <g transform={`translate(${x + 16} ${y - 18})`} className="jc-marca jc-marca-mal">
      <circle r="8.5" />
      <path d="M-3 -3 L3 3 M3 -3 L-3 3" />
    </g>
  );
}

function MarcaOk({ x, y }) {
  return (
    <g transform={`translate(${x + 16} ${y - 18})`} className="jc-marca jc-marca-ok">
      <circle r="8.5" />
      <path d="M-3.5 0 L-1 2.8 L3.6 -2.6" />
    </g>
  );
}

/* ---------- mapa de la red (como el espacio de trabajo de Packet Tracer) ---------- */
function Topologia({ nivel, arreglado, fase, sel, resaltado, paqueteRef, onElegir }) {
  const porId = Object.fromEntries(nivel.nodos.map((n) => [n.id, n]));
  const destino = porId[nivel.ruta[nivel.ruta.length - 1]];
  const falla = porId[nivel.falla.en];

  return (
    <svg
      className="jc-mapa"
      viewBox={`0 0 340 ${nivel.alto}`}
      role="group"
      aria-label="Mapa de la red. Toca un dispositivo para ver su configuración."
    >
      {/* cables y sus luces */}
      {nivel.enlaces.map((e) => {
        const a = porId[e.a];
        const b = porId[e.b];
        const luz = arreglado ? 'verde' : e.luz || 'verde';
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const largo = Math.hypot(dx, dy);
        const ux = dx / largo;
        const uy = dy / largo;
        return (
          <g key={`${e.a}-${e.b}`}>
            <line
              className={`jc-cable${luz === 'rojo' ? ' jc-cable-roto' : ''}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
            <circle className={`jc-luz jc-luz-${luz}`} cx={a.x + ux * R_LUZ} cy={a.y + uy * R_LUZ} r="3.4" />
            <circle className={`jc-luz jc-luz-${luz}`} cx={b.x - ux * R_LUZ} cy={b.y - uy * R_LUZ} r="3.4" />
          </g>
        );
      })}

      {/* dispositivos */}
      {nivel.nodos.map((n) => (
        <g
          key={n.id}
          className={`jc-nodo${sel === n.id ? ' jc-nodo-sel' : ''}`}
          transform={`translate(${n.x} ${n.y})`}
          role="button"
          tabIndex={0}
          aria-label={`${n.nombre}, ${ETIQUETA_TIPO[n.tipo]}. Ver configuración`}
          onClick={() => onElegir(n.id)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
              evento.preventDefault();
              onElegir(n.id);
            }
          }}
        >
          <circle className="jc-zona" r="29" />
          {resaltado === n.id && <circle className="jc-pista" r="25" />}
          {sel === n.id && <circle className="jc-anillo" r="25" />}
          <Icono tipo={n.tipo} />
          <text className="jc-etiqueta" y="38">{n.nombre}</text>
        </g>
      ))}

      {/* el paquete: viaja de dispositivo en dispositivo */}
      <g ref={paqueteRef} className="jc-paquete" style={{ display: fase === 'probando' ? 'block' : 'none' }}>
        <rect x="-9" y="-6.5" width="18" height="13" rx="2.5" />
        <path d="M-9 -6 L0 1.5 L9 -6" />
      </g>

      {fase === 'fallo' && <MarcaFallo x={falla.x} y={falla.y} />}
      {fase === 'resultado' && <MarcaOk x={destino.x} y={destino.y} />}
    </svg>
  );
}

/* ---------- pantalla del juego ---------- */
export default function JuegoCisco({ onVolver }) {
  const [fase, setFase] = useState('niveles'); // niveles | mision | probando | fallo | resultado
  const [nivelIdx, setNivelIdx] = useState(0);
  const [estrellas, setEstrellas] = useState(leerEstrellas);
  const [sonido, setSonido] = useState(leerSonido);
  const [arreglado, setArreglado] = useState(false);
  const [errores, setErrores] = useState(0);
  const [pista, setPista] = useState(false);
  const [descartadas, setDescartadas] = useState([]);
  const [sel, setSel] = useState(null); // dispositivo que se está inspeccionando
  const [vista, setVista] = useState('prueba'); // qué muestra la consola: prueba | nodo
  const [aviso, setAviso] = useState('');
  const [resultado, setResultado] = useState(null);
  const [intento, setIntento] = useState(0); // cambia al reintentar para barajar los arreglos
  const [pulso, setPulso] = useState(0); // sube en cada salto del paquete: Vivi rebota
  const [golpe, setGolpe] = useState(0); // sube en cada toque: la laptop salta

  const nivel = NIVELES[nivelIdx];
  const porId = useMemo(() => Object.fromEntries(nivel.nodos.map((n) => [n.id, n])), [nivel]);
  const arreglos = useMemo(() => barajar(nivel.arreglos), [nivel, intento]); // eslint-disable-line react-hooks/exhaustive-deps

  const rafRef = useRef(0);
  const paqueteRef = useRef(null);
  const sonidoRef = useRef(sonido);
  sonidoRef.current = sonido;

  // Detiene la animación del paquete (no toca el estado de React)
  const cortar = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  useEffect(() => cortar, [cortar]);

  const cambiarSonido = () => {
    const nuevo = !sonido;
    setSonido(nuevo);
    guardarSonido(nuevo);
    sonar('toque', nuevo);
  };

  /* ---------- el recorrido del paquete ---------- */
  const terminarPrueba = (conArreglo, datos) => {
    rafRef.current = 0;
    if (!conArreglo) {
      setFase('fallo');
      sonar('fallo', sonidoRef.current);
      return;
    }
    const nuevas = { ...estrellas, [nivel.id]: Math.max(estrellas[nivel.id] || 0, datos.estrellas) };
    setEstrellas(nuevas);
    guardarEstrellas(nuevas);
    setResultado(datos);
    setFase('resultado');
    sonar('exito', sonidoRef.current);
  };

  const lanzar = (conArreglo, datos) => {
    cortar();
    const nodos = rutaDelPaquete(nivel, conArreglo).map((id) => porId[id]);
    const saltos = nodos.length - 1;
    const duracion = Math.max(saltos, 0) * SALTO_MS;
    const mover = (x, y) => {
      if (paqueteRef.current) paqueteRef.current.setAttribute('transform', `translate(${x} ${y})`);
    };

    setAviso('');
    setVista('prueba');
    setFase('probando');
    mover(nodos[0].x, nodos[0].y);

    const inicio = performance.now();
    let ultimoSalto = -1;

    const bucle = () => {
      const pasado = performance.now() - inicio;
      const pos = saltos > 0 ? Math.min(pasado / SALTO_MS, saltos) : 0;

      if (saltos > 0) {
        const i = Math.min(Math.floor(pos), saltos - 1);
        const f = pos - i;
        const suave = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; // acelera y frena en cada dispositivo
        const a = nodos[i];
        const b = nodos[i + 1];
        mover(a.x + (b.x - a.x) * suave, a.y + (b.y - a.y) * suave);
      }

      const salto = Math.floor(pos);
      if (salto !== ultimoSalto) {
        ultimoSalto = salto;
        setPulso((p) => p + 1);
        sonar('salto', sonidoRef.current);
      }

      if (pasado >= duracion + FINAL_MS) {
        terminarPrueba(conArreglo, datos);
        return;
      }
      rafRef.current = requestAnimationFrame(bucle);
    };

    rafRef.current = requestAnimationFrame(bucle);
  };

  /* ---------- acciones del jugador ---------- */
  const abrirNivel = (i, reintento = false) => {
    cortar();
    setNivelIdx(i);
    setArreglado(false);
    setErrores(0);
    setPista(false);
    setDescartadas([]);
    setSel(null);
    setVista('prueba');
    setAviso('');
    setResultado(null);
    if (reintento) setIntento((n) => n + 1);
    setFase('mision');
  };

  const elegirNodo = (id) => {
    if (fase === 'probando') return;
    sonar('toque', sonido);
    setGolpe((g) => g + 1);
    setSel(id);
    setVista('nodo');
  };

  const pedirPista = () => {
    if (pista) return;
    setPista(true);
    setAviso(nivel.pista);
    sonar('toque', sonido);
  };

  const elegirArreglo = (arreglo) => {
    if (fase !== 'fallo') return;
    setGolpe((g) => g + 1);
    if (arreglo.correcto) {
      sonar('toque', sonido);
      setArreglado(true);
      lanzar(true, { errores, pista, estrellas: calcularEstrellas({ errores, pista }) });
    } else {
      sonar('error', sonido);
      setErrores((e) => e + 1);
      setDescartadas((d) => [...d, arreglo.id]);
      setAviso('Mmm, eso no lo arregla. Lee por qué y prueba otro.');
    }
  };

  const atras = () => {
    if (fase === 'niveles') {
      if (typeof onVolver === 'function') onVolver();
      return;
    }
    cortar();
    setFase('niveles');
  };

  /* ---------- textos ---------- */
  const total = totalEstrellas(estrellas);
  const maximo = NIVELES.length * MAX_ESTRELLAS_NIVEL;
  const hayNivelSiguiente = nivelIdx < NIVELES.length - 1;
  const origen = porId[nivel.ruta[0]];

  let estadoVivi = '';
  if (fase === 'resultado' && resultado) estadoVivi = resultado.estrellas >= 2 ? 'jc-feliz' : '';
  if (fase === 'fallo') estadoVivi = 'jc-triste';

  const mensajeResultado = resultado
    ? [
        '',
        '¡Red arreglada! Con calma se aprende mejor.',
        '¡Buen trabajo, técnico!',
        '¡Impecable! Vivi te contrataría ya.',
      ][resultado.estrellas]
    : '';

  let burbuja = '';
  if (fase === 'niveles') burbuja = '¡Elige un ticket! La red del colegio nos necesita.';
  if (fase === 'mision') burbuja = 'Lee el ticket y prueba la conexión.';
  if (fase === 'probando') burbuja = arreglado ? 'Probando otra vez…' : 'Enviando el paquete…';
  if (fase === 'fallo') burbuja = aviso || 'No llegó. Toca los dispositivos y busca el error.';
  if (fase === 'resultado') burbuja = mensajeResultado;

  /* ---------- lo que muestra la consola ---------- */
  let tituloConsola = 'Consola';
  let lineasConsola = ['~Toca un dispositivo para ver su configuración,', '~o pulsa "Probar conexión".'];
  if (vista === 'nodo' && sel) {
    const nodo = porId[sel];
    tituloConsola = `${nodo.nombre} · ${ETIQUETA_TIPO[nodo.tipo]}`;
    lineasConsola = arreglado && nodo.configFix ? nodo.configFix : nodo.config;
  } else if (fase === 'probando') {
    tituloConsola = `${origen.nombre} · Command Prompt`;
    lineasConsola = [`~C:\\> ${nivel.test.comando}`, '', 'Waiting for reply…'];
  } else if (fase === 'fallo' || fase === 'resultado') {
    tituloConsola = `${origen.nombre} · Command Prompt`;
    lineasConsola = [`~C:\\> ${nivel.test.comando}`, ...(arreglado ? nivel.test.exito : nivel.test.fallo)];
  }
  const puedeVerPrueba = vista === 'nodo' && (fase === 'fallo' || fase === 'resultado');

  const estrellasDe = (cantidad, claseOn, claseOff) =>
    [1, 2, 3].map((s) => (
      <span key={s} className={s <= cantidad ? claseOn : claseOff}>★</span>
    ));

  return (
    <section className="jc-page">
      <div className="jc-wrap">
        <header className="jc-top">
          <button type="button" className="jc-atras" onClick={atras}>
            ← {fase === 'niveles' ? 'Juegos' : 'Tickets'}
          </button>
          <h1 className="jc-titulo">La red</h1>
          <button
            type="button"
            className="jc-sonido"
            onClick={cambiarSonido}
            aria-pressed={sonido}
            aria-label={sonido ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {sonido ? '🔊' : '🔇'}
          </button>
        </header>

        {/* Vivi y su laptop */}
        <div className="jc-escenario">
          <div className="jc-burbuja" role="status" aria-live="polite">{burbuja}</div>
          <div className={`jc-vivi-zona ${estadoVivi}`}>
            <img
              className={`jc-vivi ${pulso > 0 ? (pulso % 2 ? 'jc-rebote-a' : 'jc-rebote-b') : ''}`}
              src={vivi}
              alt="Vivi, la nutria"
              draggable="false"
            />
            <span
              className={`jc-laptop ${golpe > 0 ? (golpe % 2 ? 'jc-golpe-a' : 'jc-golpe-b') : ''}`}
              aria-hidden="true"
            >
              💻
            </span>
          </div>
        </div>

        {fase === 'niveles' && (
          <>
            <div className="jc-rango">
              <span className="jc-rango-nombre">{rangoPara(total)}</span>
              <span className="jc-rango-total">★ {total}/{maximo}</span>
            </div>
            <div className="jc-niveles">
              {NIVELES.map((n, i) => (
                <button key={n.id} type="button" className="jc-nivel" onClick={() => abrirNivel(i)}>
                  <span className="jc-nivel-num">{i + 1}</span>
                  <span className="jc-nivel-info">
                    <strong>{n.nombre}</strong>
                    <small>{n.descripcion}</small>
                  </span>
                  <span className="jc-estrellas" aria-label={`${estrellas[n.id] || 0} de 3 estrellas`}>
                    {estrellasDe(estrellas[n.id] || 0, 'jc-estrella-on', 'jc-estrella')}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {fase !== 'niveles' && (
          <div className="jc-card">
            <p className="jc-eyebrow">
              Ticket #{nivelIdx + 1} · {nivel.nombre}
            </p>

            <div className="jc-ticket">
              <span className="jc-ticket-de">🎫 {nivel.ticket.de}</span>
              <p>“{nivel.ticket.texto}”</p>
            </div>

            <Topologia
              nivel={nivel}
              arreglado={arreglado}
              fase={fase}
              sel={sel}
              resaltado={pista && fase === 'fallo' ? nivel.pistaNodo : null}
              paqueteRef={paqueteRef}
              onElegir={elegirNodo}
            />

            <details className="jc-ayuda">
              <summary>¿Cómo se juega?</summary>
              <ul>
                <li>Pulsa <b>Probar conexión</b>: el paquete viaja hasta donde se pierde.</li>
                <li>Toca cada dispositivo para leer su configuración, como en Packet Tracer.</li>
                <li>Elige el arreglo correcto. Luz verde no siempre significa que todo esté bien.</li>
                <li>Menos errores y sin pista = más estrellas.</li>
              </ul>
            </details>

            <div className="jc-consola">
              <div className="jc-consola-barra">
                <span className="jc-consola-puntos" aria-hidden="true"><i /><i /><i /></span>
                <span className="jc-consola-titulo">{tituloConsola}</span>
                {puedeVerPrueba && (
                  <button type="button" className="jc-consola-boton" onClick={() => setVista('prueba')}>
                    Ver prueba
                  </button>
                )}
              </div>
              <pre className="jc-consola-cuerpo">
                {lineasConsola.map((linea, i) => {
                  const { tipo, texto } = leerLinea(linea);
                  return (
                    <span key={i} className={`jc-linea${tipo ? ` jc-linea-${tipo}` : ''}`}>
                      {texto || ' '}
                      {'\n'}
                    </span>
                  );
                })}
              </pre>
            </div>

            {fase === 'mision' && (
              <div className="jc-acciones">
                <button type="button" className="jc-btn" onClick={() => lanzar(false)}>
                  📡 {nivel.test.boton || 'Probar conexión'}
                </button>
              </div>
            )}

            {fase === 'probando' && !arreglado && (
              <div className="jc-acciones">
                <button
                  type="button"
                  className="jc-btn jc-btn-suave"
                  onClick={() => {
                    cortar();
                    setFase('mision');
                  }}
                >
                  Detener
                </button>
              </div>
            )}

            {fase === 'fallo' && (
              <div className="jc-arreglos">
                <div className="jc-arreglos-cab">
                  <p className="jc-eyebrow">¿Qué arreglo aplicas?</p>
                  <button type="button" className="jc-pista-btn" onClick={pedirPista} disabled={pista}>
                    💡 {pista ? 'Pista usada' : 'Pista (−1 ★)'}
                  </button>
                </div>
                {arreglos.map((a) => {
                  const mal = descartadas.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={`jc-fix${mal ? ' jc-fix-mal' : ''}`}
                      disabled={mal}
                      onClick={() => elegirArreglo(a)}
                    >
                      <span className="jc-fix-donde">{a.donde}</span>
                      <code className="jc-fix-accion">{a.accion}</code>
                      {mal && <small className="jc-fix-porque">✗ {a.porque}</small>}
                    </button>
                  );
                })}
              </div>
            )}

            {fase === 'resultado' && resultado && (
              <div className="jc-resultado">
                <div className="jc-estrellas jc-estrellas-grandes" aria-label={`${resultado.estrellas} de 3 estrellas`}>
                  {estrellasDe(resultado.estrellas, 'jc-estrella-on', 'jc-estrella')}
                </div>
                <p className="jc-texto">{mensajeResultado}</p>
                <ul className="jc-datos">
                  <li>Errores: <b>{resultado.errores}</b>{resultado.pista ? ' · usaste la pista' : ''}</li>
                  <li>Rango: <b>{rangoPara(total)}</b> · ★ {total}/{maximo}</li>
                </ul>
                <div className="jc-leccion">
                  <p className="jc-eyebrow">{nivel.concepto}</p>
                  <p>{nivel.leccion}</p>
                </div>
                <div className="jc-acciones">
                  <button type="button" className="jc-btn jc-btn-suave" onClick={() => abrirNivel(nivelIdx, true)}>
                    Reintentar
                  </button>
                  {hayNivelSiguiente ? (
                    <button type="button" className="jc-btn" onClick={() => abrirNivel(nivelIdx + 1)}>
                      Siguiente ticket
                    </button>
                  ) : (
                    <button type="button" className="jc-btn" onClick={atras}>
                      Tickets
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
