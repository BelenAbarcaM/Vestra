import React, { useState } from 'react';
import './Desarrolla_idea.css';
import Mensaje from './Mensaje';

export default function DesarrollaIdea({ onCrear }) {
  const [formulario, setFormulario] = useState({
    nombreEncargado: '',
    correo: '',
    nombreCurso: '',
    descripcion: '',
    horario: '',
    cuota: '',
    requisitos: '',
  });

  const [aviso, setAviso] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const respuesta = await fetch(
      "http://localhost/vestra/backend/api/club/proponer.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formulario),
      }
    );

    const data = await respuesta.json();

    console.log("RESPUESTA PROPUESTA CLUB:", data);

    if (!data.success) {
      setAviso({
        texto: data.mensaje || "No se pudo enviar la propuesta.",
        tipo: "error",
      });
      return;
    }

    setAviso({
      texto: "¡Propuesta enviada correctamente!",
      tipo: "exito",
    });

    setFormulario({
      nombreEncargado: "",
      correo: "",
      nombreCurso: "",
      descripcion: "",
      horario: "",
      cuota: "",
      requisitos: "",
    });

    if (typeof onCrear === "function") {
      onCrear(data);
    }

  } catch (error) {
    console.error("Error enviando propuesta:", error);
    setAviso({
      texto: "No se pudo conectar con el servidor.",
      tipo: "error",
    });
  }
};

  return (
    <section className="idea-page">
      <Mensaje aviso={aviso} onCerrar={() => setAviso(null)} />

      <div className="idea-card">
        <div className="idea-topbar">
          <h1 className="idea-heading">DESARROLLA TU IDEA</h1>
          <p className="idea-subtitulo">
            Completa la información para proponer tu club
          </p>
        </div>

        <div className="idea-linea" />

        <form className="idea-form" onSubmit={handleSubmit}>
          <div className="idea-field">
            <label htmlFor="nombreEncargado">Nombre encargado</label>
            <input
              id="nombreEncargado"
              name="nombreEncargado"
              type="text"
              value={formulario.nombreEncargado}
              onChange={handleChange}
              placeholder="Ingresa el nombre"
            />
          </div>

          <div className="idea-field">
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={formulario.correo}
              onChange={handleChange}
              placeholder="Ingresa el correo"
            />
          </div>

          <div className="idea-field">
            <label htmlFor="nombreCurso">Nombre del curso</label>
            <input
              id="nombreCurso"
              name="nombreCurso"
              type="text"
              value={formulario.nombreCurso}
              onChange={handleChange}
              placeholder="Nombre del club o curso"
            />
          </div>

          <div className="idea-field">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formulario.descripcion}
              onChange={handleChange}
              placeholder="Describe tu idea"
              rows={4}
            />
          </div>

          <div className="idea-field">
            <label htmlFor="horario">Horario</label>
            <input
              id="horario"
              name="horario"
              type="text"
              value={formulario.horario}
              onChange={handleChange}
              placeholder="Ej: Viernes 2:00 pm"
            />
          </div>

          <div className="idea-field">
            <label htmlFor="cuota">Cuota</label>
            <input
              id="cuota"
              name="cuota"
              type="text"
              value={formulario.cuota}
              onChange={handleChange}
              placeholder="Ej: ₡5000"
            />
          </div>

          <div className="idea-field">
            <label htmlFor="requisitos">Requisitos</label>
            <textarea
              id="requisitos"
              name="requisitos"
              value={formulario.requisitos}
              onChange={handleChange}
              placeholder="Requisitos para participar"
              rows={3}
            />
          </div>

          <button type="submit" className="idea-btn">
            Crear club
          </button>
        </form>
      </div>
    </section>
  );
}