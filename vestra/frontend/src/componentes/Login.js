import React, { useState } from 'react';
import './Login.css';
import logo from '../logito.png';

export default function Login({ onCrearCuenta, onLoginCorrecto }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const manejarEnvio = async (e) => {
  e.preventDefault();

  if (!email.trim() || !password.trim()) {
    setMensaje("Por favor, complete todos los campos.");
    return;
  }

  try {
    const datos = new FormData();

    datos.append("email", email);
    datos.append("pass", password);

    const respuesta = await fetch(
      "http://localhost/vestra/backend/api/login.php",
      {
        method: "POST",
        body: datos
      }
    );

    const resultado = await respuesta.json();

console.log(resultado);

if (resultado.success) {

    setMensaje("Bienvenido " + resultado.usuario);

    setTimeout(() => {
        onLoginCorrecto();
    }, 1000);

} else {

    setMensaje(resultado.mensaje);

}
  } catch (error) {
    console.error(error);
    setMensaje("Error al conectar con el servidor.");
  }
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
