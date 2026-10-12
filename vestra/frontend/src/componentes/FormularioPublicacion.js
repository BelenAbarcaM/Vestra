
import React, { useEffect, useState } from "react";

export default function FormularioPublicacion({
  apiUrl,
  clubes,
  publicacion = null,
  onCancelar,
  onGuardado,
}) {
  const [texto, setTexto] = useState("");
  const [idClub, setIdClub] = useState("");
  const [imagen, setImagen] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const editando = Boolean(publicacion);

  useEffect(() => {
    if (publicacion) {
      setTexto(publicacion.caption || "");
      setIdClub(
        String(publicacion.id_club || publicacion.idClub || "")
      );
      setVistaPrevia(publicacion.image_url || null);
    } else {
      setTexto("");
      setIdClub("");
      setImagen(null);
      setVistaPrevia(null);
    }
  }, [publicacion]);

  function seleccionarImagen(e) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setError("Seleccioná un archivo de imágen válido.");
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imágen no puede superar los 5 MB.");
      return;
    }

    setImagen(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
    setError("");
  }

  async function guardarPublicacion(e) {
    e.preventDefault();
    setError("");

    if (!texto.trim()) {
      setError("Escribí algo antes de publicar.");
      return;
    }

    if (!idClub) {
      setError("Seleccioná uno de tus clubes.");
      return;
    }

    const formulario = new FormData();
    formulario.append("texto", texto.trim());
    formulario.append("id_club", idClub);

    if (imagen) {
      formulario.append("imagen", imagen);
    }

    let ruta = `${apiUrl}/publicaciones/crear.php`;

    if (editando) {
      ruta = `${apiUrl}/publicaciones/editar.php`;
      formulario.append(
        "id_publicacion",
        String(publicacion.id ?? publicacion.id_publicacion)
      );
    }

    try {
      setGuardando(true);

      const respuesta = await fetch(ruta, {
        method: "POST",
        body: formulario,
        credentials: "include",
      });

      const data = await respuesta.json();

      if (!respuesta.ok || !data.success) {
        throw new Error(
          data.mensaje || "No se pudo guardar la publicación."
        );
      }

      onGuardado();
    } catch (err) {
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="pagina-formulario-publicacion">
        <form
            className="form-publicacion"
            onSubmit={guardarPublicacion}
        >
      <h2>{editando ? "Editar publicación" : "Crear publicación"}</h2>

      <label htmlFor="publicacion-club">Publicar en</label>
      <select
        id="publicacion-club"
        value={idClub}
        onChange={(e) => setIdClub(e.target.value)}
        required
      >
        <option value="">Seleccioná un club</option>

        {clubes.map((club) => (
          <option key={club.id_club} value={club.id_club}>
            {club.Nombre || club.nombre}
          </option>
        ))}
      </select>

      <label htmlFor="publicacion-texto">Texto</label>
      <textarea
        id="publicacion-texto"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="¿Qué querés compartir?"
        rows={4}
        maxLength={3000}
        required
      />

<label className="imagen-upload-label" htmlFor="publicacion-imagen">
    Añadir una imagen
</label>

<label
    className="imagen-upload-area"
    htmlFor="publicacion-imagen"
>
    <span className="imagen-upload-icon">
        <svg
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
        </svg>
    </span>

    <span className="imagen-upload-titulo">
        {imagen ? "¡Imagen seleccionada!" : "Añade una foto a tu publicación"}
    </span>

    <span className="imagen-upload-descripcion">
        {imagen ? imagen.name : "PNG, JPG o WEBP · Máximo 5 MB"}
    </span>

    <span className="imagen-upload-boton">
        {imagen ? "Cambiar imagen" : "Seleccionar imagen"}
    </span>
</label>

<input
    className="imagen-upload-input"
    id="publicacion-imagen"
    type="file"
    accept="image/*"
    onChange={seleccionarImagen}
/>


      {vistaPrevia && (
        <img
          className="form-publicacion-preview"
          src={vistaPrevia}
          alt="Vista previa de la publicación"
        />
      )}

      {error && <p className="form-publicacion-error">{error}</p>}

      <div className="form-publicacion-acciones">
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
        >
          Cancelar
        </button>

        <button type="submit" disabled={guardando}>
          {guardando
            ? "Guardando..."
            : editando
              ? "Guardar cambios"
              : "Publicar"}
        </button>
      </div>
        </form>
    </div>
);
}
