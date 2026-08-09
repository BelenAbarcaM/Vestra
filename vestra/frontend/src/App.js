import { useState } from 'react';
import './App.css';

import Login from './componentes/Login';
import Perfil from './componentes/Perfil';

function App() {

  const [pantalla, setPantalla] = useState(
    localStorage.getItem("id_usuario") ? "perfil" : "login"
  );

  const manejarLoginCorrecto = () => {
    setPantalla("perfil");
  };

  const manejarCerrarSesion = () => {
    localStorage.removeItem("id_usuario");
    setPantalla("login");
  };

  const manejarCrearCuenta = () => {
    console.log("Aquí después conectaremos Registro");
  };

return (
  <div className="App">

    <header className="App-header">

      {pantalla === "login" && (
        <Login
          onCrearCuenta={manejarCrearCuenta}
          onLoginCorrecto={manejarLoginCorrecto}
        />
      )}

      {pantalla === "perfil" && (
        <Perfil
          onCerrarSesion={manejarCerrarSesion}
        />
      )}

    </header>

  </div>
);
}

export default App;