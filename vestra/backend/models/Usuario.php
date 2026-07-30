<?php

function registrarUsuario($conexion, $nombre, $correo, $contra, $foto, $tipo_usuario, $codigo){
    // Verificar correo
    $verificar = mysqli_prepare($conexion,
        "SELECT id_usuario FROM usuario WHERE Correo = ?");
    mysqli_stmt_bind_param($verificar, "s", $correo);
    mysqli_stmt_execute($verificar);

    if(mysqli_num_rows(mysqli_stmt_get_result($verificar)) > 0){
        return [
            "success" => false,
            "mensaje" => "Este correo ya está registrado."
        ];
    }

    // Verificar nombre
    $verificar = mysqli_prepare($conexion,
        "SELECT id_usuario FROM usuario WHERE Nombre = ?");
    mysqli_stmt_bind_param($verificar, "s", $nombre);
    mysqli_stmt_execute($verificar);

    if(mysqli_num_rows(mysqli_stmt_get_result($verificar)) > 0){
        return [
            "success" => false,
            "mensaje" => "Este usuario ya está registrado."
        ];
    }

    // Insertar usuario
    $insertar = mysqli_prepare($conexion,
        "INSERT INTO usuario
(Nombre, Correo, Contraseña, Foto_url, id_tipo_usuario, codigo_verificacion, verificado)
VALUES (?, ?, ?, ?, ?, ?, 0)");

    mysqli_stmt_bind_param(
    $insertar,
    "ssssis",
    $nombre,
    $correo,
    $contra,
    $foto,
    $tipo_usuario,
    $codigo
);

    if(mysqli_stmt_execute($insertar)){

    $id_usuario = mysqli_insert_id($conexion);


    /*foreach($clubes as $id_club){

        $insertClub = mysqli_prepare(
            $conexion,
            "INSERT INTO usuario_club(id_usuario,id_club)
            VALUES (?,?)"
        );


        mysqli_stmt_bind_param(
            $insertClub,
            "ii",
            $id_usuario,
            $id_club
        );


        mysqli_stmt_execute($insertClub);
    }*/


    return [
        "success" => true,
        "mensaje" => "Usuario registrado correctamente."
    ];
}

    return [
        "success" => false,
        "mensaje" => mysqli_error($conexion)
    ];
}


function actualizarPerfil($conexion, $id_usuario, $nombre, $foto, $clubes){


    // Actualizar datos básicos
    $actualizar = mysqli_prepare(
        $conexion,
        "UPDATE usuario
        SET Nombre = ?, Foto_url = ?
        WHERE id_usuario = ?"
    );


    mysqli_stmt_bind_param(
        $actualizar,
        "ssi",
        $nombre,
        $foto,
        $id_usuario
    );


    if(!mysqli_stmt_execute($actualizar)){
        return false;
    }



    // Borrar clubes anteriores
    $delete = mysqli_prepare(
        $conexion,
        "DELETE FROM usuario_club
        WHERE id_usuario = ?"
    );


    mysqli_stmt_bind_param(
        $delete,
        "i",
        $id_usuario
    );


    mysqli_stmt_execute($delete);



    // Guardar nuevos clubes
    foreach($clubes as $id_club){


        $insert = mysqli_prepare(
            $conexion,
            "INSERT INTO usuario_club
            (id_usuario,id_club)
            VALUES (?,?)"
        );


        mysqli_stmt_bind_param(
            $insert,
            "ii",
            $id_usuario,
            $id_club
        );


        mysqli_stmt_execute($insert);

    }


    return true;

}