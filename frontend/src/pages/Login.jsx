import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'

export default function Login() {
  const navigate = useNavigate()
  const { login, register, isLoading, error } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSignUp) {
      if (formData.password !== formData.passwordConfirm) {
        alert('Пароли не совпадают 😢')
        return
      }
      const success = await register(formData.username, formData.email, formData.password)
      if (success) navigate('/dashboard')
    } else {
      const success = await login(formData.username, formData.password)
      if (success) navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pixel-pink via-pixel-purple to-pixel-blue flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative pixel elements */}
      <div className="absolute top-20 left-10 text-6xl animate-float opacity-30">⭐</div>
      <div className="absolute top-40 right-20 text-5xl animate-bounce-slow opacity-30" style={{ animationDelay: '0.5s' }}>✨</div>
      <div className="absolute bottom-32 left-1/4 text-7xl animate-twinkle opacity-20">💫</div>
      <div className="absolute bottom-20 right-1/4 text-5xl animate-wiggle opacity-30">🌟</div>

      {/* Pixel clouds */}
      <div className="absolute top-10 left-20 w-32 h-20 bg-white/30 pixel-cloud animate-float" />
      <div className="absolute top-1/3 right-10 w-40 h-24 bg-white/20 pixel-cloud animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-36 h-22 bg-white/25 pixel-cloud animate-float" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-pixel-yellow border-6 border-pixel-dark shadow-pixel-lg flex items-center justify-center text-4xl animate-bounce-slow mx-auto">
              ✨
            </div>
          </div>
          <h1 className="font-cute text-4xl md:text-5xl text-white font-bold mb-2 drop-shadow-lg">
            EGE Помощник
          </h1>
          <p className="font-main text-white/90 text-lg">
            {isSignUp ? 'Создай аккаунт и начни! 🚀' : 'С возвращением! 🎉'}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg p-6 md:p-8">
          {/* Tab switcher */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 font-cute font-bold border-4 border-pixel-dark transition-all duration-100 ${
                !isSignUp
                  ? 'bg-pixel-pink shadow-pixel-sm translate-x-1 translate-y-1'
                  : 'bg-white shadow-pixel hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1'
              }`}
            >
              Вход 👤
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 font-cute font-bold border-4 border-pixel-dark transition-all duration-100 ${
                isSignUp
                  ? 'bg-pixel-pink shadow-pixel-sm translate-x-1 translate-y-1'
                  : 'bg-white shadow-pixel hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1'
              }`}
            >
              Регистрация ✏️
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block font-main font-semibold text-pixel-dark mb-2 flex items-center gap-2">
                <span className="text-xl">👤</span>
                {isSignUp ? 'Имя пользователя' : 'Имя пользователя или Email'}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Например: Студент2026"
                className="w-full px-4 py-3 bg-white border-4 border-pixel-dark shadow-pixel-sm focus:shadow-pixel-pink focus:border-pixel-pink-dark font-main transition-all duration-100"
                required
              />
            </div>

            {/* Email (signup only) */}
            {isSignUp && (
              <div className="animate-slide-down">
                <label className="block font-main font-semibold text-pixel-dark mb-2 flex items-center gap-2">
                  <span className="text-xl">📧</span>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 bg-white border-4 border-pixel-dark shadow-pixel-sm focus:shadow-pixel-pink focus:border-pixel-pink-dark font-main transition-all duration-100"
                  required
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block font-main font-semibold text-pixel-dark mb-2 flex items-center gap-2">
                <span className="text-xl">🔒</span>
                Пароль
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border-4 border-pixel-dark shadow-pixel-sm focus:shadow-pixel-pink focus:border-pixel-pink-dark font-main transition-all duration-100"
                required
                minLength={6}
              />
            </div>

            {/* Password confirm (signup only) */}
            {isSignUp && (
              <div className="animate-slide-down">
                <label className="block font-main font-semibold text-pixel-dark mb-2 flex items-center gap-2">
                  <span className="text-xl">🔐</span>
                  Повторите пароль
                </label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border-4 border-pixel-dark shadow-pixel-sm focus:shadow-pixel-pink focus:border-pixel-pink-dark font-main transition-all duration-100"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-pixel-red/20 border-4 border-pixel-red-dark p-4 animate-wiggle">
                <p className="font-main font-semibold text-pixel-red-dark flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 font-cute text-lg font-bold text-white border-4 border-pixel-dark shadow-pixel transition-all duration-100 ${
                isLoading
                  ? 'bg-pixel-dark/50 cursor-not-allowed'
                  : 'bg-pixel-green hover:bg-pixel-green-dark hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Загрузка...
                </span>
              ) : isSignUp ? (
                <span className="flex items-center justify-center gap-2">
                  Создать аккаунт 🚀
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Войти 🎯
                </span>
              )}
            </button>
          </form>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="font-main text-sm text-pixel-dark/70">
              {isSignUp ? (
                <>Уже есть аккаунт? <button onClick={() => setIsSignUp(false)} className="font-bold text-pixel-pink-dark hover:underline">Войди здесь!</button></>
              ) : (
                <>Новый пользователь? <button onClick={() => setIsSignUp(true)} className="font-bold text-pixel-pink-dark hover:underline">Зарегистрируйся!</button></>
              )}
            </p>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center">
          <p className="font-main text-white/80 text-sm flex items-center justify-center gap-2">
            <span className="animate-heartbeat">💜</span>
            Готовься к ЕГЭ с удовольствием!
            <span className="animate-heartbeat" style={{ animationDelay: '0.5s' }}>✨</span>
          </p>
        </div>
      </div>
    </div>
  )
}
