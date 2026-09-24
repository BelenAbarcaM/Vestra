import React, { useState } from 'react';
import './SolicitudInscripcion.css';

export default function SolicitudInscripcion({ club, onVolver }) {
  const [formulario, setFormulario] = useState({ nombre: '', correo: '', curso: '', motivo: '' });
  const [enviada, setEnviada] = useState(false);
  const actualizar = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });
  const enviar = (e) => { e.preventDefault(); setEnviada(true); };

  return <section className="solicitud-page"><article className="solicitud-card">
    <button type="button" className="solicitud-back" onClick={onVolver}>← Volver a inscripciones</button>
    <header className="solicitud-heading"><span className="solicitud-chip">SOLICITUD DE INSCRIPCIÓN</span><h1>Solicitud de inscripción para el club</h1><p>Completa tus datos para solicitar un espacio en <strong>{club?.Nombre || 'el club'}</strong>.</p></header>
    {enviada ? <div className="solicitud-ok" role="status"><h2>¡Solicitud lista!</h2><p>Tu solicitud para {club?.Nombre || 'el club'} quedó registrada en esta sesión.</p><button className="solicitud-submit" type="button" onClick={onVolver}>Volver a clubes</button></div> : <form className="solicitud-form" onSubmit={enviar}>
      <label>Nombre completo<input name="nombre" required value={formulario.nombre} onChange={actualizar} placeholder="Ingresa tu nombre" /></label>
      <label>Correo electrónico<input name="correo" type="email" required value={formulario.correo} onChange={actualizar} placeholder="Ingresa tu correo" /></label>
      <label>Curso o sección<input name="curso" required value={formulario.curso} onChange={actualizar} placeholder="Ej: 10-2" /></label>
      <label>¿Por qué te interesa este club?<textarea name="motivo" required rows="4" value={formulario.motivo} onChange={actualizar} placeholder="Cuéntanos brevemente" /></label>
      <button className="solicitud-submit" type="submit">Enviar solicitud</button>
    </form>}
  </article></section>;
}
