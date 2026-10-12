import React, { useEffect, useState } from 'react';
import './SolicitudInscripcion.css';

const API = 'http://localhost/vestra/backend/api/club';

function obtenerFechaLocal() {
const fecha = new Date();
const anio = fecha.getFullYear();
const mes = String(fecha.getMonth() + 1).padStart(2, '0');
const dia = String(fecha.getDate()).padStart(2, '0');

return `${anio}-${mes}-${dia}`;


}

export default function SolicitudInscripcion({ club, onVolver }) {
const [formulario, setFormulario] = useState({
carnet: '',
correo: '',
seccion: '',
tipo_membresia: 'Nuevo',
fecha_ingreso_solicitada: ''
});

const [requisitos, setRequisitos] = useState([]);
const [requisitosMarcados, setRequisitosMarcados] = useState([]);
const [cargandoRequisitos, setCargandoRequisitos] = useState(true);
const [errorRequisitos, setErrorRequisitos] = useState('');
const [enviada, setEnviada] = useState(false);
const [cargando, setCargando] = useState(false);
const [error, setError] = useState('');

const fechaMaxima = obtenerFechaLocal();

useEffect(() => {
    const cargarRequisitos = async () => {
        setCargandoRequisitos(true);
        setErrorRequisitos('');
        setRequisitos([]);
        setRequisitosMarcados([]);

        try {
            const respuesta = await fetch(
                `${API}/requisitos.php?id_club=${encodeURIComponent(
                    club.id_club
                )}`,
                { credentials: 'include' }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok || resultado.success === false) {
                throw new Error(
                    resultado.mensaje ||
                    resultado.message ||
                    'No se pudieron cargar los requisitos.'
                );
            }

            if (!Array.isArray(resultado.requisitos)) {
                throw new Error(
                    'El servidor devolvió una lista de requisitos inválida.'
                );
            }

            setRequisitos(resultado.requisitos);
        } catch (err) {
            console.error('Error cargando requisitos:', err);
            setErrorRequisitos(
                err.message || 'No se pudieron cargar los requisitos.'
            );
        } finally {
            setCargandoRequisitos(false);
        }
    };

    if (club?.id_club) {
        cargarRequisitos();
    } else {
        setCargandoRequisitos(false);
        setErrorRequisitos(
            'No se pudo identificar el club seleccionado.'
        );
    }
}, [club?.id_club]);

const actualizar = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
        ...anterior,
        [name]: value
    }));
};

const cambiarTipoMembresia = (e) => {
    const tipo = e.target.value;

    setFormulario((anterior) => ({
        ...anterior,
        tipo_membresia: tipo,
        fecha_ingreso_solicitada:
            tipo === 'Nuevo'
                ? ''
                : anterior.fecha_ingreso_solicitada
    }));

    setError('');
};

const cambiarRequisito = (idRequisito, marcado) => {
    setRequisitosMarcados((anteriores) => {
        if (marcado) {
            return anteriores.includes(idRequisito)
                ? anteriores
                : [...anteriores, idRequisito];
        }

        return anteriores.filter((id) => id !== idRequisito);
    });
};

const todosMarcados =
    requisitos.length > 0 &&
    requisitos.every((requisito) =>
        requisitosMarcados.includes(Number(requisito.id_requisito))
    );

const puedeEnviar =
    !cargandoRequisitos &&
    !errorRequisitos &&
    todosMarcados &&
    !cargando;

