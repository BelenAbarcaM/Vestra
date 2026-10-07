import { useState } from "react";

import "./App.css";

import Login from "./componentes/Login";
import Perfil from "./componentes/Perfil";
import VerificarDatos from "./componentes/Verificar_datos";
import Registro from "./componentes/Registro";
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

  const [correoRecuperacion, setCorreoRecuperacion] =
    useState("");

  const [correoRegistro, setCorreoRegistro] =
    useState("");

  const [clubSeleccionado, setClubSeleccionado] =
    useState(null);

  const [clubesProfesor, setClubesProfesor] =
    useState([]);

  const [usuarioPerfil, setUsuarioPerfil] =
    useState(localStorage.getItem("id_usuario"));

  const [tipoUsuario, setTipoUsuario] =
    useState(localStorage.getItem("tipo_usuario"));

  const esVisitanteActual = esVisitante(tipoUsuario);
  const esEncargadoActual =
    String(tipoUsuario) === TIPO_PROFESOR;
  const esEstudianteActual =
    String(tipoUsuario) === TIPO_ESTUDIANTE;

  // login correcto
  const manejarLoginCorrecto = () => {
    setTipoUsuario(localStorage.getItem("tipo_usuario"));
    setPantalla("inicio");
  };

  // perfiles
  const manejarVerPerfil = (idUsuario) => {
    setUsuarioPerfil(idUsuario);
    setPantalla("perfil");
  };

  const manejarPerfilPropio = () => {
    const idUsuario =
      localStorage.getItem("id_usuario");

    setUsuarioPerfil(idUsuario);
    setPantalla("perfil");
  };

  // cerrar sesión
  const manejarCerrarSesion = () => {
    localStorage.removeItem("id_usuario");
    localStorage.removeItem("tipo_usuario");

    setTipoUsuario(null);
    setClubesProfesor([]);
    setClubSeleccionado(null);
    setPantalla("login");
  };

  // crear cuenta
  const manejarCrearCuenta = () => {
    setPantalla("registro");
  };

  // solicitar recuperación
  const manejarRecuperarContrasena = async (correo) => {
    if (!correo || !correo.trim()) {
      return {
        success: false,
        mensaje:
          "Primero debes ingresar tu correo electrónico.",
      };
    }

    try {
      const datos = new FormData();
      datos.append("correo", correo.trim());

      const respuesta = await fetch(
        "http://localhost/vestra/backend/api/solicitar_recuperacion.php",
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
        setCorreoRecuperacion(correo.trim());
        setPantalla("recuperacion");

        return {
          success: true,
        };
      }

      if (resultado.success) {
        setCorreoRecuperacion(correo.trim());
        setPantalla("recuperacion");
      }

      return resultado;
    } catch (error) {
      console.error(
        "Error solicitando recuperación:",
        error
      );

      return {
        success: false,
        mensaje:
          "Error al conectar con el servidor.",
      };
    }
  };

  // código correcto
  const manejarCodigoCorrecto = (datos) => {
    if (datos.modo === "recuperacion") {
      setCorreoRecuperacion(datos.correo);
      setPantalla("cambiar-contrasena");
    }
  };

  // registro exitoso
  const manejarRegistroExitoso = (correo) => {
    setCorreoRegistro(correo);
    setPantalla("verificar-registro");
  };

  // registro verificado
  const manejarRegistroCorrecto = () => {
    setPantalla("login");
  };

  // clubes del encargado
  const cargarClubesDelProfesor = async () => {
    try {
      const respuesta = await fetch(
        "http://localhost/vestra/backend/api/dashboard/mi_club.php",
        {
          credentials: "include",
        }
      );

      const datos = await respuesta.json();

      if (
        datos.clubes &&
        datos.clubes.length > 0
      ) {
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

  // cambiar vista
  const manejarCambioVista = (vista) => {
    if (vista === "inicio") {
      setPantalla("inicio");
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

    if (
      vista === "buzon" &&
      !esVisitanteActual
    ) {
      setPantalla("buzon");
    }

    if (vista === "perfil") {
      manejarPerfilPropio();
    }
  };

  return (
    <header className="App-header">

      {/* login */}
      {pantalla === "login" && (
        <Login
          onCrearCuenta={manejarCrearCuenta}
          onLoginCorrecto={manejarLoginCorrecto}
          onRecuperarContrasena={
            manejarRecuperarContrasena
          }
        />
      )}

      {/* registro */}
      {pantalla === "registro" && (
        <Registro
          onIniciarSesion={() =>
            setPantalla("login")
          }
          onRegistroExitoso={
            manejarRegistroExitoso
          }
        />
      )}

      {/* verificar código de registro */}
      {pantalla === "verificar-registro" && (
        <VerificarDatos
          modo="registro"
          correo={correoRegistro}
          onSuccess={manejarRegistroCorrecto}
        />
      )}

      {/* inicio */}
      {pantalla === "inicio" && (
        <Inicio
          onVerPerfil={manejarVerPerfil}
        />
      )}

      {/* clubes */}
      {pantalla === "clubes" && (
        <Inscripciones
          puedeSolicitar={esEstudianteActual}
          puedeAdministrar={esEncargadoActual}
          onAbrirClub={(club) => {
            setClubSeleccionado(club);
            setPantalla("solicitud-inscripcion");
          }}
          onAdministrar={() =>
            setPantalla("crud-clubes")
          }
        />
      )}

      {/* dashboard */}
      {pantalla === "dashboard" && (
        clubSeleccionado ? (
          <Dashboard
            idClub={clubSeleccionado.id_club}
            clubes={clubesProfesor}
            clubSeleccionado={clubSeleccionado}
            setClubSeleccionado={
              setClubSeleccionado
            }
          />
        ) : (
          <div className="dashboard-page">
            <div className="dashboard-shell">
              <section className="dashboard-card">
                <p className="eyebrow">
                  Dashboard
                </p>

                <h3>
                  No tienes clubes asignados.
                </h3>
              </section>
            </div>
          </div>
        )
      )}

      {/* solicitud de inscripción */}
      {pantalla ===
        "solicitud-inscripcion" && (
        <SolicitudInscripcion
          club={clubSeleccionado}
          onVolver={() =>
            setPantalla("clubes")
          }
        />
      )}

      {/* crud de clubes */}
      {pantalla === "crud-clubes" && (
        <CrudClubes
          onVolver={() =>
            setPantalla("clubes")
          }
        />
      )}

      {/* buzón */}
      {pantalla === "buzon" &&
        !esVisitanteActual && (
          <DesarrollaIdea />
        )}

      {/* perfil */}
      {pantalla === "perfil" && (
        <Perfil
          idUsuarioPerfil={usuarioPerfil}
          onCerrarSesion={manejarCerrarSesion}
        />
      )}

      {/* menú inferior */}
      {(
        pantalla === "inicio" ||
        pantalla === "clubes" ||
        pantalla === "dashboard" ||
        pantalla === "crud-clubes" ||
        pantalla === "buzon" ||
        pantalla === "perfil"
      ) && (
        esVisitanteActual ? (
          <MenuNavVisitante
            vistaActiva={pantalla}
            onCambiarVista={
              manejarCambioVista
            }
          />
        ) : esEncargadoActual ? (
          <MenuNavEncargado
            vistaActiva={pantalla}
            onCambiarVista={
              manejarCambioVista
            }
          />
        ) : (
          <MenuNavEstudiante
            vistaActiva={pantalla}
            onCambiarVista={
              manejarCambioVista
            }
          />
        )
      )}

      {/* recuperación */}
      {pantalla === "recuperacion" && (
        <VerificarDatos
          modo="recuperacion"
          correo={correoRecuperacion}
          onSuccess={manejarCodigoCorrecto}
        />
      )}

      {/* cambiar contraseña */}
      {pantalla === "cambiar-contrasena" && (
        <CambiarContrasena
          correo={correoRecuperacion}
          onSuccess={() =>
            setPantalla("login")
          }
        />
      )}

    </header>
  );
}

export default App;