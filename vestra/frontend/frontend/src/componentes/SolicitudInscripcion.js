import React, { useState } from 'react';

import './SolicitudInscripcion.css';

export default function SolicitudInscripcion({ club, onVolver }) {

    const [formulario, setFormulario] = useState({
        carnet: '',
        correo: '',
        seccion: ''
    });

    const [enviada, setEnviada] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const actualizar = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };


    const enviar = async (e) => {

        e.preventDefault();

        setCargando(true);
        setError('');

        try {

            const respuesta = await fetch(
                'http://localhost/vestra/backend/api/club/solicitar.php',
                {
                    method: 'POST',
                    credentials: 'include',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        id_club: club.id_club,
                        carnet: formulario.carnet,
                        correo: formulario.correo,
                        seccion: formulario.seccion
                    })
                }
            );

            console.log(
                'Status solicitud:',
                respuesta.status
            );

            const texto = await respuesta.text();

            console.log(
                'Respuesta solicitud:',
                texto
            );

            let resultado;

            try {

                resultado = JSON.parse(texto);

            } catch (error) {

                console.error(
                    'La respuesta no es JSON:',
                    texto
                );

                setError(
                    'El servidor devolvió una respuesta inválida.'
                );

                return;
            }


            console.log(
                'Resultado solicitud:',
                resultado
            );


            if (resultado.success) {

                setEnviada(true);

            } else {

                setError(
                    resultado.message ||
                    'No se pudo enviar la solicitud.'
                );
            }

        } catch (error) {

            console.error(
                'Error enviando solicitud:',
                error
            );

            setError(
                'No se pudo conectar con el servidor.'
            );

        } finally {

            setCargando(false);
        }
    };


    return (
        <section className="solicitud-page">

            <article className="solicitud-card">

                <button
                    type="button"
                    className="solicitud-back"
                    onClick={onVolver}
                >
                    ← Volver a inscripciones
                </button>


                <header className="solicitud-heading">

                    <span className="solicitud-chip">
                        SOLICITUD DE INSCRIPCIÓN
                    </span>

                    <h1>
                        Solicitud de inscripción para el club
                    </h1>

                    <p>
                        Completa tus datos para solicitar un espacio en{' '}
                        <strong>
                            {club?.Nombre || 'el club'}
                        </strong>.
                    </p>

                </header>


                {enviada ? (

                    <div
                        className="solicitud-ok"
                        role="status"
                    >

                        <h2>
                            ¡Solicitud enviada!
                        </h2>

                        <p>
                            Tu solicitud para{' '}
                            {club?.Nombre || 'el club'}{' '}
                            fue enviada correctamente.
                        </p>

                        <p>
                            El profesor deberá revisar tu solicitud.
                        </p>

                        <button
                            className="solicitud-submit"
                            type="button"
                            onClick={onVolver}
                        >
                            Volver a clubes
                        </button>

                    </div>

                ) : (

                    <form
                        className="solicitud-form"
                        onSubmit={enviar}
                    >

                        <label>
                            Carnet

                            <input
                                name="carnet"
                                required
                                value={formulario.carnet}
                                onChange={actualizar}
                                placeholder="Ingresa tu carnet"
                            />

                        </label>


                        <label>
                            Correo electrónico

                            <input
                                name="correo"
                                type="email"
                                required
                                value={formulario.correo}
                                onChange={actualizar}
                                placeholder="Ingresa tu correo"
                            />

                        </label>


                        <label>
                            Sección

                            <input
                                name="seccion"
                                required
                                value={formulario.seccion}
                                onChange={actualizar}
                                placeholder="Ingresa tu sección"
                            />

                        </label>


                        {error && (

                            <p
                                className="solicitud-error"
                                role="alert"
                            >
                                {error}
                            </p>

                        )}


                        <button
                            className="solicitud-submit"
                            type="submit"
                            disabled={cargando}
                        >

                            {cargando
                                ? 'Enviando solicitud...'
                                : 'Enviar solicitud'}

                        </button>

                    </form>

                )}

            </article>

        </section>
    );
}
