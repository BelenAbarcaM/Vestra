import { API_BASE_URL, APP_BASE_URL, apiUrl, appUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import './Perfil.css';
import Mensaje from './Mensaje';
import { extraerTipoUsuario, esVisitante } from './utilTipoUsuario';

export default function Perfil({ idUsuarioPerfil, onCerrarSesion }) {
  const idUsuarioActual = localStorage.getItem('id_usuario');

  const esMiPerfil =
    String(idUsuarioActual) === String(idUsuarioPerfil);

  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('Nombre del perfil');
  const [bio, setBio] = useState('Descripción del perfil.');
  const [imagenPerfil, setImagenPerfil] = useState('');
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [borradorNombre, setBorradorNombre] = useState(nombre);
  const [borradorBio, setBorradorBio] = useState(bio);
  const [publicacionesLikeadas, setPublicacionesLikeadas] = useState([]);
  const [cargandoLikes, setCargandoLikes] = useState(true);
  const [aviso, setAviso] = useState(null);
  const [tipoUsuarioPerfil, setTipoUsuarioPerfil] = useState(null);

  const [insignias, setInsignias] = useState([]);
  const [cargandoInsignias, setCargandoInsignias] = useState(false);
  const [errorInsignias, setErrorInsignias] = useState('');

  // Obtener el tipo de usuario del perfil actual.
  const tipoUsuarioEfectivo = esMiPerfil
    ? localStorage.getItem('tipo_usuario')
    : tipoUsuarioPerfil;

  const tipoNormalizado = String(tipoUsuarioEfectivo || '')
    .trim()
    .toLowerCase();

  const perfilEsVisitante = esVisitante(tipoUsuarioEfectivo);

  const perfilEsEstudiante =
    tipoNormalizado === '1' ||
    tipoNormalizado === 'estudiante';

    const [insigniaSeleccionada, setInsigniaSeleccionada] = useState(null);

  // =====================================================
  // CARGAR PERFIL
  // =====================================================
  useEffect(() => {
    if (!idUsuarioPerfil) {
      console.log('No hay ID de perfil.');
      return;
    }

    console.log('Cargando perfil:', idUsuarioPerfil);

    fetch(
      `${API_BASE_URL}/perfil/obtener.php?id_usuario=${encodeURIComponent(idUsuarioPerfil)}`
    )
      .then((respuesta) => respuesta.json())
      .then((resultado) => {
        console.log('Perfil recibido:', resultado);

        if (resultado.success) {
          const usuario = resultado.usuario;

          setNombre(usuario.Nombre || 'Nombre del perfil');
          setBio(usuario.bio || 'Descripción del perfil.');

          setTipoUsuarioPerfil(extraerTipoUsuario(usuario));

          // FOTO DE PERFIL
          if (usuario.Foto_url) {
            let urlFoto;

            if (usuario.Foto_url === 'default.jpeg') {
              urlFoto = appUrl("uploads/default.jpeg");
            } else {
              urlFoto = `${APP_BASE_URL}/uploads/perfiles/${usuario.Foto_url}`;
            }

            setImagenPerfil(urlFoto);
          } else {
            setImagenPerfil('');
          }
        }
      })
      .catch((error) => {
        console.error('Error obteniendo el perfil:', error);
      });
  }, [idUsuarioPerfil]);

  // =====================================================
  // CARGAR INSIGNIAS
  // SOLO PARA ESTUDIANTES
  // =====================================================
  useEffect(() => {
    if (!idUsuarioPerfil || !perfilEsEstudiante) {
      setInsignias([]);
      setCargandoInsignias(false);
      setErrorInsignias('');
      return;
    }

    let cancelado = false;

    const cargarInsignias = async () => {
      setCargandoInsignias(true);
      setErrorInsignias('');

      try {
        const respuesta = await fetch(
          `${API_BASE_URL}/insignias/mis_insignias.php?id_usuario=${encodeURIComponent(idUsuarioPerfil)}`
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.success === false) {
          throw new Error(
            resultado.mensaje || 'No se pudieron cargar las insignias.'
          );
        }

        if (!cancelado) {
          setInsignias(
            Array.isArray(resultado.insignias)
              ? resultado.insignias
              : []
          );
        }
      } catch (error) {
        console.error('Error cargando insignias:', error);

        if (!cancelado) {
          setInsignias([]);
          setErrorInsignias('No se pudieron cargar las insignias.');
        }
      } finally {
        if (!cancelado) {
          setCargandoInsignias(false);
        }
      }
    };

    cargarInsignias();

    return () => {
      cancelado = true;
    };
  }, [idUsuarioPerfil, perfilEsEstudiante]);

  // =====================================================
  // CARGAR LIKES
  // SOLO PARA EL PERFIL PROPIO
  // =====================================================
  useEffect(() => {
    if (!esMiPerfil || !idUsuarioPerfil) {
      setCargandoLikes(false);
      setPublicacionesLikeadas([]);
      return;
    }

    setCargandoLikes(true);

    console.log(
      'Cargando publicaciones likeadas del usuario:',
      idUsuarioPerfil
    );

    fetch(
      `${API_BASE_URL}/perfil/likes.php?id_usuario=${encodeURIComponent(idUsuarioPerfil)}`
    )
      .then((respuesta) => respuesta.json())
      .then((resultado) => {
        console.log('Publicaciones likeadas:', resultado);

        if (resultado.success) {
          setPublicacionesLikeadas(resultado.publicaciones || []);
        } else {
          setPublicacionesLikeadas([]);
        }
      })
      .catch((error) => {
        console.error(
          'Error obteniendo publicaciones likeadas:',
          error
        );
        setPublicacionesLikeadas([]);
      })
      .finally(() => {
        setCargandoLikes(false);
      });
  }, [esMiPerfil, idUsuarioPerfil]);

  // =====================================================
  // EDITAR PERFIL
  // =====================================================
  const handleEditar = () => {
    setBorradorNombre(nombre);
    setBorradorBio(bio);
    setEditando(true);
  };

  // =====================================================
  // CANCELAR EDICIÓN
  // =====================================================
  const handleCancelar = () => {
    setBorradorNombre(nombre);
    setBorradorBio(bio);
    setArchivoFoto(null);
    setEditando(false);
  };

  // =====================================================
  // GUARDAR PERFIL
  // =====================================================
  const handleGuardar = async () => {
    const idUsuario = localStorage.getItem('id_usuario');

    if (!idUsuario) {
      setAviso({
        texto: 'No se encontró el usuario.',
        tipo: 'error',
      });
      return;
    }

    const datos = new FormData();

    datos.append('id_usuario', idUsuario);
    datos.append('nombre', borradorNombre.trim());
    datos.append('bio', borradorBio.trim());

    if (archivoFoto) {
      datos.append('foto', archivoFoto);
    }

    try {
      const respuesta = await fetch(
        apiUrl("/perfil/editar.php"),
        {
          method: 'POST',
          body: datos,
        }
      );

      console.log('Status HTTP:', respuesta.status);

      const textoRespuesta = await respuesta.text();

      console.log('Respuesta del servidor:', textoRespuesta);

      let resultado;

      try {
        resultado = JSON.parse(textoRespuesta);
      } catch (error) {
        console.error('La respuesta NO es JSON:', textoRespuesta);

        setAviso({
          texto: 'El servidor devolvió un error. Revisa la consola.',
          tipo: 'error',
        });
        return;
      }

      console.log('Actualización:', resultado);

      if (resultado.success) {
        setNombre(borradorNombre.trim() || 'Nombre del perfil');
        setBio(borradorBio.trim() || 'Descripción del perfil.');
        setArchivoFoto(null);
        setEditando(false);

        if (resultado.foto) {
          setImagenPerfil(
            `${APP_BASE_URL}/uploads/perfiles/${resultado.foto}`
          );
        }

        setAviso({
          texto: 'Perfil actualizado correctamente.',
          tipo: 'exito',
        });
      } else {
        setAviso({
          texto: resultado.mensaje || 'No se pudo actualizar el perfil.',
          tipo: 'error',
        });
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);

      setAviso({
        texto: 'Error al conectar con el servidor.',
        tipo: 'error',
      });
    }
  };

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================
  const handleCerrarSesion = async () => {
    try {
      const respuesta = await fetch(
        apiUrl("/logout.php"),
        {
          method: 'GET',
        }
      );

      const resultado = await respuesta.json();
      console.log('Logout:', resultado);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      localStorage.removeItem('id_usuario');
      localStorage.removeItem('tipo_usuario');

      if (typeof onCerrarSesion === 'function') {
        onCerrarSesion();
      }
    }
  };

  // =====================================================
  // CAMBIAR FOTO
  // =====================================================
  const handleCambiarImagen = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      setAviso({
        texto: 'Selecciona una imagen válida.',
        tipo: 'error',
      });
      return;
    }

    setArchivoFoto(archivo);

    const lector = new FileReader();

    lector.onload = () => {
      setImagenPerfil(lector.result);
    };

    lector.readAsDataURL(archivo);
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <section className="perfil-contenedor">
      <Mensaje
        aviso={aviso}
        onCerrar={() => setAviso(null)}
      />

      <div className="perfil-card">
        {/* BARRA SUPERIOR */}
        {esMiPerfil && (
          <>
            <button
              className="perfil-btn-editar"
              onClick={handleEditar}
              aria-label="Editar perfil"
              title="Editar perfil"
            >
              <i className="icon-edit"></i>
            </button>

            <button
              className="perfil-btn-salir"
              onClick={handleCerrarSesion}
            >
              Salir
            </button>
          </>
        )}

        <div className="perfil-topbar">
          <div className="perfil-topbar-texto">
            <h1 className="perfil-heading">Perfil</h1>

            <p className="perfil-subtitulo">
              {esMiPerfil
                ? 'Tu espacio personal en Vestra'
                : 'Perfil de usuario en Vestra'}
            </p>
          </div>
        </div>

        <div className="perfil-linea" />

        {/* INFORMACIÓN DEL PERFIL */}
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

          {esMiPerfil && editando && (
            <label className="perfil-btn-foto">
              Cambiar foto
              <input
                type="file"
                accept="image/*"
                onChange={handleCambiarImagen}
                className="perfil-input-file"
              />
            </label>
          )}

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

        {/* BOTONES DE EDICIÓN */}
        {esMiPerfil && editando && (
          <div className="perfil-acciones-edicion">
            <button
              className="perfil-btn-guardar"
              onClick={handleGuardar}
            >
              Guardar
            </button>

            <button
              className="perfil-btn-cancelar"
              onClick={handleCancelar}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* INSIGNIAS: SOLO PARA ESTUDIANTES */}
        {!perfilEsVisitante && perfilEsEstudiante && (
          <section className="perfil-seccion perfil-seccion-suave">
            <h3 className="perfil-titulo-seccion">
              Mis insignias
            </h3>

            {cargandoInsignias ? (
              <p className="perfil-insignias-mensaje">
                Cargando insignias...
              </p>
            ) : errorInsignias ? (
              <p className="perfil-insignias-mensaje">
                {errorInsignias}
              </p>
            ) : insignias.length === 0 ? (
              <p className="perfil-insignias-mensaje">
                Todavía no has obtenido insignias. ¡Sigue participando en tus clubes!
              </p>
            ) : (
             
<div className="perfil-insignias">
  {insignias.map((insignia) => {
    const fotoInsignia = `${APP_BASE_URL}/${String(
      insignia.foto || ""
    ).replace(/^\/+/, "")}`;

    return (
      <article
        className="perfil-insignia-item"
        key={insignia.id_insignia}
        onClick={() => setInsigniaSeleccionada(insignia)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setInsigniaSeleccionada(insignia);
          }
        }}
        title={`Ver ${insignia.nombre}`}
      >
        <img
          className="perfil-insignia-imagen"
          src={fotoInsignia}
          alt={insignia.nombre}
        />

        <span className="perfil-insignia-nombre">
          {insignia.nombre}
        </span>
      </article>
    );
  })}
</div>

            )}
          </section>
        )}

        
{insigniaSeleccionada && (
  <div
    className="modal-insignia-fondo"
    onClick={() => setInsigniaSeleccionada(null)}
  >
    <div
      className="modal-insignia"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-insignia"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="modal-insignia-cerrar"
        onClick={() => setInsigniaSeleccionada(null)}
        aria-label="Cerrar ventana"
      >
        ×
      </button>

      <img
        className="modal-insignia-imagen"
        src={`${APP_BASE_URL}/${String(
          insigniaSeleccionada.foto || ""
        ).replace(/^\/+/, "")}`}
        alt={insigniaSeleccionada.nombre}
      />

      <h3 id="titulo-insignia">
        {insigniaSeleccionada.nombre}
      </h3>

      <p className="modal-insignia-descripcion">
        {insigniaSeleccionada.descripcion ||
          "Esta insignia no tiene una descripción."}
      </p>
    </div>
  </div>
)}

        {/* LIKES: SOLO EN TU PERFIL */}
        {esMiPerfil && (
          <section className="perfil-seccion">
            <h3 className="perfil-titulo-likes">
              Likes guardados
            </h3>

            {cargandoLikes ? (
              <div className="perfil-likes-mensaje">
                Cargando publicaciones...
              </div>
            ) : publicacionesLikeadas.length === 0 ? (
              <div className="perfil-likes-mensaje">
                <i className="fa-regular fa-heart"></i>
                <p>
                  Todavía no has dado like a ninguna publicación.
                </p>
              </div>
            ) : (
              <div className="perfil-likes-lista">
                {publicacionesLikeadas.map((publicacion) => (
                  <article
                    key={publicacion.id_publicacion}
                    className="perfil-like-card"
                  >
                    {/* ENCABEZADO */}
                    <div className="perfil-like-header">
                      <div className="perfil-like-autor">
                        {publicacion.foto_usuario ? (
                          <img
                            src={
                              publicacion.foto_usuario === 'default.jpeg'
                                ? appUrl("uploads/default.jpeg")
                                : `${APP_BASE_URL}/uploads/perfiles/${publicacion.foto_usuario}`
                            }
                            alt={publicacion.nombre_usuario}
                            className="perfil-like-avatar-img"
                          />
                        ) : (
                          <div className="perfil-like-avatar">
                            <i className="fa-solid fa-user"></i>
                          </div>
                        )}

                        <div className="perfil-like-datos">
                          <strong>
                            {publicacion.nombre_usuario}
                          </strong>

                          {publicacion.nombre_club && (
                            <span>{publicacion.nombre_club}</span>
                          )}
                        </div>
                      </div>

                      <i className="fa-solid fa-heart perfil-like-corazon"></i>
                    </div>

                    {/* FOTO DE PUBLICACIÓN */}
                    {publicacion.imagen_url && (
                      <img
                        className="perfil-like-imagen"
                        src={`${APP_BASE_URL}/uploads/publicaciones/${publicacion.imagen_url}`}
                        alt="Publicación"
                      />
                    )}

                    {/* TEXTO */}
                    <div className="perfil-like-contenido">
                      <p>{publicacion.Texto}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}