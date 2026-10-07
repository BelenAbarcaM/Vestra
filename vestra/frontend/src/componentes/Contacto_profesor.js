import { useState } from "react";
import "./Contacto_profesor.css";

const mensajesIniciales = [
	{
		id: "saludo-encargado",
		texto: "Hola, soy el encargado del club. ¿En qué puedo ayudarte?",
		tipo: "bot",
	},
];

export default function ContactoProfesor() {
	const [mensajes, setMensajes] = useState(mensajesIniciales);
	const [texto, setTexto] = useState("");

	const enviarMensaje = (evento) => {
		evento.preventDefault();
		const contenido = texto.trim();

		if (!contenido) return;

		setMensajes((actuales) => [
			...actuales,
			{
				id: `${Date.now()}`,
				texto: contenido,
				tipo: "user",
			},
		]);
		setTexto("");
	};

	return (
		<main className="contacto-encargado">


			<section className="contacto-encargado-layout" aria-label="Chat con el encargado">
				<section className="contacto-conversacion" aria-label="Conversación con el encargado">
					<header className="chatbot-header">
						<div className="chatbot-identity">
							<span className="chatbot-avatar contacto-avatar" aria-hidden="true">EC</span>
							<div>
								<strong>Encargado del club</strong>
								<span>Contacto del club</span>
							</div>
						</div>
					</header>

					<div className="chatbot-guide">
						<div className="chatbot-guide-copy">
							<span>Conversación directa</span>
							<strong>¿Qué necesitas consultar?</strong>
						</div>
						<p>Los mensajes de este prototipo se muestran solo en esta pantalla.</p>
					</div>

					<div className="chatbot-messages" aria-live="polite">
						{mensajes.map((mensaje) => (
							<div className={`chatbot-message ${mensaje.tipo}`} key={mensaje.id}>
								{mensaje.texto}
							</div>
						))}
					</div>

					<form className="chatbot-form" onSubmit={enviarMensaje}>
						<input
							type="text"
							aria-label="Escribe un mensaje"
							placeholder="Escribe un mensaje..."
							value={texto}
							onChange={(evento) => setTexto(evento.target.value)}
						/>
						<button type="submit" aria-label="Enviar mensaje" disabled={!texto.trim()}>
							<span aria-hidden="true">➤</span>
						</button>
					</form>
				</section>
			</section>
		</main>
	);
}
