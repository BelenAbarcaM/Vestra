// Lógica pura del juego de F1 in Schools (sin React, sin audio, sin pantalla).
// Aquí viven las piezas del auto, la física de la carrera, los niveles y las estrellas.
// Unidades: metros, segundos, gramos (el peso se pasa a kg dentro de la física).

export const PISTA_M = 20; // largo de la pista, como en F1 in Schools
export const PESO_MIN_G = 48; // peso mínimo del reglamento: si pesas menos, te descalifican
export const PESO_BASE_G = 20; // chasis + cartucho de CO₂
export const ZONA_DRS = { ini: 8, fin: 13 }; // tramo (en metros) donde se puede abrir el DRS
export const PENAL_SALIDA_FALSA = 0.3; // segundos que se suman por cada salida en falso
export const PENAL_ESTAB = 0.06; // segundos que se suman por cada punto de estabilidad que falte
export const REACCION_MAX = 1.0; // si no tocas a tiempo, se cuenta este tiempo de reacción
export const MAX_ESTRELLAS_NIVEL = 3;

/* ---------- piezas del auto ----------
   peso: gramos que suma · cd: resistencia al aire que suma · estab: puntos de estabilidad */
export const PARTES = [
  {
    id: 'carroceria',
    nombre: 'Carrocería',
    ayuda: 'Cuanto menos aire frena, mejor corta',
    opciones: [
      { id: 'cuna', nombre: 'Cuña', emoji: '🔻', peso: 12, cd: 0.3, estab: 2 },
      { id: 'gota', nombre: 'Gota', emoji: '💧', peso: 15, cd: 0.22, estab: 1 },
      { id: 'plana', nombre: 'Plana', emoji: '▬', peso: 10, cd: 0.4, estab: 3 },
    ],
  },
  {
    id: 'aleron',
    nombre: 'Alerón',
    ayuda: 'Pega el auto a la pista, pero frena',
    opciones: [
      { id: 'sin', nombre: 'Sin alerón', emoji: '—', peso: 0, cd: 0, estab: 0 },
      { id: 'peq', nombre: 'Pequeño', emoji: '⌐', peso: 3, cd: 0.04, estab: 2 },
      { id: 'gra', nombre: 'Grande', emoji: '⎴', peso: 6, cd: 0.09, estab: 4 },
    ],
  },
  {
    id: 'ruedas',
    nombre: 'Ruedas',
    ayuda: 'Más anchas agarran más, pero pesan',
    opciones: [
      { id: 'lig', nombre: 'Ligeras', emoji: '⚪', peso: 8, cd: 0.06, estab: 1 },
      { id: 'est', nombre: 'Estándar', emoji: '⚫', peso: 12, cd: 0.05, estab: 2 },
      { id: 'anc', nombre: 'Anchas', emoji: '🛞', peso: 16, cd: 0.08, estab: 4 },
    ],
  },
  {
    id: 'lastre',
    nombre: 'Lastre',
    ayuda: 'Pesas para llegar al peso mínimo',
    opciones: [
      { id: 'l0', nombre: 'Sin lastre', emoji: '0', peso: 0, cd: 0, estab: 0 },
      { id: 'l1', nombre: '8 g', emoji: '🔩', peso: 8, cd: 0, estab: 1 },
      { id: 'l2', nombre: '16 g', emoji: '⚙️', peso: 16, cd: 0, estab: 2 },
    ],
  },
];

export const SELECCION_INICIAL = { carroceria: 'gota', aleron: 'peq', ruedas: 'est', lastre: 'l0' };

/* ---------- carreras ----------
   rival: tiempo total (reacción + pista) que hay que superar
   viento: multiplica la resistencia del aire · estabMin: estabilidad que pide la pista */
