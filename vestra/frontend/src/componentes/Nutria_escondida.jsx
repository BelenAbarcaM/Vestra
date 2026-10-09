import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Nutria_escondida.css";
import nutria from "../assets/Vestra.png";

const INTERVALO_REAPARICION = 10 * 60 * 1000;
const DURACION_CAPTURA = 1100;

function obtenerPosicionAleatoria(posicionActual) {
	const x = Math.floor(Math.random() * 31) + 35;
	const y = Math.floor(Math.random() * 41) + 30;

	if (posicionActual && x === posicionActual.x && y === posicionActual.y) {
		return { x: x === 65 ? x - 1 : x + 1, y };
	}

	return {
		x,
		y,
	};
}

export default function NutriaEscondida() {
	const [visible, setVisible] = useState(true);
	const [atrapada, setAtrapada] = useState(false);
	const [posicion, setPosicion] = useState(obtenerPosicionAleatoria);
	const temporizador = useRef(null);
	const temporizadorCaptura = useRef(null);

	const moverNutria = useCallback(() => {
		setPosicion((posicionActual) =>
			obtenerPosicionAleatoria(posicionActual)
		);
		setVisible(true);
	}, []);

	useEffect(() => {
		temporizador.current = window.setTimeout(
			moverNutria,
			INTERVALO_REAPARICION
		);

		return () => window.clearTimeout(temporizador.current);
	}, [moverNutria, posicion, visible]);

	useEffect(
		() => () => window.clearTimeout(temporizadorCaptura.current),
		[]
	);

	const atraparNutria = () => {
		window.clearTimeout(temporizador.current);
		setAtrapada(true);
		temporizadorCaptura.current = window.setTimeout(() => {
			setAtrapada(false);
			setVisible(false);
		}, DURACION_CAPTURA);
	};

	if (!visible) return null;

	return (
		<button
			className={`nutria-escondida${atrapada ? " nutria-escondida-atrapada" : ""}`}
			type="button"
			style={{ left: `${posicion.x}%`, top: `${posicion.y}%` }}
			onClick={atraparNutria}
			aria-label="Esconder la nutria"
			title="¡Encontraste a la nutria!"
		>
			<img src={nutria} alt="" />
			{atrapada && (
				<>
					<span className="nutria-captura-destello nutria-captura-destello-uno" aria-hidden="true">✦</span>
					<span className="nutria-captura-destello nutria-captura-destello-dos" aria-hidden="true">✦</span>
					<span className="nutria-captura-destello nutria-captura-destello-tres" aria-hidden="true">✦</span>
					<span className="nutria-captura-mensaje" aria-hidden="true">¡La atrapaste!</span>
				</>
			)}
		</button>
	);
}