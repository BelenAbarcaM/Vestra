import React, { useEffect, useState } from 'react';
import './Menu_nav_estudiante.css';

const items = [
  { id: 'inicio', label: 'Inicio', icon: '🏠' },
  { id: 'mensajes', label: 'Mensajes', icon: '💬' },
  { id: 'crear', label: 'Crear', icon: '＋', extraClass: 'add' },
  { id: 'ajustes', label: 'Ajustes', icon: '⚙️' },
  { id: 'perfil', label: 'Perfil', icon: '👤' },
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
    <nav className="cedes-bottomnav" aria-label="Menú estudiante">
      {items.map(({ id, label, icon, extraClass = '' }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          aria-pressed={activa === id}
          onClick={() => handleClick(id)}
          className={`nav-btn ${extraClass} ${activa === id ? 'active' : ''}`.trim()}
        >
          <span className="nav-icon">{icon}</span>
        </button>
      ))}
    </nav>
  );
}
