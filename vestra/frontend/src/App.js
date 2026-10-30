
import { useState } from "react";
import "./App.css";

import Login from "./componentes/Login";
import Perfil from "./componentes/Perfil";
import VerificarDatos from "./componentes/Verificar_datos";
import CambiarContrasena from "./componentes/Cambiar_contrasena";
import Inicio from "./componentes/Inicio";
import DesarrollaIdea from "./componentes/Desarrolla_idea";
import Inscripciones from "./componentes/Inscripciones";
import CrudClubes from "./componentes/CrudClubes";
import Dashboard from "./componentes/Dashboard";
import SolicitudInscripcion from "./componentes/SolicitudInscripcion";
import MenuNavEstudiante from "./componentes/Menu_nav_estudiante";
import MenuNavVisitante from "./componentes/Menu_nav_visitante";
import MenuNavEncargado from "./componentes/Menu_nav_encargado";
import BaseClub from "./componentes/Base_Club";
import NutriaEscondida from "./componentes/Nutria_escondida";
import Chats from "./componentes/Chats";
import Foro from "./componentes/Foro";
import TestAfinidad from "./componentes/TestAfinidad";
import FormularioPublicacion from "./componentes/FormularioPublicacion";

import { API_BASE_URL } from "./config/api";

import {
  esVisitante,
  TIPO_ESTUDIANTE,
  TIPO_PROFESOR,
} from "./componentes/utilTipoUsuario";

