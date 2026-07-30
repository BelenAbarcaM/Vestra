import { useState } from 'react';
import './App.css';
import Login from './componentes/Login';
import Registro from './componentes/Registro';
import Inicio from './componentes/Inicio';

function App() {
  const [vistaActual, setVistaActual] = useState('login');

  return (
    <div className="App">
      <header className="App-header">

        {vistaActual === 'login' ? (
          <Login
            onCrearCuenta={() => setVistaActual('registro')}
            onLoginCorrecto={() => setVistaActual('inicio')}
          />
        ) : vistaActual === 'registro' ? (
          <Registro
            onIniciarSesion={() => setVistaActual('login')}
          />
        ) : (
          <Inicio />
        )}

      </header>
    </div>
  );
}

export default App;