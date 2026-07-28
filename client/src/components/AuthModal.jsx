import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthModal({ onAuthenticated }) {
  const {
    authOpen,
    error,
    isSubmitting,
    login,
    register,
    continueAsDemo,
    clearError,
  } = useAuthStore()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    characterName: '',
    remember: true,
  })
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!authOpen) setValidationError('')
  }, [authOpen])

  if (!authOpen) return null

  const update = (event) => {
    const { name, value, checked, type } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setValidationError('')
    clearError()
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setValidationError('')
    clearError()
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) {
      return setValidationError('Completa los campos obligatorios.')
    }
    if (!emailPattern.test(form.email)) {
      return setValidationError('Ingresa un correo válido.')
    }
    if (mode === 'register') {
      if (!form.characterName.trim()) {
        return setValidationError('Elige un nombre para tu personaje.')
      }
      if (form.password.length < 6) {
        return setValidationError('La contraseña debe tener al menos 6 caracteres.')
      }
      if (form.password !== form.confirmPassword) {
        return setValidationError('Las contraseñas no coinciden.')
      }
    }

    const success =
      mode === 'login' ? await login(form) : await register(form)
    if (success) onAuthenticated()
  }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-backdrop-art" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <section className="auth-window">
        <div className="auth-topbar">
          <div>
            <span className="auth-rune">M</span>
            <strong>Iniciar Juego Gratis</strong>
          </div>
          <button type="button" className="auth-switch" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '¿No tengo cuenta? Registrarse' : 'Ya tengo cuenta · Iniciar sesión'}
          </button>
          <button type="button" className="auth-close" onClick={continueAsDemo} aria-label="Cerrar y jugar en modo demo">
            ×
          </button>
        </div>

        <div className="auth-hero">
          <span className="eyebrow">Crónicas del Sendero</span>
          <h1 id="auth-title">{mode === 'login' ? 'Tu aventura continúa' : 'Forja una nueva leyenda'}</h1>
          <p>Entra a Mastersmon Rogue y protege el reino de las criaturas del umbral.</p>
        </div>

        <div className="auth-columns">
          <form className="auth-form" onSubmit={submit}>
            <span className="eyebrow">{mode === 'login' ? 'Acceso del aventurero' : 'Registro de héroe'}</span>

            {mode === 'register' && (
              <label>
                Nombre del personaje
                <input name="characterName" value={form.characterName} onChange={update} maxLength="20" placeholder="Ej. Arlen" autoComplete="nickname" />
              </label>
            )}

            <label>
              Correo
              <input name="email" type="email" value={form.email} onChange={update} placeholder="aventurero@correo.com" autoComplete="email" />
            </label>

            <label>
              Contraseña
              <input name="password" type="password" value={form.password} onChange={update} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </label>

            {mode === 'register' && (
              <label>
                Confirmar contraseña
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={update} placeholder="••••••••" autoComplete="new-password" />
              </label>
            )}

            <div className="auth-options">
              <label className="check-label">
                <input name="remember" type="checkbox" checked={form.remember} onChange={update} />
                Recordarme
              </label>
              <button type="button" className="text-button" disabled title="Disponible próximamente">
                Recuperar contraseña
              </button>
            </div>

            {(validationError || error) && <p className="auth-error">{validationError || error}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Abriendo el portal...' : mode === 'login' ? 'Iniciar' : 'Crear aventurero'}
            </button>
            <button className="demo-button" type="button" onClick={continueAsDemo}>
              Continuar en modo demo
            </button>
          </form>

          <aside className="social-access">
            <span className="eyebrow">Acceso social</span>
            <h2>Otros portales</h2>
            <p>Muy pronto podrás vincular tus cuentas externas.</p>
            <button type="button" disabled><span>G</span> Continuar con Google</button>
            <button type="button" disabled><span>F</span> Continuar con red social</button>
            <div className="social-note">Accesos visuales · OAuth todavía no disponible</div>
          </aside>
        </div>
      </section>
    </div>
  )
}
