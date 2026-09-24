import React, { useEffect, useState } from 'react';
import './CrudClubes.css';

const vacio = { nombreEncargado: '', correo: '', nombreCurso: '', descripcion: '', horario: '', cuota: '', requisitos: '' };

export default function CrudClubes({ onVolver }) {
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState('');
  useEffect(() => {
    fetch('http://localhost/vestra/backend/api/club/listar.php', { credentials: 'include' })
      .then((respuesta) => respuesta.json())
      .then((datos) => { if (Array.isArray(datos)) setClubes(datos); })
      .catch(() => setAviso('No se pudieron cargar los clubes existentes.'))
      .finally(() => setCargando(false));
  }, []);

  const editar = (club) => {
    setEditando(club.id_club);
    setFormulario({
      nombreEncargado: club.nombreEncargado || club.Nombre_encargado || '',
      correo: club.correo || club.Correo || '',
      nombreCurso: club.nombreCurso || club.Nombre || '',
      descripcion: club.descripcion || club.Descripcion || '',
      horario: club.horario || club.Horario || '',
      cuota: club.cuota || club.Cuota || '',
      requisitos: club.requisitos || club.Requisitos || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardar = (e) => {
    e.preventDefault();
    const clubGuardado = { ...formulario, id_club: editando || `local-${Date.now()}`, Nombre: formulario.nombreCurso, Descripcion: formulario.descripcion };
    setClubes((prev) => editando ? prev.map((club) => club.id_club === editando ? clubGuardado : club) : [...prev, clubGuardado]);
    setAviso(editando ? 'Cambios guardados en esta sesión.' : 'Club agregado en esta sesión.');
    setFormulario(vacio);
    setEditando(null);
  };

  return (
    <section className="crud-page">
      <header className="crud-header">
        <button type="button" className="crud-back" onClick={onVolver}>← Clubes</button>
        <h1>CRUD DE CLUBES</h1>
        <p>Administra la información de los clubes.</p>
      </header>
      <div className="crud-layout">
        <form className="crud-card crud-form" onSubmit={guardar}>
          <h2>{editando ? 'Editar club' : 'Agregar club'}</h2>
          {[
            ['nombreCurso', 'Nombre del club', 'text'], ['nombreEncargado', 'Nombre encargado', 'text'],
            ['correo', 'Correo', 'email'], ['horario', 'Horario', 'text'], ['cuota', 'Cuota', 'text'],
          ].map(([name, label, type]) => <label className="crud-field" key={name}>{label}<input required={name === 'nombreCurso'} type={type} value={formulario[name]} onChange={(e) => setFormulario({ ...formulario, [name]: e.target.value })} /></label>)}
          <label className="crud-field">Descripción<textarea value={formulario.descripcion} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} rows="3" /></label>
          <label className="crud-field">Requisitos<textarea value={formulario.requisitos} onChange={(e) => setFormulario({ ...formulario, requisitos: e.target.value })} rows="3" /></label>
          {aviso && <p className="crud-notice" role="status">{aviso}</p>}
          <div className="crud-actions"><button className="crud-primary" type="submit">{editando ? 'Guardar cambios' : 'Agregar club'}</button>{editando && <button type="button" className="crud-secondary" onClick={() => { setEditando(null); setFormulario(vacio); }}>Cancelar</button>}</div>
        </form>
        <div className="crud-list">
          <h2>Clubes registrados</h2>
          {cargando ? <p className="crud-empty">Cargando clubes...</p> : clubes.length === 0 ? <p className="crud-empty">No hay clubes cargados.</p> : clubes.map((club) => <article className="crud-item" key={club.id_club}><div><h3>{club.Nombre || club.nombreCurso}</h3><p>{club.Descripcion || club.descripcion || 'Sin descripción'}</p></div><div className="crud-item-actions"><button type="button" onClick={() => editar(club)}>Editar</button><button type="button" className="crud-delete" onClick={() => setClubes((prev) => prev.filter((item) => item.id_club !== club.id_club))}>Eliminar</button></div></article>)}
        </div>
      </div>
    </section>
  );
}
