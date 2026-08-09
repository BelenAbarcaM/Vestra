import React, { useState, useEffect } from 'react';
import './Perfil.css';

export default function Perfil({ onCerrarSesion }) {
  const espaciosInsignias = Array.from({ length: 3 });

  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('Nombre del perfil');
  const [bio, setBio] = useState('Descripción del perfil.');
  const [imagenPerfil, setImagenPerfil] = useState('');
  const [archivoFoto, setArchivoFoto] = useState(null);

  const [borradorNombre, setBorradorNombre] = useState(nombre);
  const [borradorBio, setBorradorBio] = useState(bio);

  useEffect(() => {
    const idUsuario = localStorage.getItem("id_usuario");

    console.log("ID del usuario:", idUsuario);

    if (!idUsuario) {
      console.log("No hay un usuario guardado.");
      return;
    }

    fetch(
      `http://localhost/vestra/backend/api/perfil/obtener.php?id_usuario=${idUsuario}`
    )
      .then((respuesta) => respuesta.json())
      .then((resultado) => {
        console.log("Perfil recibido:", resultado);

        if (resultado.success) {
          setNombre(resultado.usuario.Nombre);
          setBio(resultado.usuario.bio || "Descripción del perfil.");

          if (resultado.usuario.Foto_url) {

  let urlFoto;

  if (resultado.usuario.Foto_url === "default.jpeg") {
    urlFoto = "http://localhost/vestra/uploads/default.jpeg";
  } else {
    urlFoto = `http://localhost/vestra/uploads/perfiles/${resultado.usuario.Foto_url}`;
  }

  console.log("URL de la foto:", urlFoto);

  setImagenPerfil(urlFoto);
}
        }
      })
      .catch((error) => {
        console.error("Error obteniendo el perfil:", error);
      });
  }, []);

  const handleEditar = () => {
    setBorradorNombre(nombre);
    setBorradorBio(bio);
    setEditando(true);
  };

  const handleCancelar = () => {
    setBorradorNombre(nombre);
    setBorradorBio(bio);
    setArchivoFoto(null);
    setEditando(false);
  };

  const handleGuardar = async () => {
    const idUsuario = localStorage.getItem("id_usuario");

    if (!idUsuario) {
      alert("No se encontró el usuario.");
      return;
    }

    const datos = new FormData();

    datos.append("id_usuario", idUsuario);
    datos.append("nombre", borradorNombre.trim());
    datos.append("bio", borradorBio.trim());

    if (archivoFoto) {
      datos.append("foto", archivoFoto);
    }

    try {
      const respuesta = await fetch(
        "http://localhost/vestra/backend/api/perfil/actualizar.php",
        {
          method: "POST",
          body: datos
        }
      );

      const resultado = await respuesta.json();

      console.log("Actualización:", resultado);

      if (resultado.success) {
        setNombre(borradorNombre.trim() || "Nombre del perfil");
        setBio(borradorBio.trim() || "Descripción del perfil.");

        setArchivoFoto(null);
        setEditando(false);

        alert("Perfil actualizado correctamente.");

        // Volver a cargar la foto desde el servidor
        if (resultado.foto) {
          setImagenPerfil(
            `http://localhost/vestra/uploads/perfiles/${resultado.foto}`
          );
        }
      } else {
        alert(resultado.message);
      }

    } catch (error) {
      console.error("Error actualizando perfil:", error);
      alert("Error al conectar con el servidor.");
    }
  };

const handleCerrarSesion = async () => {

  try {

    const respuesta = await fetch(
      "http://localhost/vestra/backend/api/logout.php",
      {
        method: "GET"
      }
    );

    const resultado = await respuesta.json();

    console.log("Logout:", resultado);

    if (resultado.success) {

      localStorage.removeItem("id_usuario");

      if (typeof onCerrarSesion === "function") {
        onCerrarSesion();
      }

    }

  } catch (error) {

    console.error("Error cerrando sesión:", error);

    localStorage.removeItem("id_usuario");

    if (typeof onCerrarSesion === "function") {
      onCerrarSesion();
    }

  }
};

  const handleCambiarImagen = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      alert('Selecciona una imagen válida.');
      return;
    }

    setArchivoFoto(archivo);

    const lector = new FileReader();

    lector.onload = () => {
      setImagenPerfil(lector.result);
    };

    lector.readAsDataURL(archivo);
  };

  return (
  <section className="perfil-page">

    <div className="perfil-card">

        <div className="perfil-acciones">
          {!editando ? (
  <button
    type="button"
    className="perfil-btn-editar"
    onClick={handleEditar}
  >
    Editar
  </button>
) : (
  <div className="perfil-acciones-edicion">
    <button
      type="button"
      className="perfil-btn-secundario"
      onClick={handleCancelar}
    >
      Cancelar
    </button>

    <button
      type="button"
      className="perfil-btn-editar"
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
            <p className="perfil-subtitulo">
              Tu espacio personal en Vestra
            </p>
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
          <h3 className="perfil-titulo-likes">
            Likes guardados
          </h3>
        </section>

      </div>
    </section>
  );
}