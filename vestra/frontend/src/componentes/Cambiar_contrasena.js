import React, { useState } from 'react';
import './Cambiar_contraseña.css';

export default function CambiarContrasena({
  correo = '',
  onSuccess,
}) {

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setMensaje('');

    if (!nuevaContrasena || !confirmarContrasena) {
      setError('Completa todos los campos.');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {

      const datos = new FormData();

      datos.append('password', nuevaContrasena);

      const respuesta = await fetch(
        'http://localhost/vestra/backend/api/cambiar_password.php',
        {
          method: 'POST',
          body: datos,
          credentials: 'include'
        }
      );

      const resultado = await respuesta.json();

      console.log('Cambio de contraseña:', resultado);

      if (resultado.success) {

        setMensaje('Contraseña actualizada correctamente.');

        setNuevaContrasena('');
        setConfirmarContrasena('');

        setTimeout(() => {

          if (typeof onSuccess === 'function') {
            onSuccess();
          }

        }, 1000);

      } else {

        setError(resultado.mensaje);

      }

    } catch (error) {

      console.error('Error cambiando contraseña:', error);

      setError('Error al conectar con el servidor.');

    }
  };


  return (

    <div className="verificar-contenedor">

      <div className="verificar-tarjeta">

        <img
          src={require('../vestra.png')}
          className="Isologo"
          alt="vestra"
        />

        <h1>Nueva contraseña</h1>

        <p className="verificar-subtitulo">
          Ingresa una nueva contraseña para tu cuenta.
        </p>

        {correo && (
          <p className="verificar-demo">
            Cuenta: <strong>{correo}</strong>
          </p>
        )}

        <form
          className="verificar-formulario"
          onSubmit={handleSubmit}
        >

          <input
            type="password"
            value={nuevaContrasena}
            onChange={(e) => {
              setNuevaContrasena(e.target.value);
              setError('');
            }}
            placeholder="Nueva contraseña"
            className="verificar-input-texto"
          />

          <input
            type="password"
            value={confirmarContrasena}
            onChange={(e) => {
              setConfirmarContrasena(e.target.value);
              setError('');
            }}
            placeholder="Confirmar contraseña"
            className="verificar-input-texto"
          />

          {error && (
            <p className="verificar-error">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="verificar-demo">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            className="verificar-boton"
          >
            Cambiar contraseña
          </button>

        </form>

      </div>

    </div>

  );
}