const enviar = async (e) => {
    e.preventDefault();
    setError('');

    if (!club?.id_club) {
        setError('No se pudo identificar el club seleccionado.');
        return;
    }

    if (!todosMarcados) {
        setError('Debes marcar todos los requisitos para continuar.');
        return;
    }

    if (
        formulario.tipo_membresia === 'Antiguo' &&
        !formulario.fecha_ingreso_solicitada
    ) {
        setError('Indica la fecha en la que ingresaste al club.');
        return;
    }

    if (
        formulario.tipo_membresia === 'Antiguo' &&
        formulario.fecha_ingreso_solicitada > fechaMaxima
    ) {
        setError('La fecha de ingreso no puede ser futura.');
        return;
    }

    setCargando(true);

    try {
        const respuesta = await fetch(`${API}/solicitar.php`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_club: club.id_club,
                carnet: formulario.carnet.trim(),
                correo: formulario.correo.trim(),
                seccion: formulario.seccion.trim(),
                requisitos: requisitosMarcados,
                tipo_membresia: formulario.tipo_membresia,
                fecha_ingreso_solicitada:
                    formulario.tipo_membresia === 'Antiguo'
                        ? formulario.fecha_ingreso_solicitada
                        : null
            })
        });

        const texto = await respuesta.text();
        let resultado;

        try {
            resultado = JSON.parse(texto);
        } catch {
            console.error('Respuesta no válida del servidor:', texto);
            throw new Error(
                'El servidor devolvió una respuesta inválida.'
            );
        }

        if (!respuesta.ok || !resultado.success) {
            throw new Error(
                resultado.mensaje ||
                resultado.message ||
                'No se pudo enviar la solicitud.'
            );
        }

        setEnviada(true);
    } catch (err) {
        console.error('Error enviando solicitud:', err);
        setError(
            err.message || 'No se pudo conectar con el servidor.'
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

                <h1>Solicitud de inscripción para el club</h1>

                <p>
                    Completa tus datos para solicitar un espacio en{' '}
                    <strong>{club?.Nombre || 'el club'}</strong>.
                </p>
            </header>

            {enviada ? (
                <div className="solicitud-ok" role="status">
                    <h2>¡Solicitud enviada!</h2>

                    <p>
                        Tu solicitud para {club?.Nombre || 'el club'}
                        {' '}fue enviada correctamente.
                    </p>

                    {formulario.tipo_membresia === 'Antiguo' ? (
                        <p>
                            Tu fecha de ingreso declarada quedó pendiente
                            de revisión. El profesor deberá aprobarla
                            antes de que se utilice como fecha oficial.
                        </p>
                    ) : (
                        <p>
                            El profesor deberá revisar tu solicitud.
                        </p>
                    )}

                    <button
                        className="solicitud-submit"
                        type="button"
                        onClick={onVolver}
                    >
                        Volver a clubes
                    </button>
                </div>
            ) : (
                <form className="solicitud-form" onSubmit={enviar}>
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

                    <div className="solicitud-antiguedad">
                        <h2>Tu relación con el club</h2>

                        <p>
                            Cuéntanos si vas a ingresar por primera vez
                            o si ya formas parte de este club.
                        </p>

                        <label className="solicitud-opcion-antiguedad">
                            <input
                                type="radio"
                                name="tipo_membresia"
                                value="Nuevo"
                                checked={
                                    formulario.tipo_membresia === 'Nuevo'
                                }
                                onChange={cambiarTipoMembresia}
                            />

                            <span>
                                <strong>Soy miembro nuevo</strong>
                                <small>
                                    Voy a ingresar al club por primera vez.
                                </small>
                            </span>
                        </label>

                        <label className="solicitud-opcion-antiguedad">
                            <input
                                type="radio"
                                name="tipo_membresia"
                                value="Antiguo"
                                checked={
                                    formulario.tipo_membresia === 'Antiguo'
                                }
                                onChange={cambiarTipoMembresia}
                            />

                            <span>
                                <strong>Ya pertenezco a este club</strong>
                                <small>
                                    Quiero registrar mi fecha real de ingreso.
                                </small>
                            </span>
                        </label>

                        {formulario.tipo_membresia === 'Antiguo' && (
                            <div className="solicitud-fecha-ingreso">
                                <label htmlFor="fecha_ingreso_solicitada">
                                    ¿Desde qué fecha perteneces al club?
                                </label>

                                <input
                                    id="fecha_ingreso_solicitada"
                                    name="fecha_ingreso_solicitada"
                                    type="date"
                                    required
                                    max={fechaMaxima}
                                    value={
                                        formulario.fecha_ingreso_solicitada
                                    }
                                    onChange={actualizar}
                                />

                                <p>
                                    Esta fecha deberá ser revisada y
                                    aprobada por el profesor. Mientras
                                    esté pendiente, no cambiará tu
                                    antigüedad oficial.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="solicitud-requisitos">
                        <h2>Requisitos del club</h2>

                        <p>
                            Marca cada casilla para confirmar que
                            cumples con todos los requisitos.
                        </p>

                        {cargandoRequisitos ? (
                            <p>Cargando requisitos...</p>
                        ) : errorRequisitos ? (
                            <p
                                className="solicitud-error"
                                role="alert"
                            >
                                {errorRequisitos}
                            </p>
                        ) : requisitos.length === 0 ? (
                            <p>
                                Este club no tiene requisitos configurados.
                                No es posible enviar la solicitud hasta
                                que se verifique su configuración.
                            </p>
                        ) : (
                            <div className="solicitud-lista-requisitos">
                                {requisitos.map((requisito) => (
                                    <label
                                        className="solicitud-requisito"
                                        key={requisito.id_requisito}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={requisitosMarcados.includes(
                                                Number(
                                                    requisito.id_requisito
                                                )
                                            )}
                                            onChange={(e) =>
                                                cambiarRequisito(
                                                    Number(
                                                        requisito.id_requisito
                                                    ),
                                                    e.target.checked
                                                )
                                            }
                                        />

                                        <span>
                                            {requisito.requisito}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {!cargandoRequisitos &&
                            !errorRequisitos &&
                            requisitos.length > 0 && (
                                <p className="solicitud-progreso">
                                    Marcados:{' '}
                                    {requisitosMarcados.filter((id) =>
                                        requisitos.some(
                                            (r) =>
                                                Number(r.id_requisito) === id
                                        )
                                    ).length}{' '}
                                    de {requisitos.length}
                                </p>
                            )}
                    </div>

                    {error && (
                        <p className="solicitud-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="solicitud-submit"
                        type="submit"
                        disabled={!puedeEnviar}
                    >
                        {cargando
                            ? 'Enviando solicitud...'
                            : cargandoRequisitos
                            ? 'Cargando requisitos...'
                            : 'Enviar solicitud'}
                    </button>

                    {!cargandoRequisitos &&
                        !errorRequisitos &&
                        requisitos.length > 0 &&
                        !todosMarcados && (
                            <p className="solicitud-ayuda">
                                Debes marcar todos los requisitos para
                                habilitar el envío.
                            </p>
                        )}
                </form>
            )}
        </article>
    </section>
);

}
