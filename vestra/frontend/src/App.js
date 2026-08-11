import { useState } from 'react';
import './App.css';

import Login from './componentes/Login';
import Perfil from './componentes/Perfil';
import VerificarDatos from './componentes/Verificar_datos';
import Registro from './componentes/Registro';
import CambiarContrasena from './componentes/Cambiar_contrasena';
import Inicio from './componentes/Inicio';
import DesarrollaIdea from './componentes/Desarrolla_idea';
import Inscripciones from './componentes/Inscripciones';
import MenuNavEstudiante from './componentes/Menu_nav_estudiante';

function App() {

  const [pantalla, setPantalla] = useState(
    localStorage.getItem("id_usuario")
      ? "inicio"
      : "login"
  );

  const [correoRecuperacion, setCorreoRecuperacion] = useState('');

  const [usuarioPerfil, setUsuarioPerfil] = useState(
    localStorage.getItem("id_usuario")
  );

  // =========================
  // LOGIN CORRECTO
  // =========================

  const manejarLoginCorrecto = () => {
    setPantalla("inicio");
  };

  // =========================
  // PERFILES
  // =========================

  const manejarVerPerfil = (idUsuario) => {
    console.log("Abriendo perfil:", idUsuario);

    setUsuarioPerfil(idUsuario);
    setPantalla("perfil");
  };

  const manejarPerfilPropio = () => {
    const idUsuario = localStorage.getItem("id_usuario");

    setUsuarioPerfil(idUsuario);
    setPantalla("perfil");
  };

  // =========================
  // CERRAR SESIÓN
  // =========================

  const manejarCerrarSesion = () => {
    localStorage.removeItem("id_usuario");
    setPantalla("login");
  };

  // =========================
  // CREAR CUENTA
  // =========================

  const manejarCrearCuenta = () => {
    setPantalla("registro");
  };

  // =========================
  // SOLICITAR RECUPERACIÓN
  // =========================

  const manejarRecuperarContrasena = async (correo) => {

    if (!correo || !correo.trim()) {
      return {
        success: false,
        mensaje: "Primero debes ingresar tu correo electrónico."
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
          credentials: "include"
        }
      );

      const texto = await respuesta.text();

      console.log(
        "RESPUESTA COMPLETA DEL PHP:",
        texto
      );

      // Intentamos convertir la respuesta a JSON
      let resultado;

      try {
        resultado = JSON.parse(texto);
      } catch (error) {

        console.error(
          "El PHP no devolvió JSON válido."
        );

        console.error(texto);

        // Como el correo ya se envió, podemos continuar
        setCorreoRecuperacion(
          correo.trim()
        );

        setPantalla("recuperacion");

        return {
          success: true
        };
      }

      console.log(
        "RESULTADO RECUPERACIÓN:",
        resultado
      );

      if (resultado.success) {

        setCorreoRecuperacion(
          correo.trim()
        );

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
        mensaje: "Error al conectar con el servidor."
      };
    }
  };

  // =========================
  // CÓDIGO CORRECTO
  // =========================

  const manejarCodigoCorrecto = (datos) => {

    console.log(
      "Código verificado:",
      datos
    );

    if (datos.modo === "recuperacion") {

      console.log(
        "Código de recuperación correcto"
      );

      setCorreoRecuperacion(
        datos.correo
      );

      setPantalla(
        "cambiar-contrasena"
      );
    }
  };

  // =========================
  // REGISTRO VERIFICADO
  // =========================

  const manejarRegistroCorrecto = (datos) => {

    console.log(
      "Registro verificado:",
      datos
    );

    setPantalla("login");
  };

  // =========================
  // CAMBIAR VISTA DEL MENÚ
  // =========================

  const manejarCambioVista = (vista) => {

  if (vista === "inicio") {
    setPantalla("inicio");
  }

  if (vista === "clubes") {
    setPantalla("clubes");
  }

  if (vista === "buzon") {
    setPantalla("buzon");
  }

  if (vista === "perfil") {
    setUsuarioPerfil(
      localStorage.getItem("id_usuario")
    );

    setPantalla("perfil");
  }
};

  // =========================
  // PANTALLAS
  // =========================

  return (

    <header className="App-header">

      {/* LOGIN */}

      {pantalla === "login" && (
        <Login
          onCrearCuenta={manejarCrearCuenta}
          onLoginCorrecto={manejarLoginCorrecto}
          onRecuperarContrasena={
            manejarRecuperarContrasena
          }
        />
      )}

      {/* REGISTRO */}

      {pantalla === "registro" && (
        <Registro
          onIniciarSesion={() =>
            setPantalla("login")
          }
        />
      )}

      {/* INICIO */}

      {pantalla === "inicio" && (
        <Inicio
          onVerPerfil={manejarVerPerfil}
        />
      )}

      {/* CLUBES */}

      {pantalla === "clubes" && (
        <Inscripciones />
      )}

      {/* BUZÓN */}

{pantalla === "buzon" && (
  <DesarrollaIdea />
)}

      {/* PERFIL */}

      {pantalla === "perfil" && (
        <Perfil
          idUsuarioPerfil={usuarioPerfil}
          onCerrarSesion={manejarCerrarSesion}
        />
      )}

      {/* MENÚ INFERIOR */}

      {(
  pantalla === "inicio" ||
  pantalla === "clubes" ||
  pantalla === "buzon" ||
  pantalla === "perfil"
) && (
  <MenuNavEstudiante
    vistaActiva={pantalla}
    onCambiarVista={manejarCambioVista}
  />
)}

      {/* RECUPERACIÓN */}

      {pantalla === "recuperacion" && (
        <VerificarDatos
          modo="recuperacion"
          correo={correoRecuperacion}
          onSuccess={manejarCodigoCorrecto}
        />
      )}

      {/* CAMBIAR CONTRASEÑA */}

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