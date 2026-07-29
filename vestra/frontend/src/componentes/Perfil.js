import React, { useEffect, useRef, useState } from "react";
import "./Perfil.css";
import './Login.css';
/**
 * Props:
 * - initialProfile: { name, email, bio, avatarUrl }
 * - onSave: async function(formData) => { success: true, avatarUrl?: string } or throw Error / return { success: false, message }
 */
export default function Perfil({ initialProfile = {}, onSave } = {}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState({
    name: initialProfile.name || "",
    email: initialProfile.email || "",
    bio: initialProfile.bio || "",
    avatarUrl: initialProfile.avatarUrl || "",
  });

  const originalRef = useRef(profile);
  const fileInputRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    // Si cambian las props iniciales, sincronizamos
    setProfile({
      name: initialProfile.name || "",
      email: initialProfile.email || "",
      bio: initialProfile.bio || "",
      avatarUrl: initialProfile.avatarUrl || "",
    });
    originalRef.current = {
      name: initialProfile.name || "",
      email: initialProfile.email || "",
      bio: initialProfile.bio || "",
      avatarUrl: initialProfile.avatarUrl || "",
    };
    // limpieza de preview al desmontar
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProfile.name, initialProfile.email, initialProfile.bio, initialProfile.avatarUrl]);

  function handleChange(e) {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  function enterEdit() {
    setError("");
    setSuccess("");
    setEditMode(true);
  }

  function cancelEdit() {
    setError("");
    setSuccess("");
    setEditMode(false);
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (originalRef.current) setProfile(originalRef.current);
  }

  async function handleSave(e) {
    e && e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones simples front
    if (!profile.name.trim()) {
      setError("El nombre es requerido.");
      return;
    }
    if (!profile.email.trim() || !/^\S+@\S+\.\S+$/.test(profile.email)) {
      setError("Email inválido.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("bio", profile.bio || "");
      if (avatarFile) formData.append("avatar", avatarFile);

      if (typeof onSave === "function") {
        // El onSave es responsabilidad del consumidor (frontend que integra con backend)
        const result = await onSave(formData);
        if (result?.success) {
          setSuccess("Perfil actualizado.");
          setEditMode(false);
          // actualizar avatarUrl si el handler devolvió uno
          if (result.avatarUrl) {
            setProfile((p) => ({ ...p, avatarUrl: result.avatarUrl }));
          }
          originalRef.current = { ...profile, avatarUrl: result?.avatarUrl || profile.avatarUrl };
          setAvatarFile(null);
          if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
          }
        } else {
          throw new Error(result?.message || "No se pudo actualizar el perfil.");
        }
      } else {
        // Simulación de guardado local (sin backend) para desarrollo rápido
        await new Promise((r) => setTimeout(r, 800));
        setSuccess("Cambios guardados (simulado).");
        setEditMode(false);
        originalRef.current = { ...profile };
        setAvatarFile(null);
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
        }
      }
    } catch (err) {
      setError(err?.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="perfil-container">Cargando…</div>;
  }

  return (
    <main className="login-contenedor" role="main">
      <div className="login-tarjeta">
      <header className="perfil-header">
        <h1 className="perfil-title">Mi perfil</h1>
        <div className="perfil-actions">
          {!editMode ? (
            <button className="btn" onClick={enterEdit} aria-label="Editar perfil">
              Editar
            </button>
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                aria-label="Guardar cambios"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button className="btn" onClick={cancelEdit} aria-label="Cancelar edición">
                Cancelar
              </button>
            </>
          )}
        </div>
      </header>

      <form className="perfil-form" onSubmit={handleSave} noValidate>
        <div className="perfil-avatar-col">
          <div className="perfil-avatar-wrap">
            <img
              src={avatarPreview || profile.avatarUrl || "./logito.png"}
              alt=":v"
              className="perfil-avatar"
            />
            {editMode && (
              <>
                <label className="perfil-avatar-label" htmlFor="avatarInput">
                  Cambiar foto
                </label>
                <input
                  id="avatarInput"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="perfil-hidden-file"
                />
              </>
            )}
          </div>
        </div>

        <div className="perfil-data-col">
          <label className="perfil-field">
            <span className="perfil-field-label">Nombre</span>
            <input
              name="name"
              value={profile.name}
              onChange={handleChange}
              disabled={!editMode}
              className="perfil-input"
              aria-required="true"
            />
          </label>

          <label className="perfil-field">
            <span className="perfil-field-label">Email</span>
            <input
              name="email"
              value={profile.email}
              onChange={handleChange}
              disabled={!editMode}
              className="perfil-input"
              type="email"
            />
          </label>

          <label className="perfil-field">
            <span className="perfil-field-label">Bio</span>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              disabled={!editMode}
              className="perfil-textarea"
              rows={4}
            />
          </label>

          {error && <div className="perfil-error" role="alert">{error}</div>}
          {success && <div className="perfil-success" role="status">{success}</div>}
        </div>
      </form>
      </div>
    </main>
  );
}