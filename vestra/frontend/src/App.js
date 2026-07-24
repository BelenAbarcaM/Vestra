import { useState } from 'react';
import './App.css';
import Login from './componentes/Login';
import Registro from './componentes/Registro';


function App() {
  const [vistaActual, setVistaActual] = useState('login');

  return (
    <div className="App">
      <header className="App-header">
        {vistaActual === 'login' ? (
          <Login onCrearCuenta={() => setVistaActual('registro')} />
        ) : (
          <Registro onIniciarSesion={() => setVistaActual('login')} />
        )}
        <hr></hr>
      </header>
    </div>
  );
}

export default App;
