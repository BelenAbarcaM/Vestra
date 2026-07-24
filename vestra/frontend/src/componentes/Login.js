import React, { useState } from 'react';
import './Login.css';
import logo from '../logito.png';

export default function Login({ onCrearCuenta }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const manejarEnvio = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMensaje('Por favor, complete todos los campos.');
      return;
    }

    setMensaje(`Bienvenido/a. Ingreso preparado para: ${email}`);
    console.log('Datos de inicio de sesion', { email, password, recordarme });
  };

  return (
    <section className="login-contenedor">
      <div className="login-tarjeta">
        <img src={require('../vestra.png')} className="Isologo" alt="vestra" />
         <img src={logo} className="App-logo" alt="logo" /> 

        <h1>Iniciar sesion</h1>
        <p className="login-subtitulo">Acceda con su email y contraseña</p>

        <form className="login-formulario" onSubmit={manejarEnvio}>
          <label htmlFor="email">Correo electronico</label>
          <input
            id="email"
            type="email"
            placeholder="123@est.cedesdonbosco.ed.cr"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Ingrese su contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="login-opciones">
            <label className="login-check">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
              />
              Recordarme
            </label>
            <button type="button" className="login-enlace">
              Olvidé mi contraseña
            </button>
          </div>

          <button type="submit" className="login-boton">
            Entrar
          </button>
        </form>

        {mensaje && <p className="login-mensaje">{mensaje}</p>}

        <p className="login-registro">
          No tiene cuenta?{' '}
          <button type="button" className="login-link-texto" onClick={onCrearCuenta}>
            Crear cuenta
          </button>
        </p>
      </div>
    </section>
  );
}
