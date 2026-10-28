import { API_BASE_URL } from '../config/api';

import React, { useEffect, useState } from 'react';
import './CrudClubes.css';

const API = API_BASE_URL;

const crearFormularioInicial = () => ({
    nombre: '',
    descripcion: '',
    imagen: null,
    horarios: [
        {
            dia: '',
            hora_inicio: '',
            hora_fin: ''
        }
    ],
    cuotas: [
        {
            curso: '',
            valor: ''
        }
    ],
    requisitos: ['']
});

export default function CrudClubes({
    onVolver,
    idClubEditar = null
}) {
    const [guardando, setGuardando] = useState(false);
    const [formulario, setFormulario] = useState(crearFormularioInicial);
    const [editando, setEditando] = useState(null);
    const [aviso, setAviso] = useState('');
    const [error, setError] = useState('');

    // CARGAR EL CLUB CUANDO SE ABRE PARA EDITAR
    useEffect(() => {
        let cancelado = false;

        const cargarClub = async () => {
            if (!idClubEditar) {
                setEditando(null);
                setFormulario(crearFormularioInicial());
                setAviso('');
                setError('');
                return;
            }

            try {
                setError('');
                setAviso('');

                const respuesta = await fetch(
                    `${API}/club/ver.php?id=${idClubEditar}`,
                    {
                        credentials: 'include'
                    }
                );

                if (!respuesta.ok) {
                    throw new Error(
                        'No se pudo consultar la información del club.'
                    );
                }

                const datos = await respuesta.json();

                // ver.php devuelve el club directamente.
                // Esta alternativa también permite respuestas con datos.club.
                const club = datos.club || datos;

                if (!club.Nombre) {
                    throw new Error(
                        datos.mensaje ||
                        'No se pudo cargar la información del club.'
                    );
                }

                if (cancelado) return;

                setEditando(Number(idClubEditar));

                setFormulario({
                    nombre: club.Nombre || '',
                    descripcion: club.Descripcion || '',
                    imagen: null,

                    horarios:
                        Array.isArray(club.horarios) &&
                        club.horarios.length > 0
                            ? club.horarios.map((horario) => ({
                                dia: horario.dia || '',
                                hora_inicio: horario.hora_inicio || '',
                                hora_fin: horario.hora_fin || ''
                            }))
                            : [
                                {
                                    dia: '',
                                    hora_inicio: '',
                                    hora_fin: ''
                                }
                            ],

                    cuotas:
                        Array.isArray(club.cuotas) &&
                        club.cuotas.length > 0
                            ? club.cuotas.map((cuota) => ({
                                curso: cuota.curso || '',
                                valor: cuota.valor ?? ''
                            }))
                            : [
                                {
                                    curso: '',
                                    valor: ''
                                }
                            ],

                    requisitos:
                        Array.isArray(club.requisitos) &&
                        club.requisitos.length > 0
                            ? club.requisitos.map((requisito) =>
                                typeof requisito === 'string'
                                    ? requisito
                                    : requisito.requisito || ''
                            )
                            : ['']
                });

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } catch (err) {
                if (cancelado) return;

                console.error(err);
                setError(
                    err.message || 'No se pudo cargar el club.'
                );
            }
        };

        cargarClub();

        return () => {
            cancelado = true;
        };
    }, [idClubEditar]);

    // CAMPOS PRINCIPALES
    const cambiarCampo = (e) => {
        const { name, value } = e.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // HORARIOS
    const agregarHorario = () => {
        setFormulario((anterior) => ({
            ...anterior,
            horarios: [
                ...anterior.horarios,
                {
                    dia: '',
                    hora_inicio: '',
                    hora_fin: ''
                }
            ]
        }));
    };

    const cambiarHorario = (indice, campo, valor) => {
        setFormulario((anterior) => {
            const horarios = [...anterior.horarios];

            horarios[indice] = {
                ...horarios[indice],
                [campo]: valor
            };

            return {
                ...anterior,
                horarios
            };
        });
    };

    const eliminarHorario = (indice) => {
        setFormulario((anterior) => {
            const horarios = anterior.horarios.filter(
                (_, i) => i !== indice
            );

            return {
                ...anterior,
                horarios: horarios.length > 0
                    ? horarios
                    : [
                        {
                            dia: '',
                            hora_inicio: '',
                            hora_fin: ''
                        }
                    ]
            };
        });
    };

    // CUOTAS
    const agregarCuota = () => {
        setFormulario((anterior) => ({
            ...anterior,
            cuotas: [
                ...anterior.cuotas,
                {
                    curso: '',
                    valor: ''
                }
            ]
        }));
    };

    const cambiarCuota = (indice, campo, valor) => {
        setFormulario((anterior) => {
            const cuotas = [...anterior.cuotas];

            cuotas[indice] = {
                ...cuotas[indice],
                [campo]: valor
            };

            return {
                ...anterior,
                cuotas
            };
        });
    };

    const eliminarCuota = (indice) => {
        setFormulario((anterior) => {
            const cuotas = anterior.cuotas.filter(
                (_, i) => i !== indice
            );

            return {
                ...anterior,
                cuotas: cuotas.length > 0
                    ? cuotas
                    : [
                        {
                            curso: '',
                            valor: ''
                        }
                    ]
            };
        });
    };

    // REQUISITOS
    const agregarRequisito = () => {
        setFormulario((anterior) => ({
            ...anterior,
            requisitos: [
                ...anterior.requisitos,
                ''
            ]
        }));
    };

    const cambiarRequisito = (indice, valor) => {
        setFormulario((anterior) => {
            const requisitos = [...anterior.requisitos];
            requisitos[indice] = valor;

            return {
                ...anterior,
                requisitos
            };
        });
    };

    const eliminarRequisito = (indice) => {
        setFormulario((anterior) => {
            const requisitos = anterior.requisitos.filter(
                (_, i) => i !== indice
            );

            return {
                ...anterior,
                requisitos: requisitos.length > 0
                    ? requisitos
                    : ['']
            };
        });
    };

    // GUARDAR: CREAR O EDITAR
    const guardar = async (e) => {
        e.preventDefault();

        setGuardando(true);
        setAviso('');
        setError('');

        // Guardamos este valor antes de realizar la petición.
        const estabaEditando = Boolean(editando);

        try {
            const datos = new FormData();

            datos.append('nombre', formulario.nombre);
            datos.append('descripcion', formulario.descripcion);

            if (formulario.imagen) {
                datos.append('imagen', formulario.imagen);
            }

            // HORARIOS
            const horariosValidos = formulario.horarios.filter(
                (horario) =>
                    horario.dia &&
                    horario.hora_inicio &&
                    horario.hora_fin
            );

            datos.append(
                'horarios',
                JSON.stringify(horariosValidos)
            );

            // CUOTAS
            const cuotasValidas = formulario.cuotas.filter(
                (cuota) =>
                    cuota.curso.trim() !== '' &&
                    cuota.valor !== ''
            );

            datos.append(
                'cuotas',
                JSON.stringify(cuotasValidas)
            );

            // REQUISITOS
            const requisitosValidos = formulario.requisitos
                .map((requisito) => requisito.trim())
                .filter((requisito) => requisito !== '');

            datos.append(
                'requisitos',
                JSON.stringify(requisitosValidos)
            );

            // SELECCIONAR EL ENDPOINT
            let url;

            if (estabaEditando) {
                url = `${API}/club/editar.php`;
                datos.append('id_club', editando);
            } else {
                url = `${API}/club/crear.php`;
            }

            const respuesta = await fetch(url, {
                method: 'POST',
                body: datos,
                credentials: 'include'
            });

            const texto = await respuesta.text();

            let resultado = null;

            try {
                resultado = JSON.parse(texto);
            } catch {
                // crear.php puede responder con texto plano.
            }

            if (!respuesta.ok) {
                throw new Error(
                    resultado?.mensaje ||
                    'El servidor no pudo guardar el club.'
                );
            }

            if (
                resultado &&
                resultado.success === false
            ) {
                throw new Error(
                    resultado.mensaje ||
                    'No se pudo guardar el club.'
                );
            }

            // SI EDITAMOS, VOLVER A LOS DETALLES DEL CLUB
            if (estabaEditando) {
                onVolver?.();
                return;
            }

            // SI CREAMOS, LIMPIAR EL FORMULARIO
            setAviso('Club creado correctamente.');
            setFormulario(crearFormularioInicial());
            setEditando(null);
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                'Ocurrió un error al guardar el club.'
            );
        } finally {
            setGuardando(false);
        }
    };

    // RENDER
    return (
        <div className="crud-page">
            <div className="crud-header">
                <h1>
                    {editando ? 'Editar club' : 'Crear club'}
                </h1>

                <p>
                    {editando
                        ? 'Modifica la información de tu club.'
                        : 'Crea y administra la información de tu club.'}
                </p>
            </div>

            <div className="crud-layout">
                <form
                    className="crud-form"
                    onSubmit={guardar}
                >
                    {/* INFORMACIÓN GENERAL */}
                    <section className="crud-section">
                        <div className="crud-section-title">
                            <h2>Información general</h2>
                        </div>

                        <div className="crud-field">
                            <label htmlFor="nombre">
                                Nombre del club
                            </label>

                            <input
                                id="nombre"
                                type="text"
                                name="nombre"
                                value={formulario.nombre}
                                onChange={cambiarCampo}
                                placeholder="Ej. Club de Matemáticas"
                                required
                            />
                        </div>

                        <div className="crud-field">
                            <label htmlFor="descripcion">
                                Descripción
                            </label>

                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={cambiarCampo}
                                placeholder="Describe el club..."
                                rows="4"
                                required
                            />
                        </div>

                        <div className="crud-field">
                            <label htmlFor="imagen">
                                Imágen del club
                            </label>

                            <input
                                id="imagen"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    setFormulario((anterior) => ({
                                        ...anterior,
                                        imagen:
                                            e.target.files?.[0] || null
                                    }));
                                }}
                            />

                            {editando && (
                                <small>
                                    Si no seleccionas una imagen nueva,
                                    se conservará la actual.
                                </small>
                            )}
                        </div>
                    </section>

                    {/* HORARIOS */}
                    <section className="crud-section">
                        <div className="crud-section-title">
                            <h2>Horarios</h2>
                        </div>

                        <div className="crud-repeat">
                            {formulario.horarios.map(
                                (horario, indice) => (
                                    <div
                                        className="crud-horario"
                                        key={indice}
                                    >
                                        <div className="crud-field">
                                            <label>
                                                Día
                                            </label>

                                            <select
                                                value={horario.dia}
                                                onChange={(e) =>
                                                    cambiarHorario(
                                                        indice,
                                                        'dia',
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Seleccionar día
                                                </option>
                                                <option value="Lunes">
                                                    Lunes
                                                </option>
                                                <option value="Martes">
                                                    Martes
                                                </option>
                                                <option value="Miércoles">
                                                    Miércoles
                                                </option>
                                                <option value="Jueves">
                                                    Jueves
                                                </option>
                                                <option value="Viernes">
                                                    Viernes
                                                </option>
                                                <option value="Sábado">
                                                    Sábado
                                                </option>
                                            </select>
                                        </div>

                                        <div className="crud-field">
                                            <label>
                                                Hora de inicio
                                            </label>

                                            <input
                                                type="time"
                                                value={horario.hora_inicio}
                                                onChange={(e) =>
                                                    cambiarHorario(
                                                        indice,
                                                        'hora_inicio',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="crud-field">
                                            <label>
                                                Hora de finalización
                                            </label>

                                            <input
                                                type="time"
                                                value={horario.hora_fin}
                                                onChange={(e) =>
                                                    cambiarHorario(
                                                        indice,
                                                        'hora_fin',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        {formulario.horarios.length > 1 && (
                                            <button
                                                type="button"
                                                className="crud-remove"
                                                onClick={() =>
                                                    eliminarHorario(indice)
                                                }
                                            >
                                                Eliminar horario
                                            </button>
                                        )}
                                    </div>
                                )
                            )}
                        </div>

                        <button
                            type="button"
                            className="crud-add"
                            onClick={agregarHorario}
                        >
                            + Agregar horario
                        </button>
                    </section>

                    {/* CUOTAS */}
                    <section className="crud-section">
                        <div className="crud-section-title">
                            <h2>Cuotas</h2>
                        </div>

                        <div className="crud-repeat">
                            {formulario.cuotas.map(
                                (cuota, indice) => (
                                    <div
                                        className="crud-item"
                                        key={indice}
                                    >
                                        <div className="crud-field">
                                            <label>
                                                Concepto
                                            </label>

                                            <input
                                                type="text"
                                                value={cuota.curso}
                                                onChange={(e) =>
                                                    cambiarCuota(
                                                        indice,
                                                        'curso',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Ej. Mensualidad"
                                            />
                                        </div>

                                        <div className="crud-field">
                                            <label>
                                                Valor
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={cuota.valor}
                                                onChange={(e) =>
                                                    cambiarCuota(
                                                        indice,
                                                        'valor',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="₡0"
                                            />
                                        </div>

                                        {formulario.cuotas.length > 1 && (
                                            <button
                                                type="button"
                                                className="crud-remove"
                                                onClick={() =>
                                                    eliminarCuota(indice)
                                                }
                                            >
                                                Eliminar cuota
                                            </button>
                                        )}
                                    </div>
                                )
                            )}
                        </div>

                        <button
                            type="button"
                            className="crud-add"
                            onClick={agregarCuota}
                        >
                            + Agregar cuota
                        </button>
                    </section>

                    {/* REQUISITOS */}
                    <section className="crud-section">
                        <div className="crud-section-title">
                            <h2>Requisitos</h2>
                        </div>

                        <div className="crud-repeat">
                            {formulario.requisitos.map(
                                (requisito, indice) => (
                                    <div
                                        className="crud-item"
                                        key={indice}
                                    >
                                        <div className="crud-field">
                                            <label>
                                                Requisito
                                            </label>

                                            <textarea
                                                rows="2"
                                                value={requisito}
                                                onChange={(e) =>
                                                    cambiarRequisito(
                                                        indice,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Ej. Tener disponibilidad para asistir a las reuniones"
                                            />
                                        </div>

                                        {formulario.requisitos.length > 1 && (
                                            <button
                                                type="button"
                                                className="crud-remove"
                                                onClick={() =>
                                                    eliminarRequisito(indice)
                                                }
                                            >
                                                Eliminar requisito
                                            </button>
                                        )}
                                    </div>
                                )
                            )}
                        </div>

                        <button
                            type="button"
                            className="crud-add"
                            onClick={agregarRequisito}
                        >
                            + Agregar requisito
                        </button>
                    </section>

                    {/* MENSAJES */}
                    {aviso && (
                        <div className="crud-aviso" role="status">
                            {aviso}
                        </div>
                    )}

                    {error && (
                        <div className="crud-error" role="alert">
                            {error}
                        </div>
                    )}

                    {/* BOTONES */}
                    <div className="crud-actions">
                        <button
                            type="submit"
                            className="crud-save"
                            disabled={guardando}
                        >
                            {guardando
                                ? 'Guardando...'
                                : editando
                                    ? 'Guardar cambios'
                                    : 'Crear club'}
                        </button>

                        <button
                            type="button"
                            className="crud-cancel"
                            onClick={() => onVolver?.()}
                            disabled={guardando}
                        >
                            {editando ? 'Cancelar edición' : 'Volver'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
