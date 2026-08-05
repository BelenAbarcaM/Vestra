import React, { useEffect, useState } from 'react';
import './Menu_nav_estudiante.css';

const items = [
  { id: 'inicio', label: 'Inicio', icon: '🏠' },
  { id: 'salir', label: 'Salir de sesión', icon: '🚪' },
];

export default function MenuNavInvitado({
  vistaActiva = 'inicio',
  onCambiarVista,
  onSalirSesion,
}) {
  const [activa, setActiva] = useState(vistaActiva);

  useEffect(() => {
    setActiva(vistaActiva);
  }, [vistaActiva]);

  const handleClick = (id) => {
    if (id === 'salir') {
      if (typeof onSalirSesion === 'function') onSalirSesion();
      return;
    }

    setActiva(id);
    if (typeof onCambiarVista === 'function') onCambiarVista(id);
  };

  return (
    <nav className="cedes-bottomnav" aria-label="Menú invitado">
      {items.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          aria-pressed={id !== 'salir' && activa === id}
          onClick={() => handleClick(id)}
          className={`nav-btn ${id !== 'salir' && activa === id ? 'active' : ''}`.trim()}
        >
          <span className="nav-icon">{icon}</span>
        </button>
      ))}
    </nav>
  );
}