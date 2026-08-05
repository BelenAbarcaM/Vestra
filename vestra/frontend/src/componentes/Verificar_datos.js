import React, { useMemo, useRef, useState } from 'react';
import './Verificar_datos.css';
import logo from '../logito.png';

export default function VerificarDatos({
  modo = 'registro',
  correo = 'correo@ejemplo.com',
  codigoInicial = '123456',
  onSuccess,
}) {
  const inputsRef = useRef([]);

  const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [codigoDemo, setCodigoDemo] = useState(codigoInicial);

  const titulo =
    modo === 'recuperacion' ? 'Verificar código' : 'Completar registro';

  const subtitulo =
    modo === 'recuperacion'
      ? `Ingresa el código de 6 cifras enviado a ${correo} para recuperar tu contraseña.`
      : `Ingresa el código de 6 cifras enviado a ${correo} para completar tu registro.`;

  const codigoCompleto = useMemo(() => codigo.join(''), [codigo]);

  const handleChange = (index, value) => {
    const limpio = value.replace(/\D/g, '').slice(0, 1);
    const nuevo = [...codigo];
    nuevo[index] = limpio;
    setCodigo(nuevo);
    setError('');

    if (limpio && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codigo[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const texto = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!texto) return;

    const nuevo = ['', '', '', '', '', ''];
    for (let i = 0; i < texto.length; i += 1) {
      nuevo[i] = texto[i];
    }

    setCodigo(nuevo);
    setError('');
    inputsRef.current[Math.min(texto.length, 5)]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (codigoCompleto.length !== 6) {
      setError('Ingresa las 6 cifras del código.');
      return;
    }

    if (codigoCompleto !== codigoDemo) {
      setError('El código no es correcto.');
      return;
    }

    if (typeof onSuccess === 'function') {
      onSuccess({
        modo,
        correo,
        codigo: codigoCompleto,
      });
      return;
    }

    alert(
      modo === 'recuperacion'
        ? 'Código correcto. Continúa con el cambio de contraseña.'
        : 'Código correcto. Registro completado.'
    );
  };

  const handleReenviar = () => {
    const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoDemo(nuevoCodigo);
    setCodigo(['', '', '', '', '', '']);
    setError('');
    alert(`Código de prueba reenviado: ${nuevoCodigo}`);
    inputsRef.current[0]?.focus();
  };

  return (
    <div className="verificar-contenedor">
      <div className="verificar-tarjeta">
        <img src={require('../vestra.png')} className="Isologo" alt="vestra" />
         <img src={logo} className="App-logo" alt="logo" /> 
        <h1>{titulo}</h1>

        <p className="verificar-subtitulo">{subtitulo}</p>

        <p className="verificar-demo">
          Código de prueba: <strong>{codigoDemo}</strong>
        </p>

        <form className="verificar-formulario" onSubmit={handleSubmit}>
          <div className="verificar-codigo" onPaste={handlePaste}>
            {codigo.map((digito, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digito}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                aria-label={`Dígito ${index + 1}`}
                className="verificar-input"
              />
            ))}
          </div>

          {error ? <p className="verificar-error">{error}</p> : null}

          <button type="submit" className="verificar-boton">
            Verificar código
          </button>
        </form>

        <button
          type="button"
          onClick={handleReenviar}
          className="verificar-link"
        >
          Reenviar código
        </button>
      </div>
    </div>
  );
}