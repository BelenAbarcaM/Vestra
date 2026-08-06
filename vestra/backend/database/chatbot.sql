CREATE TABLE IF NOT EXISTS conversaciones (
  id int unsigned NOT NULL AUTO_INCREMENT,
  usuario_id int unsigned DEFAULT NULL,
  session_token varchar(255) DEFAULT NULL,
  titulo varchar(255) DEFAULT 'Nueva Conversacion',
  fecha_creacion datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_conversaciones_session (session_token),
  KEY idx_conversaciones_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mensajes (
  id int unsigned NOT NULL AUTO_INCREMENT,
  conversacion_id int unsigned NOT NULL,
  remitente enum('user','bot','system') NOT NULL,
  mensaje text NOT NULL,
  fecha_envio datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mensajes_conversacion (conversacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
