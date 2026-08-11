import React, { useState, useEffect } from 'react';
import './Perfil.css';
import Mensaje from './Mensaje';

export default function Perfil({
  idUsuarioPerfil,
  onCerrarSesion
}) {

  const idUsuarioActual = localStorage.getItem("id_usuario");

  const esMiPerfil =
    String(idUsuarioActual) === String(idUsuarioPerfil);

  const espaciosInsignias = Array.from({ length: 3 });

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


  // =====================================================
  // CARGAR PERFIL
  // =====================================================

  useEffect(() => {

    if (!idUsuarioPerfil) {
      console.log("No hay ID de perfil.");
      return;
    }

    console.log("Cargando perfil:", idUsuarioPerfil);

    fetch(
      `http://localhost/vestra/backend/api/perfil/obtener.php?id_usuario=${idUsuarioPerfil}`
    )
      .then((respuesta) => respuesta.json())
      .then((resultado) => {

        console.log("Perfil recibido:", resultado);

        if (resultado.success) {

          setNombre(resultado.usuario.Nombre);

          setBio(
            resultado.usuario.bio ||
            "Descripción del perfil."
          );


          // ================================
          // FOTO DE PERFIL
          // ================================

          if (resultado.usuario.Foto_url) {

            let urlFoto;

            if (
              resultado.usuario.Foto_url === "default.jpeg"
            ) {

              urlFoto =
                "http://localhost/vestra/uploads/default.jpeg";

            } else {

              urlFoto =
                `http://localhost/vestra/uploads/perfiles/${resultado.usuario.Foto_url}`;

            }

            setImagenPerfil(urlFoto);

          } else {

            setImagenPerfil('');

          }

        }

      })
      .catch((error) => {

        console.error(
          "Error obteniendo el perfil:",
          error
        );

      });

  }, [idUsuarioPerfil]);


  // =====================================================
  // CARGAR LIKES
  // SOLO PARA EL PERFIL PROPIO
  // =====================================================

  useEffect(() => {

    if (!esMiPerfil || !idUsuarioPerfil) {
      setCargandoLikes(false);
      return;
    }

    console.log(
      "Cargando publicaciones likeadas del usuario:",
      idUsuarioPerfil
    );

    fetch(
      `http://localhost/vestra/backend/api/perfil/likes.php?id_usuario=${idUsuarioPerfil}`
    )
      .then((respuesta) => respuesta.json())
      .then((resultado) => {

        console.log(
          "Publicaciones likeadas:",
          resultado
        );

        if (resultado.success) {

          setPublicacionesLikeadas(
            resultado.publicaciones || []
          );

        } else {

          setPublicacionesLikeadas([]);

        }

      })
      .catch((error) => {

        console.error(
          "Error obteniendo publicaciones likeadas:",
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

    const idUsuario =
      localStorage.getItem("id_usuario");

    if (!idUsuario) {

      setAviso({
        texto: "No se encontró el usuario.",
        tipo: "error",
      });

      return;

    }

    const datos = new FormData();

    datos.append(
      "id_usuario",
      idUsuario
    );

    datos.append(
      "nombre",
      borradorNombre.trim()
    );

    datos.append(
      "bio",
      borradorBio.trim()
    );


    if (archivoFoto) {

      datos.append(
        "foto",
        archivoFoto
      );

    }


    try {

      const respuesta = await fetch(
        "http://localhost/vestra/backend/api/perfil/editar.php",
        {
          method: "POST",
          body: datos
        }
      );


      console.log(
        "Status HTTP:",
        respuesta.status
      );


      const textoRespuesta =
        await respuesta.text();


      console.log(
        "Respuesta del servidor:",
        textoRespuesta
      );


      let resultado;


      try {

        resultado =
          JSON.parse(textoRespuesta);

      } catch (error) {

        console.error(
          "La respuesta NO es JSON:",
          textoRespuesta
        );

        setAviso({
          texto: "El servidor devolvió un error. Revisa la consola.",
          tipo: "error",
        });

        return;

      }


      console.log(
        "Actualización:",
        resultado
      );


      if (resultado.success) {

        setNombre(
          borradorNombre.trim() ||
          "Nombre del perfil"
        );

        setBio(
          borradorBio.trim() ||
          "Descripción del perfil."
        );

        setArchivoFoto(null);

        setEditando(false);


        if (resultado.foto) {

          setImagenPerfil(
            `http://localhost/vestra/uploads/perfiles/${resultado.foto}`
          );

        }


        setAviso({
          texto: "Perfil actualizado correctamente.",
          tipo: "exito",
        });


      } else {

        setAviso({
          texto: resultado.mensaje || "No se pudo actualizar el perfil.",
          tipo: "error",
        });

      }


    } catch (error) {

      console.error(
        "Error actualizando perfil:",
        error
      );

      setAviso({
        texto: "Error al conectar con el servidor.",
        tipo: "error",
      });

    }

  };


  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  const handleCerrarSesion = async () => {

    try {

      const respuesta = await fetch(
        "http://localhost/vestra/backend/api/logout.php",
        {
          method: "GET"
        }
      );


      const resultado =
        await respuesta.json();


      console.log(
        "Logout:",
        resultado
      );


      localStorage.removeItem(
        "id_usuario"
      );


      if (
        typeof onCerrarSesion === "function"
      ) {

        onCerrarSesion();

      }


    } catch (error) {

      console.error(
        "Error cerrando sesión:",
        error
      );


      localStorage.removeItem(
        "id_usuario"
      );


      if (
        typeof onCerrarSesion === "function"
      ) {

        onCerrarSesion();

      }

    }

  };


  // =====================================================
  // CAMBIAR FOTO
  // =====================================================

  const handleCambiarImagen = (e) => {

    const archivo =
      e.target.files?.[0];


    if (!archivo) {
      return;
    }


    if (
      !archivo.type.startsWith("image/")
    ) {

      setAviso({
        texto: "Selecciona una imagen válida.",
        tipo: "error",
      });

      return;

    }


    setArchivoFoto(archivo);


    const lector =
      new FileReader();


    lector.onload = () => {

      setImagenPerfil(
        lector.result
      );

    };


    lector.readAsDataURL(
      archivo
    );

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <section className="perfil-contenedor">

      <Mensaje aviso={aviso} onCerrar={() => setAviso(null)} />

      <div className="perfil-card">


        {/* ==========================================
            BARRA SUPERIOR
        ========================================== */}

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

            <h1 className="perfil-heading">
              Perfil
            </h1>

            <p className="perfil-subtitulo">

              {esMiPerfil
                ? "Tu espacio personal en Vestra"
                : "Perfil de usuario en Vestra"
              }

            </p>

          </div>

        </div>


        <div className="perfil-linea" />


        {/* ==========================================
            PERFIL
        ========================================== */}

        <div className="perfil-hero">


          <div className="perfil-avatar">

            {imagenPerfil ? (

              <img
                src={imagenPerfil}
                alt="Perfil"
                className="perfil-avatar-img"
              />

            ) : (

              <span className="perfil-avatar-icon">
                :v
              </span>

            )}

          </div>


          {/* CAMBIAR FOTO
              SOLO EN TU PERFIL
          */}

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


          {/* ==========================================
              INFORMACIÓN
          ========================================== */}

          {!editando ? (

            <>

              <h2 className="perfil-nombre">
                {nombre}
              </h2>


              <p className="perfil-bio">
                {bio}
              </p>

            </>

          ) : (

            <div className="perfil-formulario-edicion">


              <input
                type="text"
                className="perfil-input"
                value={borradorNombre}
                onChange={(e) =>
                  setBorradorNombre(
                    e.target.value
                  )
                }
                placeholder="Nombre"
              />


              <textarea
                className="perfil-textarea"
                value={borradorBio}
                onChange={(e) =>
                  setBorradorBio(
                    e.target.value
                  )
                }
                placeholder="Descripción del perfil"
                rows={3}
              />


            </div>

          )}

        </div>


        {/* ==========================================
            BOTONES DE EDICIÓN
            SOLO TU PERFIL
        ========================================== */}

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


        {/* ==========================================
            INSIGNIAS
        ========================================== */}

        <section className="perfil-seccion perfil-seccion-suave">

          <h3 className="perfil-titulo-seccion">
            Insignias
          </h3>


          <div className="perfil-insignias">

            {espaciosInsignias.map(
              (_, index) => (

                <div
                  key={index}
                  className="perfil-insignia-vacia"
                  aria-hidden="true"
                >

                  <span>
                    +
                  </span>

                </div>

              )
            )}

          </div>

        </section>


        {/* ==========================================
            LIKES
            SOLO TU PERFIL
        ========================================== */}

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


                {publicacionesLikeadas.map(
                  (publicacion) => (

                    <article
                      key={
                        publicacion.id_publicacion
                      }
                      className="perfil-like-card"
                    >


                      {/* ==========================
                          ENCABEZADO
                      ========================== */}

                      <div className="perfil-like-header">


                        <div className="perfil-like-autor">


                          {/* FOTO DEL USUARIO */}

                          {publicacion.foto_usuario ? (

                            <img
                              src={
                                publicacion.foto_usuario ===
                                "default.jpeg"

                                  ? "http://localhost/vestra/uploads/default.jpeg"

                                  : `http://localhost/vestra/uploads/perfiles/${publicacion.foto_usuario}`
                              }
                              alt={
                                publicacion.nombre_usuario
                              }
                              className="perfil-like-avatar-img"
                            />

                          ) : (

                            <div className="perfil-like-avatar">

                              <i className="fa-solid fa-user"></i>

                            </div>

                          )}


                          <div className="perfil-like-datos">

                            <strong>

                              {
                                publicacion.nombre_usuario
                              }

                            </strong>


                            {publicacion.nombre_club && (

                              <span>

                                {
                                  publicacion.nombre_club
                                }

                              </span>

                            )}

                          </div>


                        </div>


                        <i className="fa-solid fa-heart perfil-like-corazon"></i>


                      </div>


                      {/* ==========================
                          FOTO DE PUBLICACIÓN
                      ========================== */}

                      {publicacion.imagen_url && (

                        <img
                          className="perfil-like-imagen"
                          src={
                            `http://localhost/vestra/uploads/publicaciones/${publicacion.imagen_url}`
                          }
                          alt="Publicación"
                        />

                      )}


                      {/* ==========================
                          TEXTO
                      ========================== */}

                      <div className="perfil-like-contenido">

                        <p>
                          {publicacion.Texto}
                        </p>

                      </div>


                    </article>

                  )
                )}

              </div>

            )}

          </section>

        )}


      </div>

    </section>

  );

}