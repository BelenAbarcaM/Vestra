import React, { useState } from 'react';
import './Login.css';
import logo from '../logito.png';

export default function Registro({ onIniciarSesion }) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmarPassword, setConfirmarPassword] = useState('');
	
	const [mensaje, setMensaje] = useState('');

	const manejarRegistro = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !confirmarPassword.trim()) {
        setMensaje("Por favor, complete todos los campos.");
        return;
    }

    if (password !== confirmarPassword) {
        setMensaje("Las contraseñas no coinciden.");
        return;
    }

    try {

        const datos = new FormData();

        datos.append("name", name);
        datos.append("email", email);
        datos.append("password", password);

        const respuesta = await fetch(
            "http://localhost/vestra/backend/api/registro.php",
            {
                method: "POST",
                body: datos
            }
        );

        const resultado = await respuesta.json();

        console.log(resultado);

        if (resultado.success) {

            setMensaje(resultado.mensaje);

            setTimeout(() => {
                onIniciarSesion();
            }, 1500);

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
                <div className="marca-header">
					<img src={logo} className="App-logo" alt="Mascota vestra" />
					<img src={require('../vestra.png')} className="Isologo" alt="vestra" />
				</div>
				<h1>Crear cuenta</h1>
				<p className="login-subtitulo">Complete el formulario para registrarse</p>

				<form className="login-formulario" onSubmit={manejarRegistro}>
					<label htmlFor="name">Nombre completo</label>
					<input
						id="name"
						type="text"
						placeholder="Ingrese su nombre completo"
						value={name}
                        name="name"
						onChange={(e) => setName(e.target.value)}
					/>

					<label htmlFor="registro-email">Correo electronico</label>
					<input
						id="registro-email"
						type="email"
						placeholder="123@est.cedesdonbosco.ed.cr"
						value={email}
                        name="email"
						onChange={(e) => setEmail(e.target.value)}
					/>

					<label htmlFor="registro-password">Contraseña</label>
					<input
						id="registro-password"
						type="password"
						placeholder="Cree una contraseña"
						value={password}
                        name="password"
						onChange={(e) => setPassword(e.target.value)}
					/>

					<label htmlFor="confirmar-password">Confirmar contraseña</label>
					<input
						id="confirmar-password"
						type="password"
						placeholder="Repita su contraseña"
						value={confirmarPassword}
						onChange={(e) => setConfirmarPassword(e.target.value)}
					/>

					
					<button type="submit" className="login-boton">
						Registrarse
					</button>
				</form>

				{mensaje && <p className="login-mensaje">{mensaje}</p>}

				<p className="login-registro">
					Ya tiene cuenta?{' '}
					<button type="button" className="login-link-texto" onClick={onIniciarSesion}>
						Iniciar sesion
					</button>
				</p>
			</div>
		</section>
	);
}