export const NIVELES = [
  {
    id: 'debut',
    nombre: 'Clasificatoria',
    descripcion: 'Pista normal: arma tu primer auto',
    rival: 1.5,
    rivalNombre: 'Equipo Rayo',
    viento: 1,
    estabMin: 0,
    clima: '☀️ Pista seca',
    briefing: 'Primera carrera del colegio. Llega al peso mínimo y sal rápido.',
    concepto: 'Masa y aceleración',
    leccion:
      'El cartucho de CO₂ empuja siempre con la misma fuerza. Con F = m·a, un auto más liviano acelera más. Por eso el reglamento fija un peso mínimo: sin él, todos andarían sin peso.',
  },
  {
    id: 'viento',
    nombre: 'Viento de frente',
    descripcion: 'El aire frena mucho más',
    rival: 1.63,
    rivalNombre: 'Los Turbo',
    viento: 1.7,
    estabMin: 0,
    clima: '💨 Viento de frente',
    briefing: 'Hoy el aire pega fuerte. La forma del auto importa más que nunca.',
    concepto: 'Resistencia del aire',
    leccion:
      'La resistencia del aire crece con el cuadrado de la velocidad: si vas el doble de rápido, frena cuatro veces más. Por eso los autos de F1 in Schools tienen formas de gota y alerones finos.',
  },
  {
    id: 'resbala',
    nombre: 'Pista resbalosa',
    descripcion: 'Sin estabilidad, el auto zigzaguea',
    rival: 1.59,
    rivalNombre: 'Escudería Cometa',
    viento: 1,
    estabMin: 8,
    clima: '🌧️ Pista mojada',
    briefing: 'La pista está mojada. Un auto inestable pierde tiempo zigzagueando.',
    concepto: 'Estabilidad y agarre',
    leccion:
      'Las ruedas anchas y el peso bajo mantienen el auto pegado a la guía. Pero cada gramo extra cuesta aceleración: diseñar es siempre buscar el mejor equilibrio.',
  },
  {
    id: 'final',
    nombre: 'Gran final',
    descripcion: 'Viento, pista mojada y un rival duro',
    rival: 1.64,
    rivalNombre: 'Fénix Racing',
    viento: 1.5,
    estabMin: 6,
    clima: '⛈️ Viento y lluvia',
    briefing: 'La final del campeonato. Necesitas el auto perfecto y una salida de piloto.',
    concepto: 'Todo junto',
    leccion:
      'Peso, aire, estabilidad y reflejos: un buen equipo de F1 in Schools prueba, mide y mejora. Cada décima que ganaste vino de una decisión de diseño.',
  },
];

/* ---------- el auto ---------- */
export function opcionDe(parteId, opcionId) {
  const parte = PARTES.find((p) => p.id === parteId);
  return parte.opciones.find((o) => o.id === opcionId);
}

export function calcularCoche(sel, nivel) {
  let peso = PESO_BASE_G;
  let cd = 0;
  let estab = 0;
  PARTES.forEach((p) => {
    const o = opcionDe(p.id, sel[p.id]);
    peso += o.peso;
    cd += o.cd;
    estab += o.estab;
  });
  const faltaPeso = Math.max(0, PESO_MIN_G - peso);
  const faltaEstab = Math.max(0, (nivel.estabMin || 0) - estab);
  return {
    peso,
    cd,
    cdAire: cd * (nivel.viento || 1),
    estab,
    legal: faltaPeso === 0,
    faltaPeso,
    faltaEstab,
    penalEstab: faltaEstab * PENAL_ESTAB,
  };
}

// Mensaje del taller: qué le pasa al auto con las piezas elegidas
export function diagnostico(coche, nivel) {
  if (!coche.legal) {
    return { tipo: 'mal', texto: `Te faltan ${coche.faltaPeso} g para el peso mínimo (${PESO_MIN_G} g).` };
  }
  if (coche.faltaEstab > 0) {
    return {
      tipo: 'aviso',
      texto: `Pista inestable: faltan ${coche.faltaEstab} puntos de estabilidad (+${coche.penalEstab.toFixed(2)} s).`,
    };
  }
  if (coche.peso > PESO_MIN_G + 6) {
    return { tipo: 'aviso', texto: `Pesas ${coche.peso - PESO_MIN_G} g de más sobre el mínimo: cada gramo frena la salida.` };
  }
  return { tipo: 'ok', texto: 'Auto legal y listo para la pista.' };
}

