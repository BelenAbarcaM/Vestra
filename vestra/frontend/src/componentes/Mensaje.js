import React, { useEffect } from 'react';
import './Mensaje.css';

/**
 * Mensaje
 * -----------------------------------------------------------------
 * Reemplazo "cute" del alert() nativo del navegador. Se muestra
 * DENTRO de la página (no es un popup del sistema operativo), con
 * los colores y el estilo redondeado de la app, y se cierra solo
 * después de unos segundos (o al tocar la X).
 *
 * Uso típico dentro de cualquier componente:
 *
 *   const [aviso, setAviso] = useState(null);
 *   ...
 *   setAviso({ texto: '¡Listo!', tipo: 'exito' });
 *   ...
 *   <Mensaje aviso={aviso} onCerrar={() => setAviso(null)} />
 *
 * tipo puede ser: 'exito' | 'error' | 'info'
 * -----------------------------------------------------------------
 */
export default function Mensaje({ aviso, onCerrar, duracion = 4200 }) {

  useEffect(() => {

    if (!aviso) return;

    const temporizador = setTimeout(() => {
      onCerrar && onCerrar();
    }, duracion);

    return () => clearTimeout(temporizador);

  }, [aviso, onCerrar, duracion]);

  if (!aviso) return null;

  const tipo = aviso.tipo || 'info';

  const icono =
    tipo === 'exito' ? 'fa-solid fa-circle-check' :
    tipo === 'error' ? 'fa-solid fa-face-frown' :
    'fa-solid fa-star';

  return (
    <div className="mensaje-overlay" role="status" aria-live="polite">
      <div className={`mensaje-tarjeta mensaje-${tipo}`}>

        <span className="mensaje-icono">
          <i className={icono}></i>
        </span>

        <p className="mensaje-texto">{aviso.texto}</p>

        <button
          type="button"
          className="mensaje-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar mensaje"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <span className="mensaje-barra" style={{ animationDuration: `${duracion}ms` }} />

      </div>
    </div>
  );
}
