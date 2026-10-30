
import React, { useEffect, useRef, useState } from 'react';
import './Login.css';
import logo from '../logito.png';
import { extraerTipoUsuario } from './utilTipoUsuario';
import { apiUrl } from '../config/api';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

export default function Login({ onLoginCorrecto }) {
  const botonGoogleRef = useRef(null);
  const onLoginCorrectoRef = useRef(onLoginCorrecto);

  const [mensaje, setMensaje] = useState('');
  const [googleNativoListo, setGoogleNativoListo] = useState(false);

  const esAndroid = Capacitor.getPlatform() === 'android';

  useEffect(() => {
    onLoginCorrectoRef.current = onLoginCorrecto;
  }, [onLoginCorrecto]);

  // Enviar la credencial de Google al backend de Vestra.
  const procesarCredencial = async (credential) => {
    if (!credential) {
      setMensaje('Google no proporcionó una credencial válida.');
      return;
    }

    setMensaje('Verificando tu cuenta de Google...');

    try {
      const respuesta = await fetch(apiUrl('google_login.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          credential: credential
        })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.success) {
        setMensaje(
          resultado.mensaje || 'No se pudo iniciar sesión con Google.'
        );
        return;
      }

      localStorage.setItem('id_usuario', resultado.id_usuario);

      const tipo =
        extraerTipoUsuario(resultado) ??
        resultado.tipo_usuario ??
        resultado.id_tipo_usuario;

      if (tipo !== null && tipo !== undefined) {
        localStorage.setItem('tipo_usuario', tipo);
      }

      setMensaje(`¡Bienvenido/a, ${resultado.usuario}!`);
      onLoginCorrectoRef.current?.();

    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setMensaje('No se pudo conectar con el servidor de Vestra.');
    }
  };

  // Inicializar Google nativo en Android.
  useEffect(() => {
    if (!esAndroid) return;

    let cancelado = false;

    const inicializarGoogleNativo = async () => {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

      if (!clientId) {
        setMensaje('Falta configurar el ID de cliente de Google.');
        return;
      }

      try {
        await SocialLogin.initialize({
          google: {
            webClientId: clientId,
            mode: 'online'
          }
        });

        if (!cancelado) {
          setGoogleNativoListo(true);
        }

      } catch (error) {
        console.error('Error al inicializar Google nativo:', error);

        if (!cancelado) {
          setMensaje('No se pudo inicializar el inicio de sesión con Google.');
        }
      }
    };

    inicializarGoogleNativo();

    return () => {
      cancelado = true;
    };
  }, [esAndroid]);

  // Iniciar sesión nativo al pulsar el botón de Android.
  const iniciarGoogleNativo = async () => {
    try {
      setMensaje('Conectando con Google...');

      const respuestaGoogle = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile']
        }
      });

      const credential = respuestaGoogle.result?.idToken;

      if (!credential) {
        setMensaje('Google no proporcionó un ID token válido.');
        return;
      }

      await procesarCredencial(credential);

    } catch (error) {
      console.error('Error en el inicio de sesión nativo:', error);
      setMensaje('No se pudo iniciar sesión con Google.');
    }
  };

  // Conservar el inicio de sesión web mediante Google Identity Services.
  useEffect(() => {
    if (esAndroid) return;

    let cancelado = false;

    let script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    const procesarRespuestaWeb = (respuestaGoogle) => {
      procesarCredencial(respuestaGoogle?.credential);
    };

    const manejarErrorScript = () => {
      if (!cancelado) {
        setMensaje('No se pudo cargar el servicio de Google.');
      }
    };

    const inicializarGoogleWeb = () => {
      if (cancelado) return;

      if (!window.google?.accounts?.id || !botonGoogleRef.current) {
        return;
      }

      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

      if (!clientId) {
        setMensaje('Falta configurar el ID de cliente de Google en React.');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: procesarRespuestaWeb
      });

      botonGoogleRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(
        botonGoogleRef.current,
        {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 340,
          locale: 'es'
        }
      );
    };

    if (window.google?.accounts?.id) {
      inicializarGoogleWeb();

    } else if (script) {
      script.addEventListener('load', inicializarGoogleWeb);
      script.addEventListener('error', manejarErrorScript);

    } else {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.addEventListener('load', inicializarGoogleWeb);
      script.addEventListener('error', manejarErrorScript);

      document.head.appendChild(script);
    }

    return () => {
      cancelado = true;

      if (script) {
        script.removeEventListener('load', inicializarGoogleWeb);
        script.removeEventListener('error', manejarErrorScript);
      }
    };
  }, [esAndroid]);

  return (
    <section className="login-contenedor">
      <div className="login-tarjeta">

        <div className="marca-header">
          <img
            src={logo}
            className="App-logo"
            alt="Mascota Vestra"
          />

          <img
            src={require('../vestra.png')}
            className="Isologo"
            alt="Vestra"
          />
        </div>

        <h1>Iniciar sesión</h1>

        <p className="login-subtitulo">
          Accede a Vestra con tu cuenta de Google
        </p>

        <div className="login-google">

          {esAndroid ? (
            <button
              type="button"
              className="login-google-boton"
              onClick={iniciarGoogleNativo}
              disabled={!googleNativoListo}
            >
              {googleNativoListo
                ? 'Continuar con Google'
                : 'Conectando con Google...'}
            </button>
          ) : (
            <div
              ref={botonGoogleRef}
              className="login-google-boton"
            />
          )}

        </div>

        {mensaje && (
          <p className="login-mensaje" role="status">
            {mensaje}
          </p>
        )}

      </div>
    </section>
  );
}
