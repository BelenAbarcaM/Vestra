import React, { useState } from "react";
import "./Inicio.css";
import "../fontello/css/fontello.css";
import "./Base_Club.css";
import logito from "../assets/logito.png";
import NutriaEscondida from "./Nutria_escondida";

const initialClub = {
	name: "MATEM",
	creator: "Pablo Alvarado Díaz",
	subtitle: "Matemática para la Enseñanza Media",
	description:
		"Es una iniciativa de extensión universitaria en Costa Rica que permite a estudiantes de secundaria (11° y 12°) cursar cálculo y precálculo para evitar materias universitarias.",
	requirements:
		"Ser estudiante de undécimo o duodécimo año. Tener interés en fortalecer los conocimientos de matemática y asistir a las sesiones del programa.",
};

const initialActivities = [
	{ id: 1, day: "Lunes", time: "5:00 p. m. – 8:30 p. m.", title: "Sesión de Cálculo" },
    { id: 2, day: "Jueves", time: "5:00 p. m. – 7:30 p. m.", title: "Sesión de PRE-cálculo" }
];

function BaseClubModal({ title, onClose, children }) {
	return (
		<div
			className="base-club-modal-backdrop"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<section className="base-club-modal" role="dialog" aria-modal="true" aria-label={title}>
				<div className="base-club-modal-heading">
					<h2>{title}</h2>
					<button type="button" onClick={onClose} aria-label="Cerrar ventana">
						×
					</button>
				</div>
				{children}
			</section>
		</div>
	);
}

export default function BaseClub() {
	const [club, setClub] = useState(initialClub);
	const [activities, setActivities] = useState(initialActivities);
	const [activeModal, setActiveModal] = useState("");
	const [clubDraft, setClubDraft] = useState(initialClub);

	const openEditModal = () => {
		setClubDraft(club);
		setActiveModal("edit");
	};

	const saveClub = (event) => {
		event.preventDefault();
		setClub(clubDraft);
		setActiveModal("");
	};

	return (
		<>
		<NutriaEscondida />
		<div className="base-club-container">
			<main className="base-club-page">
			<section className="base-club-overview">
			<header className="base-club-header">
				<div className="base-club-title-group">
					<h1>{club.name}</h1>
					<p className="base-club-creator">
						<span className="base-club-creator-icon" aria-hidden="true">●</span>
						{club.creator}
					</p>
				</div>
				<button className="base-club-edit" type="button" onClick={openEditModal}>
					Editar <span aria-hidden="true">✎</span>
				</button>
			</header>

			<p className="base-club-subtitle">{club.subtitle}</p>

			<img
				className="base-club-photo"
				src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1100&q=85"
				alt={`Estudiantes en una clase del club ${club.name}`}
				onError={(event) => {
					event.currentTarget.onerror = null;
					event.currentTarget.src = logito;
				}}
			/>
			</section>

			<div className="base-club-details">
				<section className="base-club-section">
					<h2>¿Qué es?</h2>
					<p>{club.description}</p>
				</section>

				<section className="base-club-section">
					<h2>Horario</h2>
					<div className="base-club-schedule">
						<h3>Semanal</h3>
						<div className="base-club-activity-list">
							{activities.map((activity) => (
								<article className="base-club-activity" key={activity.id}>
									<span className="base-club-activity-day">{activity.day}</span>
									<span>{activity.title}</span>
									<span className="base-club-activity-time">{activity.time}</span>
								</article>
							))}
						</div>
					</div>
				</section>

				<section className="base-club-section">
					<h2>Cuota</h2>
					<table className="base-club-fees">
						<tbody>
							<tr><th scope="row">MATEM</th><td>₡20 000</td></tr>
							<tr><th scope="row">PREMATEM</th><td>₡25 000</td></tr>
						</tbody>
					</table>
				</section>

				<section className="base-club-section base-club-requirements">
					<h2>Requisitos</h2>
					<p>{club.requirements}</p>
				</section>
			</div>

			</main>
		</div>
		{activeModal === "edit" && (
			<BaseClubModal title="Editar club" onClose={() => setActiveModal("")}>
				<form className="base-club-form" onSubmit={saveClub}>
					<label>
						Nombre del club
						<input value={clubDraft.name} onChange={(event) => setClubDraft({ ...clubDraft, name: event.target.value })} required />
					</label>
					<label>
						Subtítulo
						<input value={clubDraft.subtitle} onChange={(event) => setClubDraft({ ...clubDraft, subtitle: event.target.value })} required />
					</label>
					<label>
						Descripción
						<textarea rows="3" value={clubDraft.description} onChange={(event) => setClubDraft({ ...clubDraft, description: event.target.value })} required />
					</label>
					<label>
						Requisitos
						<textarea rows="3" value={clubDraft.requirements} onChange={(event) => setClubDraft({ ...clubDraft, requirements: event.target.value })} required />
					</label>
					<button className="base-club-submit" type="submit">Guardar cambios</button>
				</form>
			</BaseClubModal>
		)}
		</>
	);
}
