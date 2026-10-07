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
  },
  {
    id: 'clubes',
    label: 'Clubes',
    icon: 'icon-doc-inv',
  },
  {
    id: 'buzon',
    label: 'Buzón',
    icon: 'icon-lightbulb',
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: 'icon-user',
  },
];

export default function MenuNavEstudiante({
  vistaActiva = 'inicio',
  onCambiarVista,
}) {
  const [activa, setActiva] = useState(vistaActiva);

  useEffect(() => {
    setActiva(vistaActiva);
  }, [vistaActiva]);

  const handleClick = (id) => {
    setActiva(id);

    if (typeof onCambiarVista === 'function') {
      onCambiarVista(id);
    }
  };

  return (
  <nav className="cedes-bottomnav">
    {items.map(({ id, label, icon }) => (
      <button
        key={id}
        type="button"
        aria-label={label}
        aria-pressed={activa === id}
        onClick={() => handleClick(id)}
        className={`nav-btn ${
          activa === id ? "active" : ""
        }`.trim()}
      >
        <i className={icon} aria-hidden="true" />
      </button>
    ))}
  </nav>
);
}