/* ---------- la carrera (física simple, con pasos muy cortos) ---------- */
const FUERZA_N = 5.5; // empuje inicial del cartucho
const T_EMPUJE = 0.3; // el cartucho empuja solo este ratito y se va apagando
const K_AIRE = 0.0035; // qué tanto frena el aire
const DRS_FACTOR = 0.45; // con el DRS abierto, la resistencia baja a menos de la mitad
const SUBPASO = 0.002;

export function crearSim() {
  return { t: 0, x: 0, v: 0, drs: 'listo', drsMetros: 0, fin: false };
}

// Avanza la simulación dt segundos. Modifica y devuelve la misma "sim".
export function avanzar(sim, coche, dt) {
  let resto = dt;
  const masa = coche.peso / 1000;
  while (resto > 0 && !sim.fin) {
    const d = Math.min(SUBPASO, resto);
    resto -= d;

    const empuje = sim.t < T_EMPUJE ? FUERZA_N * (1 - (0.6 * sim.t) / T_EMPUJE) : 0;
    const cd = coche.cdAire * (sim.drs === 'abierto' ? DRS_FACTOR : 1);
    const a = (empuje - K_AIRE * cd * sim.v * sim.v) / masa;
    sim.v = Math.max(0, sim.v + a * d);

    const dx = sim.v * d;
    sim.t += d;
    sim.x += dx;
    if (sim.drs === 'abierto') sim.drsMetros += dx;

    if (sim.x > ZONA_DRS.fin) {
      if (sim.drs === 'abierto') sim.drs = 'usado';
      if (sim.drs === 'listo') sim.drs = 'perdido';
    }
    if (sim.x >= PISTA_M) {
      sim.t -= (sim.x - PISTA_M) / Math.max(sim.v, 0.01); // tiempo exacto al cruzar la meta
      sim.x = PISTA_M;
      sim.fin = true;
    }
  }
  return sim;
}

// El jugador pulsa DRS: abre si está en la zona, se cierra para siempre si fue muy pronto
export function pulsarDrs(sim) {
  if (sim.drs !== 'listo' || sim.fin) return sim.drs;
  if (sim.x < ZONA_DRS.ini) sim.drs = 'cerrado';
  else if (sim.x <= ZONA_DRS.fin) sim.drs = 'abierto';
  return sim.drs;
}

/* ---------- resultado ---------- */
export function tiempoTotal({ pista, reaccion, salidasFalsas, coche }) {
  return pista + reaccion + salidasFalsas * PENAL_SALIDA_FALSA + coche.penalEstab;
}

export function calcularEstrellas(tiempo, rival) {
  if (tiempo <= rival - 0.05) return 3;
  if (tiempo <= rival) return 2;
  if (tiempo <= rival + 0.15) return 1;
  return 0;
}

export function textoReaccion(r) {
  if (r < 0.2) return '¡Reflejos de piloto!';
  if (r < 0.35) return 'Buena salida';
  if (r < REACCION_MAX) return 'Salida lenta';
  return 'Dormido en la parrilla';
}

export function textoDrs(estado, metros) {
  if (estado === 'usado' || estado === 'abierto') {
    return metros >= 4 ? 'DRS perfecto' : 'DRS tarde: abriste casi al final de la zona';
  }
  if (estado === 'cerrado') return 'DRS demasiado pronto: se bloqueó';
  return 'No usaste el DRS';
}

export function totalEstrellas(estrellas) {
  return NIVELES.reduce((suma, n) => suma + (estrellas[n.id] || 0), 0);
}

const RANGOS = ['Aprendiz', 'Mecánico', 'Ingeniero de pista', 'Piloto', 'Campeón'];
export function rangoPara(total) {
  const maximo = NIVELES.length * MAX_ESTRELLAS_NIVEL;
  if (total >= maximo) return RANGOS[4];
  return RANGOS[Math.min(3, Math.floor((total / maximo) * 4))];
}

// Mezcla leve de seguridad: avisa en consola si un nivel está mal escrito
export function validarNivel(nivel) {
  const problemas = [];
  ['id', 'nombre', 'rival', 'viento', 'concepto', 'leccion'].forEach((k) => {
    if (nivel[k] === undefined) problemas.push(`falta "${k}"`);
  });
  return problemas;
}
