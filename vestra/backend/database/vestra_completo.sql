-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: vestra
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- Table structure for table `asistencia`
--

DROP TABLE IF EXISTS `asistencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencia` (
  `id_asistencia` int NOT NULL AUTO_INCREMENT,
  `id_evento` int NOT NULL,
  `id_usuario` int unsigned NOT NULL,
  `estado` enum('Presente','Ausente','Justificado') NOT NULL DEFAULT 'Ausente',
  PRIMARY KEY (`id_asistencia`),
  UNIQUE KEY `id_evento` (`id_evento`,`id_usuario`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `asistencia_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `evento_club` (`id_evento`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `asistencia_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencia`
--

LOCK TABLES `asistencia` WRITE;
/*!40000 ALTER TABLE `asistencia` DISABLE KEYS */;
INSERT INTO `asistencia` VALUES (1,1,41,'Ausente'),(2,3,56,'Presente'),(3,3,24,'Presente'),(4,1,27,'Presente'),(5,11,24,'Justificado'),(6,11,56,'Presente'),(8,11,68,'Presente'),(9,11,29,'Presente'),(10,11,31,'Presente'),(11,11,41,'Ausente'),(12,11,37,'Ausente'),(13,11,52,'Presente'),(14,11,63,'Presente'),(15,11,59,'Presente'),(16,11,34,'Justificado'),(17,11,43,'Presente'),(18,11,48,'Presente'),(19,11,27,'Presente'),(20,11,25,'Presente'),(23,3,68,'Presente'),(24,3,29,'Presente'),(25,3,31,'Ausente'),(26,3,52,'Ausente'),(28,3,63,'Ausente'),(29,3,41,'Ausente'),(30,3,43,'Presente'),(31,3,59,'Presente'),(32,3,34,'Presente'),(33,3,37,'Justificado'),(35,3,48,'Justificado'),(36,3,27,'Presente'),(37,3,25,'Ausente');
/*!40000 ALTER TABLE `asistencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_profesor_conversacion`
--

DROP TABLE IF EXISTS `chat_profesor_conversacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_profesor_conversacion` (
  `id_conversacion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_estudiante` int unsigned NOT NULL,
  `id_profesor` int unsigned NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_conversacion`),
  UNIQUE KEY `uq_chat_estudiante_profesor` (`id_estudiante`,`id_profesor`),
  KEY `idx_chat_profesor` (`id_profesor`),
  CONSTRAINT `fk_chat_estudiante` FOREIGN KEY (`id_estudiante`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_chat_profesor` FOREIGN KEY (`id_profesor`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_profesor_conversacion`
--

LOCK TABLES `chat_profesor_conversacion` WRITE;
/*!40000 ALTER TABLE `chat_profesor_conversacion` DISABLE KEYS */;
INSERT INTO `chat_profesor_conversacion` VALUES (1,24,56,'2026-10-12 00:54:38','2026-10-12 00:54:38'),(2,24,72,'2026-10-12 01:11:02','2026-10-12 01:11:24'),(3,24,54,'2026-10-14 02:44:35','2026-10-14 02:44:35'),(4,25,72,'2026-10-14 02:49:58','2026-10-14 02:49:58'),(5,26,72,'2026-10-14 03:00:13','2026-10-14 03:10:07');
/*!40000 ALTER TABLE `chat_profesor_conversacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_profesor_mensaje`
--

DROP TABLE IF EXISTS `chat_profesor_mensaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_profesor_mensaje` (
  `id_mensaje` int unsigned NOT NULL AUTO_INCREMENT,
  `id_conversacion` int unsigned NOT NULL,
  `id_remitente` int unsigned NOT NULL,
  `contenido` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_envio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `leido` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_mensaje`),
  KEY `idx_mensaje_conversacion` (`id_conversacion`,`fecha_envio`),
  KEY `fk_mensaje_remitente` (`id_remitente`),
  CONSTRAINT `fk_mensaje_conversacion` FOREIGN KEY (`id_conversacion`) REFERENCES `chat_profesor_conversacion` (`id_conversacion`) ON DELETE CASCADE,
  CONSTRAINT `fk_mensaje_remitente` FOREIGN KEY (`id_remitente`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_profesor_mensaje`
--

LOCK TABLES `chat_profesor_mensaje` WRITE;
/*!40000 ALTER TABLE `chat_profesor_mensaje` DISABLE KEYS */;
INSERT INTO `chat_profesor_mensaje` VALUES (1,1,24,'Hola profe','2026-10-12 00:54:38',0),(2,2,24,'Hola profe','2026-10-12 01:11:02',1),(3,2,72,'Hola Bel','2026-10-12 01:11:24',1),(4,3,24,'Hola profe, como estro a su club?','2026-10-14 02:44:35',0),(5,4,25,'Hola profe, como me uno al club?','2026-10-14 02:49:58',0),(6,5,26,'Hola profe, como me inscribo en un club?','2026-10-14 03:00:13',1),(7,5,72,'Ve al apartado de inscripciones','2026-10-14 03:10:07',0);
/*!40000 ALTER TABLE `chat_profesor_mensaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `club`
--

DROP TABLE IF EXISTS `club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `club` (
  `id_club` int unsigned NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Foto_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_profesor` int unsigned NOT NULL,
  PRIMARY KEY (`id_club`),
  UNIQUE KEY `Nombre` (`Nombre`),
  KEY `id_profesor` (`id_profesor`),
  CONSTRAINT `club_ibfk_1` FOREIGN KEY (`id_profesor`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `club`
--

LOCK TABLES `club` WRITE;
/*!40000 ALTER TABLE `club` DISABLE KEYS */;
INSERT INTO `club` VALUES (12,'Coro','El coro Urizar Meckler se fundó con el fin de poder brindarle homenaje al Padre Meckler y además darle la posibilidad a los jóvenes que poseen talento o ganas de compartir un pedacito de Dios con los demás.',NULL,57),(13,'Banda CEDES Don Bosco','Banda escolar que busca sacar el potencial de todos los estudiantes que tienen pasión por la música y están comprometidos con trabajar duro por esto que aman.','banda.jpg',61),(14,'F1 in Schools','Programa de Fórmula 1 que permite a los jóvenes explorar un mundo diferente que incluye temas de mecánica y aerodinámica, además de proporcionar diversas oportunidades y desarrollar habilidades.','f1.jpg',72),(15,'Academia de Idiomas','Academia diseñada para potenciar y ayudar al aprendizaje de diversas lenguas e idiomas.','idiomas.jpg',72),(16,'Selección de Fútbol','Selección creada para aquellos jóvenes que tienen una pasión por el deporte y el acondicionamiento físico. Busca desarrollar el trabajo en equipo y el compañerismo.','futbol.jpg',63),(17,'CEDES Radio','Creada con el fin de difundir información por diversos medios sobre el colegio. Está abierta a los estudiantes para que desarrollen habilidades que pueden llegar a ser de utilidad, además de explorar los campos que son de su interés.','radio.jpg',56),(18,'MATEM','Curso universitario de Pre-cálculo y Cálculo a grado universitario. Este curso se abrió con el fin de brindar apoyo a los jóvenes del colegio que buscan más posibilidades o desean desarrollar más habilidades.','matem.jpeg',59),(19,'Actividades CEDES','Lista de actividades que no pertenecen a un club en especifico del colegio, sin embargo, forman parte de la institución.','actividades.jpg',53),(20,'Club de Tecnología e Innovación','Espacio para estudiantes interesados en programación, tecnología, robótica e innovación.','6acee8beafb2a_images (2).jpg',72),(21,'Club de ciencias','Ceincias cool wao','6acee7cf342d2_Ciencia.jpg',72),(25,'Cisco','Networking','6acee7a99d07f_Cisco_logo_blue_2016.svg.webp',72),(26,'Monaguillos','Grupo de servicio y formación que participa en celebraciones y actividades de apoyo de la comunidad educativa.','6aceeb7c44ea4_images (5).jpg',72),(27,'Pastoral','Espacio de encuentro, reflexión y servicio que promueve la solidaridad, los valores y la convivencia.','6aceebc1d05a0_images (7).jpg',72),(29,'ClubHouse','Club de convivencia y actividades recreativas para compartir intereses, desarrollar habilidades y colaborar en equipo.','6acee8edc4e6c_portadaaniversario.jpg',72),(31,'SACA','Club de aprendizaje práctico sobre automatización, herramientas digitales, lógica y creación de soluciones tecnológicas.','6acee75254aa7_images.jpg',72),(32,'Academia de Diseño Digital','Espacio para explorar diseño gráfico y digital, composición visual, prototipos y proyectos creativos.','6acee77ceb10b_diseno-digital.jpg',72),(33,'Confirmación','Grupo de formación y convivencia que desarrolla actividades de reflexión, servicio y crecimiento personal.','6acee90d136f7_images (3).jpg',72),(34,'Oratorio','Espacio recreativo y formativo con juegos, actividades grupales y proyectos para fortalecer la convivencia.','6aceeba21e174_images (6).jpg',72),(41,'Club de informatica','Club para programar','82610af771245d2518999b2db13f6a2f.jpg',72);
/*!40000 ALTER TABLE `club` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentario`
--

DROP TABLE IF EXISTS `comentario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentario` (
  `id_Comentario` int unsigned NOT NULL AUTO_INCREMENT,
  `texto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` int unsigned NOT NULL,
  `id_publicacion` int unsigned NOT NULL,
  `estado` enum('Visible','Rechazado','Pendiente','Eliminado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_Comentario`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_publicacion` (`id_publicacion`),
  CONSTRAINT `comentario_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `comentario_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicacion` (`id_publicacion`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentario`
--

LOCK TABLES `comentario` WRITE;
/*!40000 ALTER TABLE `comentario` DISABLE KEYS */;
INSERT INTO `comentario` VALUES (14,'Está buenísima esta publicación ?','2026-08-10 21:39:14',63,4,'Visible'),(15,'Me gusta mucho la idea, quedó genial.','2026-08-10 21:39:14',30,4,'Visible'),(16,'Esto definitivamente había que compartirlo.','2026-08-10 21:39:14',24,4,'Visible'),(17,'Qué buen contenido ?','2026-08-10 21:39:14',56,4,'Visible'),(18,'No sabía esto, gracias por compartirlo.','2026-08-10 21:39:14',26,5,'Visible'),(19,'Está bastante interesante ?','2026-08-10 21:39:14',63,5,'Visible'),(20,'Me parece una excelente iniciativa.','2026-08-10 21:39:14',56,5,'Visible'),(21,'Muy buena publicación.','2026-08-10 21:39:14',28,5,'Visible'),(22,'Esto quedó demasiado bien ?','2026-08-10 21:39:14',29,6,'Visible'),(23,'Me encanta este tipo de contenido.','2026-08-10 21:39:14',42,6,'Visible'),(24,'Buen aporte para el club.','2026-08-10 21:39:14',52,6,'Visible'),(25,'¿Cuándo hacen otra actividad así?','2026-08-10 21:39:14',44,6,'Visible'),(26,'WOW','2026-08-10 23:33:47',44,4,'Visible'),(27,'Me encanta','2026-08-11 14:54:03',68,6,'Visible'),(28,'Que lindo','2026-08-11 19:37:29',70,4,'Visible'),(29,'Hola que lindo','2026-10-13 20:43:42',24,4,'Visible'),(30,'Hola que lindo','2026-10-13 20:43:45',24,4,'Visible'),(31,'Hola, que interesate','2026-10-13 20:49:27',25,5,'Visible'),(32,'Hola que chiva','2026-10-13 20:59:26',26,4,'Visible'),(33,'que linda la banda','2026-10-13 21:09:14',72,4,'Visible'),(34,'Vengan todos los interesados','2026-10-13 21:09:52',72,11,'Visible');
/*!40000 ALTER TABLE `comentario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversaciones`
--

DROP TABLE IF EXISTS `conversaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversaciones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned DEFAULT NULL,
  `session_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titulo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nueva Conversacion',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversaciones_session` (`session_token`),
  KEY `idx_conversaciones_usuario` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversaciones`
--

LOCK TABLES `conversaciones` WRITE;
/*!40000 ALTER TABLE `conversaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuota_club`
--

DROP TABLE IF EXISTS `cuota_club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuota_club` (
  `id_cuota` int unsigned NOT NULL AUTO_INCREMENT,
  `id_club` int unsigned NOT NULL,
  `curso` varchar(50) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_cuota`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `cuota_club_ibfk_1` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuota_club`
--

LOCK TABLES `cuota_club` WRITE;
/*!40000 ALTER TABLE `cuota_club` DISABLE KEYS */;
INSERT INTO `cuota_club` VALUES (3,18,'MATEM',20000.00),(4,18,'PREMATEM',25000.00),(13,15,'Cuaderno de práctica',2000.00),(14,15,'Material didáctico',3500.00),(42,32,'Recursos digitales',2500.00),(43,32,'Materiales de diseño',4000.00),(44,21,'Costo',5000.00),(45,20,'Mensualidad',5000.00),(46,20,'Inscripción',2500.00),(47,20,'Materiales',3000.00),(48,29,'Actividades',1500.00),(49,29,'Mensualidad de prueba',3000.00),(50,33,'Convivencia',5000.00),(51,33,'Material de formación',2500.00),(52,26,'Actividades especiales',3000.00),(53,26,'Materiales',2500.00),(54,34,'Actividades especiales',3000.00),(55,34,'Materiales recreativos',2000.00),(56,27,'Convivencias',5000.00),(57,27,'Materiales',2000.00),(58,41,'Mensualidad',3000.00),(59,31,'Proyecto de práctica',3000.00),(60,31,'Materiales tecnológicos',5000.00);
/*!40000 ALTER TABLE `cuota_club` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evento`
--

DROP TABLE IF EXISTS `evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento` (
  `id_evento` int unsigned NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL,
  `lugar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_club` int unsigned NOT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `evento_ibfk_1` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento`
--

LOCK TABLES `evento` WRITE;
/*!40000 ALTER TABLE `evento` DISABLE KEYS */;
/*!40000 ALTER TABLE `evento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evento_club`
--

DROP TABLE IF EXISTS `evento_club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento_club` (
  `id_evento` int NOT NULL AUTO_INCREMENT,
  `id_club` int unsigned NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text,
  `fecha` date NOT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_fin` time DEFAULT NULL,
  `tipo` enum('Reunion','Entrenamiento','Competencia','Actividad','Presentacion','Otro') DEFAULT 'Reunion',
  PRIMARY KEY (`id_evento`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `evento_club_ibfk_1` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento_club`
--

LOCK TABLES `evento_club` WRITE;
/*!40000 ALTER TABLE `evento_club` DISABLE KEYS */;
INSERT INTO `evento_club` VALUES (1,20,'Reunión de bienvenida','Presentación del club y explicación de las actividades del año.','2026-09-28','14:30:00','15:30:00','Reunion'),(2,20,'Taller de programación','Taller introductorio de programación para los integrantes.','2026-10-02','14:00:00','16:00:00','Entrenamiento'),(3,20,'Competencia de programación','Competencia interna de resolución de problemas.','2026-10-10','09:00:00','12:00:00','Competencia'),(4,20,'Feria de innovación','Presentación de proyectos desarrollados por los integrantes.','2026-10-24','13:00:00','16:00:00','Presentacion'),(5,20,'Actividad de integración','Actividad para fortalecer la convivencia entre los integrantes.','2026-11-07','14:00:00','15:30:00','Actividad'),(7,20,'Clase de lunes','Sesión regular de lunes.','2026-09-07','16:00:00','00:00:00','Entrenamiento'),(8,20,'Clase de lunes','Sesión regular de lunes.','2026-09-14','16:00:00','00:00:00','Entrenamiento'),(9,20,'Clase de lunes','Sesión regular de lunes.','2026-09-21','16:00:00','00:00:00','Entrenamiento'),(10,20,'Clase de lunes','Sesión regular de lunes.','2026-09-28','16:00:00','00:00:00','Entrenamiento'),(11,20,'Examen de programación','Examen mega dificil','2026-09-07','15:00:00','17:00:00','Reunion'),(12,20,'Examen de programación','Estudiar bien','2026-10-04','21:12:00','22:12:00','Actividad');
/*!40000 ALTER TABLE `evento_club` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorito`
--

DROP TABLE IF EXISTS `favorito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorito` (
  `id_favorito` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `id_publicacion` int unsigned NOT NULL,
  PRIMARY KEY (`id_favorito`),
  UNIQUE KEY `id_usuario` (`id_usuario`,`id_publicacion`),
  KEY `id_publicacion` (`id_publicacion`),
  CONSTRAINT `favorito_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `favorito_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicacion` (`id_publicacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorito`
--

LOCK TABLES `favorito` WRITE;
/*!40000 ALTER TABLE `favorito` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foro`
--

DROP TABLE IF EXISTS `foro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foro` (
  `id_foro` int unsigned NOT NULL AUTO_INCREMENT,
  `id_club` int unsigned NOT NULL,
  PRIMARY KEY (`id_foro`),
  UNIQUE KEY `uk_foro_club` (`id_club`),
  CONSTRAINT `fk_foro_club` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foro`
--

LOCK TABLES `foro` WRITE;
/*!40000 ALTER TABLE `foro` DISABLE KEYS */;
INSERT INTO `foro` VALUES (3,12),(5,13),(7,14),(8,15),(6,16),(2,17),(4,18),(1,19),(9,20),(10,21),(12,25),(13,26),(14,27),(16,29),(18,31),(19,32),(20,33),(21,34),(32,41);
/*!40000 ALTER TABLE `foro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foro_publicacion`
--

DROP TABLE IF EXISTS `foro_publicacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foro_publicacion` (
  `id_publicacion` int NOT NULL AUTO_INCREMENT,
  `id_foro` int NOT NULL,
  `id_usuario` int NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `categoria` enum('General','Eventos','Preguntas','Logros') NOT NULL DEFAULT 'General',
  `texto` varchar(1000) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_publicacion`),
  KEY `idx_publicacion_foro` (`id_foro`),
  KEY `idx_publicacion_usuario` (`id_usuario`),
  KEY `idx_publicacion_fecha` (`fecha_creacion`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foro_publicacion`
--

LOCK TABLES `foro_publicacion` WRITE;
/*!40000 ALTER TABLE `foro_publicacion` DISABLE KEYS */;
INSERT INTO `foro_publicacion` VALUES (1,18,24,'Ayudenme a elegir','General','Estoy pensando si entrar o no a SACA, quiero opiniones de gente que este en el club o que haya estado.','2026-10-14 02:14:07'),(2,18,24,'Hoy hay competencia','Eventos','apoyenos en la competencia plis','2026-10-14 02:45:14'),(3,18,25,'Quiero unirme a SACA','Preguntas','Ayudenme a decidir si hacerlo','2026-10-14 02:50:46'),(4,18,26,'Amo SACA','General','Si tienen la oportunidad de estrar, haganlooo','2026-10-14 03:01:22');
/*!40000 ALTER TABLE `foro_publicacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foro_publicacion_like`
--

DROP TABLE IF EXISTS `foro_publicacion_like`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foro_publicacion_like` (
  `id_publicacion` int NOT NULL,
  `id_usuario` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_publicacion`,`id_usuario`),
  KEY `idx_like_usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foro_publicacion_like`
--

LOCK TABLES `foro_publicacion_like` WRITE;
/*!40000 ALTER TABLE `foro_publicacion_like` DISABLE KEYS */;
INSERT INTO `foro_publicacion_like` VALUES (1,24,'2026-10-14 02:14:12'),(1,25,'2026-10-14 02:50:23'),(2,24,'2026-10-14 02:45:16'),(3,25,'2026-10-14 02:50:49'),(3,26,'2026-10-14 03:00:52'),(4,26,'2026-10-14 03:01:24');
/*!40000 ALTER TABLE `foro_publicacion_like` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `foro_publicacion_reaccion`
--

DROP TABLE IF EXISTS `foro_publicacion_reaccion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foro_publicacion_reaccion` (
  `id_publicacion` int NOT NULL,
  `id_usuario` int NOT NULL,
  `reaccion` enum('util','interesante','gracioso') NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_publicacion`,`id_usuario`),
  KEY `idx_reaccion_usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `foro_publicacion_reaccion`
--

LOCK TABLES `foro_publicacion_reaccion` WRITE;
/*!40000 ALTER TABLE `foro_publicacion_reaccion` DISABLE KEYS */;
INSERT INTO `foro_publicacion_reaccion` VALUES (1,24,'gracioso','2026-10-14 02:14:25'),(2,24,'interesante','2026-10-14 02:45:18'),(2,25,'interesante','2026-10-14 02:50:21'),(3,26,'interesante','2026-10-14 03:00:55');
/*!40000 ALTER TABLE `foro_publicacion_reaccion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horario_club`
--

DROP TABLE IF EXISTS `horario_club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horario_club` (
  `id_horario` int unsigned NOT NULL AUTO_INCREMENT,
  `id_club` int unsigned NOT NULL,
  `dia` varchar(20) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  PRIMARY KEY (`id_horario`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `horario_club_ibfk_1` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horario_club`
--

LOCK TABLES `horario_club` WRITE;
/*!40000 ALTER TABLE `horario_club` DISABLE KEYS */;
INSERT INTO `horario_club` VALUES (2,18,'Lunes','17:00:00','20:30:00'),(3,18,'Jueves','17:00:00','20:30:00'),(15,15,'Jueves','14:00:00','15:30:00'),(16,15,'Lunes','14:00:00','15:30:00'),(44,32,'Miércoles','14:00:00','16:00:00'),(45,32,'Lunes','14:00:00','16:00:00'),(46,25,'Martes','18:07:00','19:06:00'),(47,21,'Martes','17:00:00','20:00:00'),(48,20,'Lunes','14:00:00','15:30:00'),(49,20,'Miércoles','14:00:00','15:30:00'),(50,20,'Viernes','13:30:00','15:00:00'),(51,29,'Viernes','13:30:00','15:00:00'),(52,29,'Martes','14:00:00','15:30:00'),(53,33,'Jueves','14:00:00','15:30:00'),(54,33,'Martes','14:00:00','15:30:00'),(55,26,'Miércoles','14:00:00','15:30:00'),(56,34,'Viernes','13:30:00','15:00:00'),(57,34,'Miércoles','13:30:00','15:00:00'),(58,27,'Jueves','14:00:00','15:30:00'),(59,27,'Martes','14:00:00','15:30:00'),(60,41,'Martes','19:10:00','21:10:00'),(61,31,'Jueves','14:00:00','16:00:00'),(62,31,'Martes','14:00:00','16:00:00');
/*!40000 ALTER TABLE `horario_club` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripcion`
--

DROP TABLE IF EXISTS `inscripcion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripcion` (
  `id_inscripcion` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `id_club` int unsigned NOT NULL,
  `fecha_ingreso` datetime DEFAULT CURRENT_TIMESTAMP,
  `anio_ingreso` int DEFAULT NULL,
  PRIMARY KEY (`id_inscripcion`),
  UNIQUE KEY `id_usuario` (`id_usuario`,`id_club`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `inscripcion_ibfk_1` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`),
  CONSTRAINT `inscripcion_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripcion`
--

LOCK TABLES `inscripcion` WRITE;
/*!40000 ALTER TABLE `inscripcion` DISABLE KEYS */;
INSERT INTO `inscripcion` VALUES (1,27,20,'2026-09-10 00:00:00',2026),(2,34,20,'2026-09-12 00:00:00',2026),(3,41,20,'2026-09-15 00:00:00',2026),(4,56,20,'2026-09-18 00:00:00',2026),(5,68,20,'2026-09-20 00:00:00',2026),(6,24,20,'2026-09-25 00:00:00',2026),(7,25,20,'2026-06-10 00:00:00',2026),(8,29,20,'2026-06-18 00:00:00',2026),(9,31,20,'2026-07-05 00:00:00',2026),(10,37,20,'2026-07-22 00:00:00',2026),(11,43,20,'2026-08-03 00:00:00',2026),(12,48,20,'2026-08-17 00:00:00',2026),(13,52,20,'2026-09-02 00:00:00',2026),(14,59,20,'2026-09-14 00:00:00',2026),(15,63,20,'2026-09-21 00:00:00',2026),(17,24,18,'2026-10-11 00:00:00',2026),(18,24,21,'2026-10-11 00:00:00',2026),(19,24,32,'2026-10-11 00:00:00',2026),(20,24,31,'2025-03-11 00:00:00',2025),(21,26,31,'2024-07-18 00:00:00',2024);
/*!40000 ALTER TABLE `inscripcion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insignia`
--

DROP TABLE IF EXISTS `insignia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insignia` (
  `id_insignia` int unsigned NOT NULL AUTO_INCREMENT,
  `id_profe` int unsigned NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('Pendiente','Rechazado','Aprobado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_aprobado` datetime DEFAULT NULL,
  `id_club` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id_insignia`),
  KEY `id_profe` (`id_profe`),
  KEY `fk_insignia_club` (`id_club`),
  CONSTRAINT `fk_insignia_club` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`),
  CONSTRAINT `insignia_ibfk_1` FOREIGN KEY (`id_profe`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insignia`
--

LOCK TABLES `insignia` WRITE;
/*!40000 ALTER TABLE `insignia` DISABLE KEYS */;
INSERT INTO `insignia` VALUES (1,59,'MATEM','Insignia de pertenencia a MATEM','uploads/Insignias/MATEM.png','Aprobado',NULL,18),(2,72,'Banda','Insignia de Banda.','uploads/Insignias/Banda.png','Aprobado','2026-10-11 17:29:23',13),(3,72,'CEDESRadio','Insignia de CEDES Radio.','uploads/Insignias/CEDESRadio.png','Aprobado','2026-10-11 17:29:23',17),(4,72,'Cisco','Insignia de Cisco.','uploads/Insignias/Cisco.png','Aprobado','2026-10-11 17:29:23',25),(5,72,'ClubHouse','Insignia de ClubHouse.','uploads/Insignias/ClubHouse.png','Aprobado','2026-10-11 17:29:23',29),(6,72,'Confirmacion','Insignia de Confirmación.','uploads/Insignias/Confirmacion.png','Aprobado','2026-10-11 17:29:23',33),(7,72,'Coro','Insignia de Coro.','uploads/Insignias/Coro.png','Aprobado','2026-10-11 17:29:23',12),(8,72,'Diseño','Insignia de Diseño Digital.','uploads/Insignias/Diseño.png','Aprobado','2026-10-11 17:29:23',32),(9,72,'F1','Insignia de F1.','uploads/Insignias/F1.png','Aprobado','2026-10-11 17:29:23',14),(10,72,'Futbol','Insignia de Fútbol.','uploads/Insignias/Futbol.png','Aprobado','2026-10-11 17:29:23',16),(11,72,'Idiomas','Insignia de Idiomas.','uploads/Insignias/Idiomas.png','Aprobado','2026-10-11 17:29:23',15),(12,72,'Monaguillos','Insignia de Monaguillos.','uploads/Insignias/Monaguillos.png','Aprobado','2026-10-11 17:29:23',26),(13,72,'Oratorio','Insignia de Oratorio.','uploads/Insignias/Oratorio.png','Aprobado','2026-10-11 17:29:23',34),(14,72,'Pastoral','Insignia de Pastoral.','uploads/Insignias/Pastoral.png','Aprobado','2026-10-11 17:29:23',27),(15,72,'SACA','Insignia de Automatización Digital.','uploads/Insignias/SACA.png','Aprobado','2026-10-11 17:29:23',31),(17,72,'MIEMBRO MAS PRO','POR SER PRO','uploads/insignias/fb26df282f6801e17720a55e63c90fa2.png','Aprobado','2026-10-11 17:57:51',20),(18,72,'Insignia de perseveracncia','Por tener años en el club','uploads/insignias/df9d641e800c949a2acf7f157b539cfd.png','Aprobado','2026-10-13 21:14:07',20);
/*!40000 ALTER TABLE `insignia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likecomentario`
--

DROP TABLE IF EXISTS `likecomentario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likecomentario` (
  `id_likes` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `id_comentario` int unsigned NOT NULL,
  PRIMARY KEY (`id_likes`),
  UNIQUE KEY `unique_like_comentario` (`id_usuario`,`id_comentario`),
  KEY `fk_likecomentario_comentario` (`id_comentario`),
  CONSTRAINT `fk_likecomentario_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `comentario` (`id_Comentario`),
  CONSTRAINT `fk_likecomentario_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likecomentario`
--

LOCK TABLES `likecomentario` WRITE;
/*!40000 ALTER TABLE `likecomentario` DISABLE KEYS */;
INSERT INTO `likecomentario` VALUES (5,24,14),(53,24,18),(13,25,17),(55,25,20),(54,25,31),(58,26,17),(23,26,19),(57,26,30),(56,26,32),(7,27,15),(31,28,21),(14,29,17),(44,29,25),(36,30,23),(20,31,18),(29,32,20),(8,33,15),(45,33,25),(15,34,17),(24,35,19),(37,36,23),(41,37,24),(12,38,16),(32,39,21),(25,40,19),(46,40,25),(9,41,15),(16,42,17),(38,43,23),(4,44,19),(3,44,20),(35,44,22),(6,45,14),(42,46,24),(21,47,18),(47,47,25),(26,48,19),(17,49,17),(33,50,21),(48,51,25),(10,52,15),(39,53,23),(27,54,19),(43,55,24),(18,56,17),(30,57,20),(22,58,18),(49,58,25),(40,59,23),(11,60,15),(28,61,19),(34,62,21),(19,63,17),(50,63,25),(51,68,25),(52,70,17),(59,72,33),(60,72,34);
/*!40000 ALTER TABLE `likecomentario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likepublicacion`
--

DROP TABLE IF EXISTS `likepublicacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likepublicacion` (
  `id_likes` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `id_publicacion` int unsigned NOT NULL,
  PRIMARY KEY (`id_likes`),
  UNIQUE KEY `id_usuario` (`id_usuario`,`id_publicacion`),
  UNIQUE KEY `unique_like` (`id_usuario`,`id_publicacion`),
  KEY `id_publicacion` (`id_publicacion`),
  CONSTRAINT `likepublicacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `likepublicacion_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicacion` (`id_publicacion`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likepublicacion`
--

LOCK TABLES `likepublicacion` WRITE;
/*!40000 ALTER TABLE `likepublicacion` DISABLE KEYS */;
INSERT INTO `likepublicacion` VALUES (42,24,4),(107,24,5),(108,25,5),(110,26,4),(109,26,5),(58,26,6),(43,27,4),(69,28,5),(51,29,5),(59,30,6),(44,31,4),(70,31,5),(60,33,6),(52,34,5),(45,36,4),(67,37,4),(53,38,5),(71,39,5),(61,39,6),(57,41,5),(76,41,6),(46,42,4),(72,43,5),(100,44,4),(101,44,6),(62,45,6),(73,47,5),(47,48,4),(77,48,6),(63,50,6),(54,51,5),(68,52,4),(64,54,6),(48,55,4),(78,55,6),(74,56,5),(55,57,5),(65,59,6),(75,60,5),(49,61,4),(66,62,6),(56,63,5),(102,68,4),(103,68,6),(104,70,4),(105,70,6),(106,72,4),(111,72,5),(112,72,11);
/*!40000 ALTER TABLE `likepublicacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensaje`
--

DROP TABLE IF EXISTS `mensaje`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensaje` (
  `id_Mensaje` int unsigned NOT NULL AUTO_INCREMENT,
  `texto` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_emisor` int unsigned NOT NULL,
  `id_receptor` int unsigned NOT NULL,
  PRIMARY KEY (`id_Mensaje`),
  KEY `id_emisor` (`id_emisor`),
  KEY `id_receptor` (`id_receptor`),
  CONSTRAINT `mensaje_ibfk_1` FOREIGN KEY (`id_emisor`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `mensaje_ibfk_2` FOREIGN KEY (`id_receptor`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensaje`
--

LOCK TABLES `mensaje` WRITE;
/*!40000 ALTER TABLE `mensaje` DISABLE KEYS */;
/*!40000 ALTER TABLE `mensaje` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensaje_foro`
--

DROP TABLE IF EXISTS `mensaje_foro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensaje_foro` (
  `id_mensaje` int unsigned NOT NULL AUTO_INCREMENT,
  `id_foro` int unsigned NOT NULL,
  `id_usuario` int unsigned NOT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_envio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensaje`),
  KEY `idx_mensaje_foro_fecha` (`id_foro`,`fecha_envio`,`id_mensaje`),
  KEY `idx_mensaje_foro_usuario` (`id_usuario`),
  CONSTRAINT `fk_mensaje_foro_foro` FOREIGN KEY (`id_foro`) REFERENCES `foro` (`id_foro`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mensaje_foro_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensaje_foro`
--

LOCK TABLES `mensaje_foro` WRITE;
/*!40000 ALTER TABLE `mensaje_foro` DISABLE KEYS */;
INSERT INTO `mensaje_foro` VALUES (1,18,24,'Hola chavales','2026-10-11 20:35:22');
/*!40000 ALTER TABLE `mensaje_foro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensajes`
--

DROP TABLE IF EXISTS `mensajes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mensajes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `conversacion_id` int unsigned NOT NULL,
  `remitente` enum('user','bot','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_envio` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mensajes_conversacion` (`conversacion_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mensajes`
--

LOCK TABLES `mensajes` WRITE;
/*!40000 ALTER TABLE `mensajes` DISABLE KEYS */;
INSERT INTO `mensajes` VALUES (5,1,'user','Que es Vestra?','2026-08-10 22:56:01'),(6,1,'bot','Vestra significa Via Estudiantil Salesiana. Es una red social escolar pensada para CEDES Don Bosco, donde estudiantes y profesores pueden centralizar publicaciones, clubes, eventos, comentarios e informacion importante.','2026-08-10 22:56:01'),(7,1,'user','Que clubes hay?','2026-08-10 23:36:54'),(8,1,'bot','En Vestra puedes revisar clubes e inscripciones. Clubes registrados: Academia de Idiomas: Academia diseñada para potenciar y ayudar al aprendizaje de diversas lenguas e idiomas. | Actividades CEDES: Lista de actividades que no pertenecen a un club en especifico del colegio, sin embargo... | Banda CEDES Don Bosco: Banda escolar que busca sacar el potencial de todos los estudiantes que tienen pasión p... | CEDES Radio: Creada con el fin de difundir información por diversos medios sobre el colegio. Está ab... | Coro: El coro Urizar Meckler se fundó con el fin de poder brindarle homenaje al Padre Meckler... | F1 in Schools: Programa de Fórmula 1 que permite a los jóvenes explorar un mundo diferente que incluye... | MATEM: Curso universitario de Pre-cálculo y Cálculo a grado universitario. Este curso se abrió... | Selección de Fútbol: Selección creada para aquellos jóvenes que tienen una pasión por el deporte y el acondi...','2026-08-10 23:36:54'),(9,1,'user','Que clubes hay?','2026-08-11 09:20:07'),(10,1,'bot','En Vestra puedes revisar clubes e inscripciones. Clubes registrados: Academia de Idiomas: Academia diseñada para potenciar y ayudar al aprendizaje de diversas lenguas e idiomas. | Actividades CEDES: Lista de actividades que no pertenecen a un club en especifico del colegio, sin embargo... | Banda CEDES Don Bosco: Banda escolar que busca sacar el potencial de todos los estudiantes que tienen pasión p... | CEDES Radio: Creada con el fin de difundir información por diversos medios sobre el colegio. Está ab... | Coro: El coro Urizar Meckler se fundó con el fin de poder brindarle homenaje al Padre Meckler... | F1 in Schools: Programa de Fórmula 1 que permite a los jóvenes explorar un mundo diferente que incluye... | MATEM: Curso universitario de Pre-cálculo y Cálculo a grado universitario. Este curso se abrió... | Selección de Fútbol: Selección creada para aquellos jóvenes que tienen una pasión por el deporte y el acondi...','2026-08-11 09:20:07'),(11,1,'user','Que es Vestra?','2026-08-11 14:30:07'),(12,1,'bot','Vestra significa Via Estudiantil Salesiana. Es una red social escolar pensada para CEDES Don Bosco, donde estudiantes y profesores pueden centralizar publicaciones, clubes, eventos, comentarios e informacion importante.','2026-08-11 14:30:07'),(13,1,'user','Que es Vestra?','2026-08-11 14:53:51'),(14,1,'bot','Vestra significa Via Estudiantil Salesiana. Es una red social escolar pensada para CEDES Don Bosco, donde estudiantes y profesores pueden centralizar publicaciones, clubes, eventos, comentarios e informacion importante.','2026-08-11 14:53:51'),(15,1,'user','Que es Vestra?','2026-08-11 19:37:58'),(16,1,'bot','Vestra significa Via Estudiantil Salesiana. Es una red social escolar pensada para CEDES Don Bosco, donde estudiantes y profesores pueden centralizar publicaciones, clubes, eventos, comentarios e informacion importante.','2026-08-11 19:37:58'),(17,1,'user','que es vestra?','2026-10-13 20:43:57'),(18,1,'bot','Vestra significa Via Estudiantil Salesiana. Es una red social escolar pensada para CEDES Don Bosco, donde estudiantes y profesores pueden centralizar publicaciones, clubes, eventos, comentarios e informacion importante.','2026-10-13 20:43:57'),(19,1,'user','que es SACA?','2026-10-13 20:44:11'),(20,1,'bot','Puedo ayudarte con gusto, pero solo con temas relacionados con Vestra: clubes, inscripciones, publicaciones, eventos, objetivos del proyecto, CEDES Don Bosco y funcionamiento de la plataforma.','2026-10-13 20:44:11'),(21,1,'user','¿Qué es Vestra?','2026-10-13 20:49:37'),(22,1,'bot','Vestra significa Via Estudiantil Salesiana. Es una red social escolar pensada para CEDES Don Bosco, donde estudiantes y profesores pueden centralizar publicaciones, clubes, eventos, comentarios e informacion importante.','2026-10-13 20:49:37'),(23,1,'user','¿Cómo me inscribo a un club?','2026-10-13 20:59:37'),(24,1,'bot','En Vestra puedes revisar clubes e inscripciones. Clubes registrados: Academia de Automatización Digital (SACA): Club de aprendizaje práctico sobre automatización, herramientas digitales, lógica y cre... | Academia de Diseño Digital: Espacio para explorar diseño gráfico y digital, composición visual, prototipos y proyec... | Academia de Idiomas: Academia diseñada para potenciar y ayudar al aprendizaje de diversas lenguas e idiomas. | Actividades CEDES: Lista de actividades que no pertenecen a un club en especifico del colegio, sin embargo... | Banda CEDES Don Bosco: Banda escolar que busca sacar el potencial de todos los estudiantes que tienen pasión p... | CEDES Radio: Creada con el fin de difundir información por diversos medios sobre el colegio. Está ab... | Cisco: Networking | Club de ciencias: Ceincias cool wao','2026-10-13 20:59:37'),(25,1,'user','que es un tomate?','2026-10-13 20:59:55'),(26,1,'bot','Puedo ayudarte con gusto, pero solo con temas relacionados con Vestra: clubes, inscripciones, publicaciones, eventos, objetivos del proyecto, CEDES Don Bosco y funcionamiento de la plataforma.','2026-10-13 20:59:55');
/*!40000 ALTER TABLE `mensajes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `id_noti` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `texto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `leido` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_noti`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `notificacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nutria_captura_diaria`
--

DROP TABLE IF EXISTS `nutria_captura_diaria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nutria_captura_diaria` (
  `id_captura` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `fecha_captura` date NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_captura`),
  UNIQUE KEY `uq_nutria_usuario_fecha` (`id_usuario`,`fecha_captura`),
  CONSTRAINT `fk_nutria_captura_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nutria_captura_diaria`
--

LOCK TABLES `nutria_captura_diaria` WRITE;
/*!40000 ALTER TABLE `nutria_captura_diaria` DISABLE KEYS */;
INSERT INTO `nutria_captura_diaria` VALUES (1,72,'2026-10-11','2026-10-11 16:44:52'),(2,24,'2026-10-11','2026-10-11 18:09:14'),(3,70,'2026-10-11','2026-10-11 19:48:47'),(4,24,'2026-10-13','2026-10-13 20:44:16'),(5,25,'2026-10-13','2026-10-13 20:49:06'),(6,26,'2026-10-13','2026-10-13 21:00:46'),(7,72,'2026-10-13','2026-10-13 21:03:51');
/*!40000 ALTER TABLE `nutria_captura_diaria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preguntatest`
--

DROP TABLE IF EXISTS `preguntatest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preguntatest` (
  `id_pregunta` int unsigned NOT NULL AUTO_INCREMENT,
  `texto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_pregunta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preguntatest`
--

LOCK TABLES `preguntatest` WRITE;
/*!40000 ALTER TABLE `preguntatest` DISABLE KEYS */;
/*!40000 ALTER TABLE `preguntatest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `propuesta_club`
--

DROP TABLE IF EXISTS `propuesta_club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `propuesta_club` (
  `id_propuesta` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre_encargado` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_club` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `horario` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cuota` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requisitos` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estado` enum('Pendiente','Aprobada','Rechazada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_propuesta`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `propuesta_club`
--

LOCK TABLES `propuesta_club` WRITE;
/*!40000 ALTER TABLE `propuesta_club` DISABLE KEYS */;
INSERT INTO `propuesta_club` VALUES (1,'Belén Abarca','belxjsz@gmail.com','Danza','Un club donde a quien le guste bailar pueda ir y disfrutar en compañía mientras aprende cosas nuevas. Útil para presentarse en actos.','Miércoles 5:00p.m','2000','Ser estudiante de CEDES Don Bosco','Pendiente','2026-08-10 22:09:59'),(2,'Belén Abarca','belxjsz@gmail.com','Danza','Baile pro','Miércoles 5:00p.m','2000','Estudiar','Pendiente','2026-08-10 23:12:29'),(3,'Belén Abarca','belxjsz@gmail.com','Danza','bailar','Miércoles 5:00p.m','2000','lol','Pendiente','2026-08-10 23:32:34'),(4,'Belén Abarca','2017463@est.cedesdonbosco.ed.cr','Danza','Club de baile para alumnos.','Miércoles 5:00p.m','2000','Estar en CEDES','Pendiente','2026-08-11 14:55:50'),(5,'Belén Abarca','2017463@est.cedesdonbosco.ed.cr','Danza','Grupo de baile','Miércoles 5:00p.m','2000','Ser estudiante.','Pendiente','2026-08-11 19:43:52'),(6,'Belén Abarca','2017463@est.cedesdonbosco.ed.cr','Danza','Club para bailar','Miércoles 5:00p.m','2000','Saber bailar','Pendiente','2026-10-13 20:46:01'),(7,'Belén Abarca','2017463@est.cedesdonbosco.ed.cr','Danza','Bailar mucho','Miércoles 5:00p.m','2000','Querer bailar','Pendiente','2026-10-13 20:51:32'),(8,'Belén Abarca','2017463@est.cedesdonbosco.ed.cr','Danza','Club para bailar juntos','Miércoles 5:00p.m','2000','Saber bailar','Pendiente','2026-10-13 21:02:28');
/*!40000 ALTER TABLE `propuesta_club` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `publicacion`
--

DROP TABLE IF EXISTS `publicacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publicacion` (
  `id_publicacion` int unsigned NOT NULL AUTO_INCREMENT,
  `Texto` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` int unsigned NOT NULL,
  `id_club` int unsigned NOT NULL,
  `Estado` enum('Visible','Oculta','Eliminada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Visible',
  `imagen_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_publicacion`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `publicacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `publicacion_ibfk_2` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `publicacion`
--

LOCK TABLES `publicacion` WRITE;
/*!40000 ALTER TABLE `publicacion` DISABLE KEYS */;
INSERT INTO `publicacion` VALUES (4,'Buenos días, pasaba a comentarles con mucha alegría que la Banda fue seleccionada para representar a Costa Rica en el Desfile de las Rosas del año 2027. Muchas felicitaciones a todos los integrantes de la banda por este gran esfuerzo.','2026-08-10 19:53:21',61,13,'Visible','banda_rosas.jpeg'),(5,'Buenas chiquillos, espero que se encuentren súper bien. Pasaba a invitarlos a participar del Día del Libro y de todas las actividades que se estarán realizando la próxima semana.','2026-08-10 19:53:21',57,19,'Visible','dia_libro.jpeg'),(6,'Buenos días chiquillos, pasaba a decirles que este miércoles hay reunión en mi aula A06 para todos los interesados en llevar el curso de MATEM y el jueves para los que quieren llevar Pre-MATEM. Además, aclarar que ambas reuniones se darán durante el almuerzo. Sin más, me despido.','2026-08-10 19:53:21',59,18,'Visible','matem.jpeg'),(7,'Vengan a ayudarnos en oratorio, inscripciones abiertas','2026-10-13 21:04:26',72,34,'Eliminada','6acef13a1dbb8_images (1).jpg'),(8,'Hola vengan','2026-10-13 21:06:23',72,26,'Eliminada','6acef1af1e2c6_images (7).jpg'),(9,'Hola vengan','2026-10-13 21:08:16',72,26,'Eliminada','6acef220add17_images (7).jpg'),(10,'fsdfsf','2026-10-13 21:08:30',72,15,'Eliminada','6acef22ed3606_corazon.png'),(11,'Inscripciones abiertas','2026-10-13 21:09:38',72,34,'Visible','6acef27201a45_images (1).jpg');
/*!40000 ALTER TABLE `publicacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requisito_club`
--

DROP TABLE IF EXISTS `requisito_club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisito_club` (
  `id_requisito` int unsigned NOT NULL AUTO_INCREMENT,
  `id_club` int unsigned NOT NULL,
  `requisito` varchar(255) NOT NULL,
  PRIMARY KEY (`id_requisito`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `requisito_club_ibfk_1` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requisito_club`
--

LOCK TABLES `requisito_club` WRITE;
/*!40000 ALTER TABLE `requisito_club` DISABLE KEYS */;
INSERT INTO `requisito_club` VALUES (3,18,'Ser estudiante de secundaria'),(4,18,'Tener interés en matemática'),(5,18,'Comprometerse con la asistencia al club'),(21,15,'Participar en actividades de conversación y trabajo grupal.'),(22,15,'Asistir con cuaderno o dispositivo para las prácticas.'),(50,32,'Respetar las licencias y autoría de los recursos utilizados.'),(51,32,'Traer cuaderno o dispositivo para bocetos y referencias.'),(52,25,'ser bueno'),(53,21,'Ser cool'),(54,20,'Ser estudiante del CTP Don Bosco'),(55,20,'Tener disponibilidad para asistir a las reuniones'),(56,20,'Contar con los materiales solicitados'),(57,20,'Participar activamente en las actividades del club'),(58,29,'Inscribirse en las actividades respetando los cupos disponibles.'),(59,29,'Mantener una actitud respetuosa y colaborativa.'),(60,33,'Participar en las sesiones y actividades acordadas.'),(61,33,'Mantener una actitud respetuosa durante los encuentros.'),(62,26,'Participar respetuosamente en las actividades del grupo.'),(63,26,'Compromiso de asistencia y puntualidad.'),(64,34,'Colaborar con el orden y cuidado de los materiales.'),(65,34,'Respetar las reglas de seguridad durante los juegos.'),(66,27,'Participar en al menos una actividad de servicio por periodo.'),(67,27,'Mostrar respeto por las opiniones y creencias de otras personas.'),(68,41,'Entregarme el permiso firmado'),(69,41,'Tener disponibilidad'),(70,31,'Seguir las normas de uso seguro de los equipos.'),(71,31,'Tener interés en herramientas digitales y resolución de problemas.');
/*!40000 ALTER TABLE `requisito_club` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `respuestatest`
--

DROP TABLE IF EXISTS `respuestatest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `respuestatest` (
  `id_respuesta` int unsigned NOT NULL AUTO_INCREMENT,
  `id_test` int unsigned NOT NULL,
  `id_pregunta` int unsigned NOT NULL,
  `respuesta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_respuesta`),
  KEY `id_test` (`id_test`),
  KEY `id_pregunta` (`id_pregunta`),
  CONSTRAINT `respuestatest_ibfk_1` FOREIGN KEY (`id_test`) REFERENCES `testafinidad` (`id_test`),
  CONSTRAINT `respuestatest_ibfk_2` FOREIGN KEY (`id_pregunta`) REFERENCES `preguntatest` (`id_pregunta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `respuestatest`
--

LOCK TABLES `respuestatest` WRITE;
/*!40000 ALTER TABLE `respuestatest` DISABLE KEYS */;
/*!40000 ALTER TABLE `respuestatest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resultadotest`
--

DROP TABLE IF EXISTS `resultadotest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resultadotest` (
  `id_resultado` int unsigned NOT NULL AUTO_INCREMENT,
  `id_test` int unsigned NOT NULL,
  `id_club` int unsigned NOT NULL,
  `puntaje` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id_resultado`),
  UNIQUE KEY `id_test` (`id_test`,`id_club`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `resultadotest_ibfk_1` FOREIGN KEY (`id_test`) REFERENCES `testafinidad` (`id_test`),
  CONSTRAINT `resultadotest_ibfk_2` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resultadotest`
--

LOCK TABLES `resultadotest` WRITE;
/*!40000 ALTER TABLE `resultadotest` DISABLE KEYS */;
INSERT INTO `resultadotest` VALUES (1,1,21,76.92),(2,1,18,76.92),(3,1,20,60.00),(4,1,14,60.00),(6,1,15,33.33),(7,1,17,25.00),(8,1,31,23.43),(9,1,25,23.43),(11,1,19,8.70),(12,1,29,8.70),(13,1,33,8.70),(14,1,26,8.70),(15,1,34,8.70),(16,1,27,8.70),(18,1,32,8.33),(19,1,13,4.76),(20,1,12,4.76),(21,1,16,3.45),(22,2,20,60.00),(23,2,14,60.00),(24,2,21,57.69),(25,2,18,57.69),(26,2,13,28.57),(27,2,12,28.57),(28,2,32,25.00),(29,2,31,23.33),(30,2,25,23.33),(31,2,16,17.24),(32,2,19,13.04),(33,2,29,13.04),(34,2,33,13.04),(35,2,26,13.04),(36,2,34,13.04),(37,2,27,13.04),(38,2,17,12.50),(39,2,15,5.56),(40,3,20,48.00),(41,3,14,48.00),(42,3,19,39.13),(43,3,29,39.13),(44,3,33,39.13),(45,3,26,39.13),(46,3,34,39.13),(47,3,27,39.13),(48,3,32,37.50),(49,3,17,37.50),(50,3,31,26.18),(51,3,25,26.18),(52,3,13,23.81),(53,3,12,23.81),(54,3,21,23.08),(55,3,18,23.08),(56,3,16,20.69),(57,3,15,16.67),(58,4,32,58.33),(59,4,13,47.62),(60,4,12,47.62),(61,4,20,32.00),(62,4,14,32.00),(63,4,17,25.00),(64,4,31,24.12),(65,4,25,24.12),(66,4,15,22.22),(67,4,16,17.24),(68,4,19,13.04),(69,4,29,13.04),(70,4,33,13.04),(71,4,26,13.04),(72,4,34,13.04),(73,4,27,13.04),(74,4,21,11.54),(75,4,18,11.54);
/*!40000 ALTER TABLE `resultadotest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudclub`
--

DROP TABLE IF EXISTS `solicitudclub`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudclub` (
  `id_solicitud` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `carnet` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seccion` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_club` int unsigned NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('Pendiente','Aceptado','Rechazado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_membresia` enum('Nuevo','Antiguo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Nuevo',
  `fecha_ingreso_solicitada` date DEFAULT NULL,
  `fecha_ingreso_aprobada` date DEFAULT NULL,
  `estado_fecha_ingreso` enum('No solicitada','Pendiente','Aprobada','Rechazada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No solicitada',
  PRIMARY KEY (`id_solicitud`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_club` (`id_club`),
  CONSTRAINT `solicitudclub_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `solicitudclub_ibfk_2` FOREIGN KEY (`id_club`) REFERENCES `club` (`id_club`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudclub`
--

LOCK TABLES `solicitudclub` WRITE;
/*!40000 ALTER TABLE `solicitudclub` DISABLE KEYS */;
INSERT INTO `solicitudclub` VALUES (1,24,'2026-001','2017463@est.cedesdonbosco.ed.cr','11-F',20,'2026-09-25 18:25:06','Aceptado','Nuevo',NULL,NULL,'No solicitada'),(2,24,'2017463','2017463@est.cedesdonbosco.ed.cr','11-F',21,'2026-09-25 23:57:15','Rechazado','Nuevo',NULL,NULL,'No solicitada'),(3,24,'2017463','2017463@est.cedesdonbosco.ed.cr','11-F',18,'2026-10-11 14:36:23','Pendiente','Nuevo',NULL,NULL,'No solicitada'),(5,24,'2017463','2017463@est.cedesdonbosco.ed.cr','11-F',31,'2026-10-11 18:23:56','Aceptado','Antiguo','2025-03-11','2025-03-11','Aprobada'),(6,25,'2017463','2017463@est.cedesdonbosco.ed.cr','11-F',31,'2026-10-13 20:52:25','Pendiente','Antiguo','2024-06-19',NULL,'Pendiente'),(7,26,'2017463','2017463@est.cedesdonbosco.ed.cr','11-F',31,'2026-10-13 21:01:43','Aceptado','Antiguo','2024-07-18','2024-07-18','Aprobada');
/*!40000 ALTER TABLE `solicitudclub` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testafinidad`
--

DROP TABLE IF EXISTS `testafinidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testafinidad` (
  `id_test` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_test`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `testafinidad_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testafinidad`
--

LOCK TABLES `testafinidad` WRITE;
/*!40000 ALTER TABLE `testafinidad` DISABLE KEYS */;
INSERT INTO `testafinidad` VALUES (1,24,'2026-10-11 20:48:05'),(2,24,'2026-10-13 20:46:36'),(3,25,'2026-10-13 20:51:06'),(4,26,'2026-10-13 21:01:59');
/*!40000 ALTER TABLE `testafinidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipousuario`
--

DROP TABLE IF EXISTS `tipousuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipousuario` (
  `id_tipo_usuario` int unsigned NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_tipo_usuario`),
  UNIQUE KEY `Nombre` (`Nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipousuario`
--

LOCK TABLES `tipousuario` WRITE;
/*!40000 ALTER TABLE `tipousuario` DISABLE KEYS */;
INSERT INTO `tipousuario` VALUES (1,'Estudiante'),(2,'Profesor'),(3,'Visitante');
/*!40000 ALTER TABLE `tipousuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int unsigned NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Contraseña` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Foto_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Bio` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_tipo_usuario` int unsigned NOT NULL,
  `codigo_verificacion` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verificado` tinyint(1) DEFAULT '0',
  `codigo_recuperacion` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recuperacion_expira` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `Correo` (`Correo`),
  KEY `id_tipo_usuario` (`id_tipo_usuario`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_tipo_usuario`) REFERENCES `tipousuario` (`id_tipo_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (24,'Belén Abarca','2017463@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','perfil_6a7bcff0a13bf0.66916067.jpeg','Amo el cole',1,NULL,1,NULL,NULL),(25,'Valeria Rodríguez','2018327@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','perfil_6aceee50a1a7b2.96224683.jpeg','Amo cantar',1,NULL,1,NULL,NULL),(26,'Diego Hernández','2019154@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','perfil_6acef0de0fca31.80708372.jpeg','Amo la musica y el baile',1,NULL,1,NULL,NULL),(27,'Sofía Martínez','2020486@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(28,'Andrés Castro','2021372@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,'757564','2026-08-11 07:50:40'),(29,'Camila Solano','2022248@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(30,'Sebastián Rojas','2023159@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(31,'Daniela Jiménez','2024073@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(32,'Luis Méndez','2025184@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(33,'Mariana Pérez','2026092@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(34,'Mario Vargas','mvargas@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(35,'Carlos Méndez','cmendez@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(36,'Ana Rodríguez','arodriguez@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(37,'José Castillo','jcastillo@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(38,'Laura Jiménez','ljimenez@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(39,'Miguel Solís','msolis@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(40,'Natalia Herrera','nherrera@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(41,'Gabriel Ramírez','gramirez@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(42,'Fernanda Chaves','fchaves@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(43,'Pablo Sánchez','psanchez@est.cedesdonbosco.ed.cr','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,1,NULL,1,NULL,NULL),(44,'Vestra','vestra.cedesdonbosco@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','perfil_6a7ab4574f16f7.70254451.jpeg','Hola soy el admin.',3,NULL,1,NULL,NULL),(45,'Nicolás Arias','nicolas.arias@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(46,'Sofía Navarro','sofia.navarro@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(47,'Alejandro León','alejandro.leon@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(48,'Paula Mora','paula.mora@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(49,'Daniel Quesada','daniel.quesada@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(50,'Emma Fuentes','emma.fuentes@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(51,'Rodrigo Alfaro','rodrigo.alfaro@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(52,'Gabriela Soto','gabriela.soto@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(53,'Esteban Vargas','esteban.vargas@gmail.com','$2y$10$tC7Nt/mXlzCpkqh4Bshs6uUefcbW.ha1TmO1s.QotBSjifkDlGoOm','default.jpeg',NULL,3,NULL,1,NULL,NULL),(54,'Carlos Méndez','carlos.mendez@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(55,'María Rodríguez','maria.rodriguez@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(56,'Andrés Vargas','andres.vargas@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(57,'Grettel Badilla','gbadilla@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(58,'José Ramírez','jose.ramirez@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(59,'Pablo Alvarado','palvarado@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(60,'Luis Hernández','luis.hernandez@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(61,'Luis Fernando','lfernando@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(62,'Diego Navarro','diego.navarro@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(63,'Gabriela Solís','gabriela.solis@cedesdonbosco.ed.cr','$2y$10$92jL7xJ9wJmK8qYzT5uGLe9Y5JY8Lx4k2M3n7Pq6R1s8V0wX2Z3a','default.jpeg',NULL,2,NULL,1,NULL,NULL),(68,'Belén Abarca Monge','belenabarcamonge@gmail.com','$2y$10$9dBtQoSmK8CsfnYXwZgOn.SJiuXOz7mZJ1INjrnfzdRQYv0IuNPWa','default.jpeg','Hola soy bel :)',3,NULL,1,NULL,NULL),(70,'Belén Abarca Monge','belxjszk@gmail.com','$2y$10$Ws3nxgfSbOQ0N895YYYfdeBo3YmA7IcWnWfrlXIpSrUY5qnmVYNTK','default.jpeg','Hola :)',3,NULL,1,NULL,NULL),(72,'Profesor','profesor.prueba@cedesdonbosco.ed.cr','$2y$10$dU7LWZLylojzJoPjZjGNCug44lOjcr75cGGH3uZVxRw.u2WHYbT1a','perfil_6ab73ce2773072.91791268.jpeg','Profesor de prueba para Vestra',2,NULL,1,NULL,NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarioinsignia`
--

DROP TABLE IF EXISTS `usuarioinsignia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarioinsignia` (
  `id_UsuarioInsignia` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned NOT NULL,
  `id_insignia` int unsigned NOT NULL,
  `fecha_obtenida` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_UsuarioInsignia`),
  UNIQUE KEY `id_usuario` (`id_usuario`,`id_insignia`),
  KEY `id_insignia` (`id_insignia`),
  CONSTRAINT `usuarioinsignia_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `usuarioinsignia_ibfk_2` FOREIGN KEY (`id_insignia`) REFERENCES `insignia` (`id_insignia`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarioinsignia`
--

LOCK TABLES `usuarioinsignia` WRITE;
/*!40000 ALTER TABLE `usuarioinsignia` DISABLE KEYS */;
INSERT INTO `usuarioinsignia` VALUES (1,24,17,'2026-10-11 18:04:35'),(2,68,17,'2026-10-11 18:04:44'),(4,27,17,'2026-10-11 18:17:10'),(5,29,17,'2026-10-11 18:17:10'),(6,31,17,'2026-10-11 18:17:10'),(7,34,17,'2026-10-11 18:17:10'),(8,37,17,'2026-10-11 18:17:10'),(9,41,17,'2026-10-11 18:17:10'),(10,43,17,'2026-10-11 18:17:10'),(11,48,17,'2026-10-11 18:17:10'),(12,52,17,'2026-10-11 18:17:10'),(13,56,17,'2026-10-11 18:17:10'),(14,59,17,'2026-10-11 18:17:10'),(15,63,17,'2026-10-11 18:17:10'),(18,24,1,'2026-10-11 18:23:25'),(19,24,8,'2026-10-11 18:23:25'),(21,24,15,'2026-10-11 18:24:17'),(22,26,15,'2026-10-13 21:14:26');
/*!40000 ALTER TABLE `usuarioinsignia` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-13 21:56:23