function App() {
  const [pantalla, setPantalla] = useState(
    localStorage.getItem("id_usuario")
      ? "inicio"
      : "login"
  );

  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const [correoRegistro, setCorreoRegistro] = useState("");
  const [clubSeleccionado, setClubSeleccionado] = useState(null);
  const [clubesProfesor, setClubesProfesor] = useState([]);
  const [chatbotAbierto, setChatbotAbierto] = useState(false);
  const [usuarioPerfil, setUsuarioPerfil] = useState(
    localStorage.getItem("id_usuario")
  );
  const [tipoUsuario, setTipoUsuario] = useState(
    localStorage.getItem("tipo_usuario")
  );
  const [clubForo, setClubForo] = useState(null);

  const [modoFormularioPublicacion, setModoFormularioPublicacion] =
    useState(null);

  const [publicacionEnEdicion, setPublicacionEnEdicion] =
    useState(null);

  const esVisitanteActual = esVisitante(tipoUsuario);
  const esEncargadoActual =
    String(tipoUsuario) === TIPO_PROFESOR;
  const esEstudianteActual =
    String(tipoUsuario) === TIPO_ESTUDIANTE;

  // Login correcto
  const manejarLoginCorrecto = () => {
    setTipoUsuario(localStorage.getItem("tipo_usuario"));
    setPantalla("inicio");
  };

  // Perfiles
  const manejarVerPerfil = (idUsuario) => {
    setUsuarioPerfil(idUsuario);
    setPantalla("perfil");
  };

  const manejarPerfilPropio = () => {
    const idUsuario = localStorage.getItem("id_usuario");

    setUsuarioPerfil(idUsuario);
    setPantalla("perfil");
  };

  // Cerrar sesión
  const manejarCerrarSesion = () => {
    localStorage.removeItem("id_usuario");
    localStorage.removeItem("tipo_usuario");

    setTipoUsuario(null);
    setClubesProfesor([]);
    setClubSeleccionado(null);
    setChatbotAbierto(false);
    setPantalla("login");
  };

  // Crear cuenta
  const manejarCrearCuenta = () => {
    setPantalla("registro");
  };

  // Solicitar recuperación de contraseña
  const manejarRecuperarContrasena = async (correo) => {
    if (!correo || !correo.trim()) {
      return {
        success: false,
        mensaje: "Primero debes ingresar tu correo electrónico.",
      };
    }

    try {
      const datos = new FormData();
      datos.append("correo", correo.trim());

      const respuesta = await fetch(
        `${API_BASE_URL}/solicitar_recuperacion.php`,
        {
          method: "POST",
          body: datos,
          credentials: "include",
        }
      );

      const texto = await respuesta.text();

      let resultado;

      try {
        resultado = JSON.parse(texto);
      } catch (error) {
        console.error("Respuesta no válida:", texto);

        return {
          success: false,
          mensaje: "El servidor devolvió una respuesta no válida.",
        };
      }

      if (resultado.success) {
        setCorreoRecuperacion(correo.trim());
        setPantalla("recuperacion");
      }

      return resultado;
    } catch (error) {
      console.error("Error solicitando recuperación:", error);

      return {
        success: false,
        mensaje: "Error al conectar con el servidor.",
      };
    }
  };

  // Código correcto
  const manejarCodigoCorrecto = (datos) => {
    if (datos.modo === "recuperacion") {
      setCorreoRecuperacion(datos.correo);
      setPantalla("cambiar-contrasena");
    }
  };

  // Registro exitoso
  const manejarRegistroExitoso = (correo) => {
    setCorreoRegistro(correo);
    setPantalla("verificar-registro");
  };

  // Registro verificado
  const manejarRegistroCorrecto = () => {
    setPantalla("login");
  };

  // Cargar clubes del encargado
  const cargarClubesDelProfesor = async () => {
    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/dashboard/mi_club.php`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || datos.success === false) {
        throw new Error(
          datos.mensaje || "No se pudieron cargar los clubes."
        );
      }

      if (Array.isArray(datos.clubes) && datos.clubes.length > 0) {
        setClubesProfesor(datos.clubes);
        setClubSeleccionado(datos.clubes[0]);
      } else {
        setClubesProfesor([]);
        setClubSeleccionado(null);
      }
    } catch (error) {
      console.error(
        "Error buscando los clubes del profesor:",
        error
      );

      setClubesProfesor([]);
      setClubSeleccionado(null);
    }
  };

  // Abrir formulario de publicaciones
  const manejarAbrirFormularioPublicacion = async (
    publicacion = null
  ) => {
    if (esEncargadoActual) {
      await cargarClubesDelProfesor();
    }

    setPublicacionEnEdicion(publicacion);
    setModoFormularioPublicacion("publicacion");
    setPantalla("formulario-publicacion");
  };

  // Cambiar vista
  const manejarCambioVista = (vista) => {
    if (vista === "inicio") {
      setPantalla("inicio");
    }

    if (vista === "mensajes" && !esVisitanteActual) {
      setPantalla("mensajes");
    }

    if (vista === "clubes") {
      setPantalla("clubes");
    }

    if (vista === "dashboard") {
      if (esEncargadoActual) {
        cargarClubesDelProfesor();
      }

      setPantalla("dashboard");
    }

    if (vista === "crud-clubes") {
      setPantalla("crud-clubes");
    }

    if (vista === "buzon" && !esVisitanteActual) {
      setPantalla("buzon");
    }

    if (vista === "perfil") {
      manejarPerfilPropio();
    }
  };

  return (
    <header className="App-header">

      {localStorage.getItem("id_usuario") && (
        <NutriaEscondida />
      )}

      {/* Login con Google */}
      {pantalla === "login" && (
        <Login onLoginCorrecto={manejarLoginCorrecto} />
      )}

      {/* Inicio */}
      {pantalla === "inicio" && (
        <Inicio
          onVerPerfil={manejarVerPerfil}
          onAbrirFormularioPublicacion={
            manejarAbrirFormularioPublicacion
          }
          onChatbotOpenChange={setChatbotAbierto}
        />
      )}

      {/* Clubes */}
      {pantalla === "clubes" && (
        <Inscripciones
          puedeSolicitar={esEstudianteActual}
          puedeAdministrar={esEncargadoActual}
          onProbarAfinidad={() => setPantalla("test-afinidad")}
          onAbrirClub={(club) => {
            setClubSeleccionado(club);
            setPantalla("solicitud-inscripcion");
          }}
          onVerMas={(club) => {
            setClubSeleccionado(club);
            setPantalla("detalle-club");
          }}
          onAdministrar={() => {
            setClubSeleccionado(null);
            setPantalla("crud-clubes");
          }}
        />
      )}

      {/* Test de afinidad */}
      {pantalla === "test-afinidad" && esEstudianteActual && (
        <TestAfinidad
          onVolver={() => setPantalla("clubes")}
        />
      )}

      {/* Mensajes */}
      {pantalla === "mensajes" && !esVisitanteActual && (
        <Chats />
      )}

      {/* Dashboard */}
      {pantalla === "dashboard" && (
        clubSeleccionado ? (
          <Dashboard
            idClub={clubSeleccionado.id_club}
            clubes={clubesProfesor}
            clubSeleccionado={clubSeleccionado}
            setClubSeleccionado={setClubSeleccionado}
          />
        ) : (
          <div className="dashboard-page">
            <div className="dashboard-shell">
              <section className="dashboard-card">
                <p className="eyebrow">Dashboard</p>
                <h3>No tienes clubes asignados.</h3>
              </section>
            </div>
          </div>
        )
      )}

      {/* Información completa del club */}
      {pantalla === "detalle-club" && clubSeleccionado && (
        <BaseClub
          idClub={clubSeleccionado.id_club}
          puedeSolicitar={esEstudianteActual}
          onSolicitarInscripcion={() =>
            setPantalla("solicitud-inscripcion")
          }
          onEditar={() => setPantalla("crud-clubes")}
          onAbrirForo={(club) => {
            setClubForo(club);
            setPantalla("foro-club");
          }}
          onVolver={() => {
            setClubSeleccionado(null);
            setPantalla("clubes");
          }}
        />
      )}

      {/* Solicitud de inscripción */}
      {pantalla === "solicitud-inscripcion" && (
        <SolicitudInscripcion
          club={clubSeleccionado}
          onVolver={() => setPantalla("clubes")}
        />
      )}

      {/* CRUD de clubes */}
      {pantalla === "crud-clubes" && (
        <CrudClubes
          idClubEditar={clubSeleccionado?.id_club ?? null}
          onVolver={() =>
            setPantalla(
              clubSeleccionado ? "detalle-club" : "clubes"
            )
          }
        />
      )}

      {/* Foro del club */}
      {pantalla === "foro-club" && clubForo && (
        <Foro
          key={clubForo.id_club}
          idClub={clubForo.id_club}
          nombreClub={clubForo.nombre}
          onVolver={() => setPantalla("detalle-club")}
        />
      )}

      {/* Buzón */}
      {pantalla === "buzon" && !esVisitanteActual && (
        <DesarrollaIdea />
      )}

      {/* Perfil */}
      {pantalla === "perfil" && (
        <Perfil
          idUsuarioPerfil={usuarioPerfil}
          onCerrarSesion={manejarCerrarSesion}
        />
      )}

      {/* Formulario de publicaciones */}
      {pantalla === "formulario-publicacion" && (
        <FormularioPublicacion
          apiUrl={API_BASE_URL}
          clubes={clubesProfesor}
          publicacion={publicacionEnEdicion}
          onCancelar={() => {
            setPantalla("inicio");
            setPublicacionEnEdicion(null);
          }}
          onGuardado={() => {
            setPantalla("inicio");
            setPublicacionEnEdicion(null);

            window.dispatchEvent(
              new CustomEvent("vestra:actualizar-publicaciones")
            );
          }}
        />
      )}

      {/* Menú inferior: oculto mientras Vivi está abierta */}
      {!chatbotAbierto && (
        (
          pantalla === "inicio" ||
          pantalla === "mensajes" ||
          pantalla === "clubes" ||
          pantalla === "dashboard" ||
          pantalla === "crud-clubes" ||
          pantalla === "buzon" ||
          pantalla === "perfil"
        ) && (
          esVisitanteActual ? (
            <MenuNavVisitante
              vistaActiva={pantalla}
              onCambiarVista={manejarCambioVista}
            />
          ) : esEncargadoActual ? (
            <MenuNavEncargado
              vistaActiva={pantalla}
              onCambiarVista={manejarCambioVista}
            />
          ) : (
            <MenuNavEstudiante
              vistaActiva={pantalla}
              onCambiarVista={manejarCambioVista}
            />
          )
        )
      )}

      {/* Recuperación */}
      {pantalla === "recuperacion" && (
        <VerificarDatos
          modo="recuperacion"
          correo={correoRecuperacion}
          onSuccess={manejarCodigoCorrecto}
        />
      )}

      {/* Cambiar contraseña */}
      {pantalla === "cambiar-contrasena" && (
        <CambiarContrasena
          correo={correoRecuperacion}
          onSuccess={() => setPantalla("login")}
        />
      )}

    </header>
  );
}

export default App;
