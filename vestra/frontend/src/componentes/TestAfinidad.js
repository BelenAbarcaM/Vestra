import React, { useState, useEffect } from 'react';
import './TestAfinidad.css';
import Mensaje from './Mensaje';
import logito from '../assets/logito.png';

const API = 'http://localhost/vestra/backend/api/afinidad';

export default function TestAfinidad({ onVolver }) {
  const [fase, setFase] = useState('cargando');
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [indice, setIndice] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [aviso, setAviso] = useState(null);
  const [animar, setAnimar] = useState(false);

  // preguntas cargando
  const cargarPreguntas = async () => {
    setFase('cargando');

    try {
      const respuesta = await fetch(API + '/preguntas.php', {
        credentials: 'include',
      });

      const datos = await respuesta.json();

      if (!datos.success) {
        setErrorCarga(datos.mensaje || 'No se pudo cargar el test.');
        setFase('error');
        return;
      }

      setPreguntas(datos.preguntas);
      setFase('intro');
    } catch (error) {
      console.error('Error cargando el test:', error);
      setErrorCarga('No se pudo conectar con el servidor.');
      setFase('error');
    }
  };

  useEffect(() => {
    cargarPreguntas();
  }, []);

  // animacion pro porque entre en colapso
  useEffect(() => {
    if (fase === 'resultado') {
      const temporizador = setTimeout(() => setAnimar(true), 100);
      return () => clearTimeout(temporizador);
    }

    setAnimar(false);
  }, [fase]);

  const comenzar = () => {
    setRespuestas({});
    setIndice(0);
    setResultado(null);
    setFase('preguntas');
  };

  const elegirOpcion = (idPregunta, idOpcion) => {
    setRespuestas({ ...respuestas, [idPregunta]: idOpcion });
  };

  const enviar = async () => {
    setFase('enviando');

    try {
      const respuesta = await fetch(API + '/enviar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ respuestas: respuestas }),
      });

      const datos = await respuesta.json();

      if (!datos.success) {
        setAviso({
          texto: datos.mensaje || 'No se pudo procesar el test.',
          tipo: 'error',
        });
        setFase('preguntas');
        return;
      }

      setResultado(datos);
      setFase('resultado');
    } catch (error) {
      console.error('Error enviando el test:', error);
      setAviso({ texto: 'No se pudo conectar con el servidor.', tipo: 'error' });
      setFase('preguntas');
    }
  };

  const siguiente = () => {
    if (indice < preguntas.length - 1) {
      setIndice(indice + 1);
    } else {
      enviar();
    }
  };

  const anterior = () => {
    if (indice > 0) {
      setIndice(indice - 1);
    }
  };

  const obtenerImagenClub = (club) => {
    if (!club.Foto_url) {
      return logito;
    }

    return 'http://localhost/vestra/uploads/clubes/' + club.Foto_url;
  };

  const textoNivel = (puntaje) => {
    if (puntaje >= 75) return 'Afinidad muy alta';
    if (puntaje >= 55) return 'Afinidad alta';
    if (puntaje >= 35) return 'Afinidad media';
    return 'Afinidad baja';
  };

  //vistas de que todo salio bien o estamos detras del palo
  const pregunta = preguntas[indice];
  const progreso = Math.round((indice / preguntas.length) * 100);

  return (
    <section className="taf-page">
      <Mensaje aviso={aviso} onCerrar={() => setAviso(null)} />

      <div className="taf-card">
        {fase === 'cargando' && (
          <div className="taf-centro">
            <p className="taf-texto-suave">Cargando el test...</p>
          </div>
        )}

        {fase === 'error' && (
          <div className="taf-centro">
            <h2 className="taf-titulo">Ups</h2>
            <p className="taf-texto-suave">{errorCarga}</p>
            <div className="taf-acciones">
              <button type="button" className="taf-btn" onClick={cargarPreguntas}>
                Reintentar
              </button>
              <button type="button" className="taf-btn taf-btn-suave" onClick={onVolver}>
                Volver
              </button>
            </div>
          </div>
        )}

        {fase === 'intro' && (
          <>
            <p className="taf-eyebrow">Test de afinidad</p>
            <h1 className="taf-titulo">¿En qué club encajas?</h1>
            <p className="taf-texto-suave">
              Responde {preguntas.length} preguntas sobre tus gustos. Según tus
              respuestas, tu afinidad con cada club irá subiendo o bajando, y al
              final Vivi te dará tu resultado.
            </p>

            <div className="taf-acciones">
              <button type="button" className="taf-btn" onClick={comenzar}>
                Comenzar el test
              </button>
              <button type="button" className="taf-link" onClick={onVolver}>
                Volver a clubes
              </button>
            </div>
          </>
        )}

        {fase === 'preguntas' && pregunta && (
          <>
            <div className="taf-progreso-info">
              <span>
                Pregunta {indice + 1} de {preguntas.length}
              </span>
              <span>{progreso}%</span>
            </div>

            <div className="taf-progreso">
              <div className="taf-progreso-barra" style={{ width: progreso + '%' }} />
            </div>

            <h2 className="taf-pregunta">{pregunta.texto}</h2>

            <div className="taf-opciones">
              {pregunta.opciones.map((opcion) => (
                <button
                  key={opcion.id_opcion}
                  type="button"
                  className={
                    respuestas[pregunta.id_pregunta] === opcion.id_opcion
                      ? 'taf-opcion taf-opcion-activa'
                      : 'taf-opcion'
                  }
                  onClick={() => elegirOpcion(pregunta.id_pregunta, opcion.id_opcion)}
                >
                  <span className="taf-opcion-marca" />
                  <span>{opcion.texto}</span>
                </button>
              ))}
            </div>

            <div className="taf-nav">
              <button
                type="button"
                className="taf-btn taf-btn-suave"
                onClick={anterior}
                disabled={indice === 0}
              >
                Atrás
              </button>

              <button
                type="button"
                className="taf-btn"
                onClick={siguiente}
                disabled={respuestas[pregunta.id_pregunta] === undefined}
              >
                {indice === preguntas.length - 1 ? 'Ver mi resultado' : 'Siguiente'}
              </button>
            </div>
          </>
        )}

        {fase === 'enviando' && (
          <div className="taf-centro">
            <h2 className="taf-titulo">Vivi está analizando tus respuestas...</h2>
            <p className="taf-texto-suave">Esto tarda unos segundos.</p>
          </div>
        )}

        {fase === 'resultado' && resultado && (
          <>
            <p className="taf-eyebrow">Tu resultado</p>

            <section className="taf-hero">
              <div className="taf-hero-foto">
                <img
                  src={obtenerImagenClub(resultado.mejor)}
                  alt={resultado.mejor.Nombre}
                  onError={(e) => {
                    e.currentTarget.src = logito;
                  }}
                />
              </div>

              <div className="taf-hero-texto">
                <span className="taf-etiqueta">Club recomendado</span>
                <h1 className="taf-hero-nombre">{resultado.mejor.Nombre}</h1>
                <span className="taf-nivel">{textoNivel(resultado.mejor.puntaje)}</span>
              </div>

              <div className="taf-porcentaje">{Math.round(resultado.mejor.puntaje)}%</div>
            </section>

            <section className="taf-vivi">
              <div className="taf-vivi-cabecera">
                <span className="taf-vivi-avatar">V</span>
                <div>
                  <strong>Vivi</strong>
                  <span>{resultado.fuente === 'ia' ? 'Análisis con IA' : 'Análisis automático'}</span>
                </div>
              </div>
              <p className="taf-vivi-resumen">{resultado.resumen}</p>
              <p className="taf-vivi-feedback">{resultado.feedback}</p>
            </section>

            <section className="taf-bloque">
              <h3 className="taf-subtitulo">Tus áreas más fuertes</h3>
              <div className="taf-chips">
                {resultado.categorias.slice(0, 3).map((categoria) => (
                  <span key={categoria.clave} className="taf-chip">
                    {categoria.nombre} · {Math.round(categoria.puntaje)}%
                  </span>
                ))}
              </div>
            </section>

            <section className="taf-bloque">
              <h3 className="taf-subtitulo">Tu afinidad con cada club</h3>

              <div className="taf-ranking">
                {resultado.ranking.map((club, i) => (
                  <div
                    key={club.id_club}
                    className={i === 0 ? 'taf-fila taf-fila-top' : 'taf-fila'}
                  >
                    <div className="taf-fila-cabecera">
                      <span>{club.Nombre}</span>
                      <span className="taf-fila-valor">{Math.round(club.puntaje)}%</span>
                    </div>
                    <div className="taf-fila-pista">
                      <div
                        className="taf-fila-barra"
                        style={{ width: animar ? club.puntaje + '%' : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="taf-acciones">
              <button type="button" className="taf-btn" onClick={comenzar}>
                Repetir el test
              </button>
              <button type="button" className="taf-link" onClick={onVolver}>
                Volver a clubes
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}