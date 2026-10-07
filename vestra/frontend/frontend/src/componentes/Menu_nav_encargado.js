import React, { useEffect, useState } from 'react';
import './Menu_nav_estudiante.css';


const items = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: 'icon-home',
  },
  {
    id: 'mensajes',
    label: 'Mensajes',
    icon: 'icon-chat',
    deshabilitado: true,
  },
  {
    id: 'clubes',
    label: 'Clubes',
    icon: 'icon-doc-inv',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'icon-lightbulb',
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: 'icon-user',
  },
];

export default function MenuNavEncargado({
  vistaActiva = 'inicio',
  onCambiarVista,
}) {
  const [activa, setActiva] = useState(vistaActiva);

  useEffect(() => {
    setActiva(vistaActiva);
  }, [vistaActiva]);

  const handleClick = (id, deshabilitado) => {
    if (deshabilitado) return;

    setActiva(id);

    if (typeof onCambiarVista === 'function') {
      onCambiarVista(id);
    }
  };

  return (
    <nav className="cedes-bottomnav" aria-label="Menú encargado">
      {items.map(({ id, label, icon, deshabilitado }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          aria-pressed={activa === id}
          disabled={deshabilitado}
          onClick={() => handleClick(id, deshabilitado)}
          className={`nav-btn ${activa === id ? 'active' : ''} ${
            deshabilitado ? 'nav-btn-disabled' : ''
          }`.trim()}
        >
          <i className={icon} aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}