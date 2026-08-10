import { useState } from 'react';
import './App.css';

import Login from './componentes/Login';
import Perfil from './componentes/Perfil';
import VerificarDatos from './componentes/Verificar_datos';
import Registro from './componentes/Registro';
import CambiarContrasena from './componentes/Cambiar_contrasena';
import Inicio from './componentes/Inicio'
import MenuNavEstudiante from './componentes/Menu_nav_estudiante';

function App() {

  const [pantalla, setPantalla] = useState(
    localStorage.getItem("id_usuario") ? "inicio" : "login"
  );

  const [correoRecuperacion, setCorreoRecuperacion] = useState('');

  // =========================
  // LOGIN CORRECTO
  // =========================

  const manejarLoginCorrecto = () => {
    setPantalla("inicio");
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

    console.log("RESPUESTA COMPLETA DEL PHP:", texto);

    // Intentamos convertir la respuesta a JSON
    let resultado;

    try {
      resultado = JSON.parse(texto);
    } catch (error) {

      console.error("El PHP no devolvió JSON válido.");
      console.error(texto);

      // Como el correo ya se envió, podemos continuar
      setCorreoRecuperacion(correo.trim());
      setPantalla("recuperacion");

      return {
        success: true
      };
    }

    console.log("RESULTADO RECUPERACIÓN:", resultado);

    if (resultado.success) {

      setCorreoRecuperacion(correo.trim());
      setPantalla("recuperacion");

    }

    return resultado;

  } catch (error) {

    console.error("Error solicitando recuperación:", error);

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

    console.log("Código verificado:", datos);

    if (datos.modo === "recuperacion") {

        console.log("Código de recuperación correcto");

        setCorreoRecuperacion(datos.correo);

        setPantalla("cambiar-contrasena");
    }
};

  // =========================
  // REGISTRO VERIFICADO
  // =========================

  const manejarRegistroCorrecto = (datos) => {

    console.log("Registro verificado:", datos);

    setPantalla("login");

  };


  // =========================
  // PANTALLAS
  // =========================

  return (

    <header className="App-header">

      {pantalla === "login" && (
        <Login
          onCrearCuenta={manejarCrearCuenta}
          onLoginCorrecto={manejarLoginCorrecto}
          onRecuperarContrasena={manejarRecuperarContrasena}
        />
      )}


      {pantalla === "registro" && (
        <Registro
         onIniciarSesion={() => setPantalla("login")}
        />
      )}


      {pantalla === "inicio" && (
        <Inicio />
      )}

      {pantalla === "perfil" && (
        <Perfil
          onCerrarSesion={manejarCerrarSesion}
        />
      )}

      {(pantalla === "inicio" || pantalla === "perfil") && (
  <MenuNavEstudiante
    vistaActiva={pantalla}
    onCambiarVista={(vista) => {
      if (vista === "inicio" || vista === "perfil") {
        setPantalla(vista);
      }
    }}
  />
)}


      {pantalla === "recuperacion" && (
        <VerificarDatos
          modo="recuperacion"
          correo={correoRecuperacion}
          onSuccess={manejarCodigoCorrecto}
        />
      )}

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