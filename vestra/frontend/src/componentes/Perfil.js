import React, { useState } from 'react';
import './Perfil.css';

export default function Perfil({ onCerrarSesion }) {
  const espaciosInsignias = Array.from({ length: 3 });

  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('Nombre del perfil');
  const [bio, setBio] = useState(
    'Descripción del perfil.'
  );
  const [imagenPerfil, setImagenPerfil] = useState('');

  const [borradorNombre, setBorradorNombre] = useState(nombre);
  const [borradorBio, setBorradorBio] = useState(bio);

  const handleEditar = () => {
    setBorradorNombre(nombre);
    setBorradorBio(bio);
    setEditando(true);
  };

  const handleCancelar = () => {
    setBorradorNombre(nombre);
    setBorradorBio(bio);
    setEditando(false);
  };

  const handleGuardar = () => {
    setNombre(borradorNombre.trim() || 'Nombre del perfil');
    setBio(
      borradorBio.trim() ||
        'Descripcion del perfil.'
    );
    setEditando(false);
  };

  const handleCerrarSesion = () => {
    if (typeof onCerrarSesion === 'function') {
      onCerrarSesion();
      return;
    }

    alert('Cerrar sesión');
  };

  const handleCambiarImagen = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      alert('Selecciona una imagen válida.');
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      setImagenPerfil(lector.result);
    };

    lector.readAsDataURL(archivo);
  };

  return (
    <section className="perfil-page">
      <div className="perfil-card">
        <div className="perfil-top-actions">
          {!editando ? (
            <button
              type="button"
              className="perfil-btn-editar perfil-btn-mini"
              onClick={handleEditar}
            >
              Editar
            </button>
          ) : (
            <div className="perfil-acciones-edicion">
              <button
                type="button"
                className="perfil-btn-secundario perfil-btn-mini"
                onClick={handleCancelar}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="perfil-btn-editar perfil-btn-mini"
                onClick={handleGuardar}
              >
                Guardar
              </button>
            </div>
          )}

          <button
            type="button"
            className="perfil-btn-salir"
            onClick={handleCerrarSesion}
          >
            Salir
          </button>
        </div>

        <div className="perfil-topbar">
          <div className="perfil-topbar-texto">
            <h1 className="perfil-heading">Perfil</h1>
            <p className="perfil-subtitulo">Tu espacio personal en Vestra</p>
          </div>
        </div>

        <div className="perfil-linea" />

        <div className="perfil-hero">
          <div className="perfil-avatar">
            {imagenPerfil ? (
              <img
                src={imagenPerfil}
                alt="Perfil"
                className="perfil-avatar-img"
              />
            ) : (
              <span className="perfil-avatar-icon">:v</span>
            )}
          </div>

          {editando ? (
            <label className="perfil-btn-foto">
              Cambiar foto
              <input
                type="file"
                accept="image/*"
                onChange={handleCambiarImagen}
                className="perfil-input-file"
              />
            </label>
          ) : null}

          {!editando ? (
            <>
              <h2 className="perfil-nombre">{nombre}</h2>
              <p className="perfil-bio">{bio}</p>
            </>
          ) : (
            <div className="perfil-formulario-edicion">
              <input
                type="text"
                className="perfil-input"
                value={borradorNombre}
                onChange={(e) => setBorradorNombre(e.target.value)}
                placeholder="Nombre"
              />
              <textarea
                className="perfil-textarea"
                value={borradorBio}
                onChange={(e) => setBorradorBio(e.target.value)}
                placeholder="Descripción del perfil"
                rows={3}
              />
            </div>
          )}
        </div>

        <section className="perfil-seccion perfil-seccion-suave">
          <h3 className="perfil-titulo-seccion">Insignias</h3>

          <div className="perfil-insignias">
            {espaciosInsignias.map((_, index) => (
              <div
                key={index}
                className="perfil-insignia-vacia"
                aria-hidden="true"
              >
                <span>+</span>
              </div>
            ))}
          </div>
        </section>

        <section className="perfil-seccion">
          <h3 className="perfil-titulo-likes">Likes guardados</h3>
        </section>
      </div>
    </section>
  );
}