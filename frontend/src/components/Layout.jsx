import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const pixelIcons = {
  dashboard: '🏠',
  tasks: '📝',
  stats: '📊',
  history: '📚',
  leaderboard: '🏆',
  logout: '👋',
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', label: 'Главная', icon: pixelIcons.dashboard },
    { to: '/task-bank', label: 'Задания', icon: pixelIcons.tasks },
    { to: '/stats', label: 'Статистика', icon: pixelIcons.stats },
    { to: '/history', label: 'История', icon: pixelIcons.history },
    { to: '/leaderboard', label: 'Рейтинг', icon: pixelIcons.leaderboard },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pixel-cream via-bg-primary to-pixel-blue/20">
      {/* Decorative pixel clouds */}
      <div className="fixed top-10 left-10 w-24 h-16 bg-white/50 pixel-cloud animate-float opacity-30 pointer-events-none" />
      <div className="fixed top-32 right-20 w-32 h-20 bg-white/50 pixel-cloud animate-float opacity-20 pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="fixed bottom-20 left-1/4 w-28 h-18 bg-white/50 pixel-cloud animate-float opacity-25 pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className="bg-pixel-purple border-b-6 border-pixel-dark shadow-pixel-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4 animate-slide-down">
              <div className="w-12 h-12 bg-pixel-yellow border-4 border-pixel-dark shadow-pixel flex items-center justify-center text-2xl animate-bounce-slow">
                ✨
              </div>
              <div>
                <h1 className="font-cute text-2xl md:text-3xl text-pixel-dark font-bold">
                  EGE Помощник
                </h1>
                <p className="text-pixel-dark/70 text-sm font-main">
                  Готовься к экзаменам с удовольствием! 🎓
                </p>
              </div>
            </div>

            {/* User info */}
            <div className="flex items-center gap-4 animate-slide-down">
              <div className="hidden md:block text-right">
                <p className="font-cute text-pixel-dark font-semibold">
                  {user.username || 'Студент'}
                </p>
                <p className="text-sm text-pixel-dark/70">
                  {user.email || ''}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-10 h-10 bg-pixel-red hover:bg-pixel-red-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover transition-all duration-100 flex items-center justify-center text-xl transform hover:translate-x-1 hover:translate-y-1"
                title="Выйти"
              >
                {pixelIcons.logout}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-pixel-pink border-b-4 border-pixel-dark shadow-pixel-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 border-3 border-pixel-dark font-main font-semibold text-sm whitespace-nowrap transition-all duration-100 ${
                    isActive
                      ? 'bg-pixel-yellow shadow-pixel-sm translate-x-1 translate-y-1'
                      : 'bg-white shadow-pixel hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-pixel-purple/50 border-t-4 border-pixel-dark py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl animate-heartbeat">💜</span>
            <p className="font-cute text-pixel-dark">
              Сделано с любовью для студентов
            </p>
            <span className="text-2xl animate-heartbeat" style={{ animationDelay: '0.5s' }}>✨</span>
          </div>
          <p className="text-sm text-pixel-dark/70 font-main">
            © 2026 EGE Помощник. Все права защищены.
          </p>
        </div>
      </footer>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg max-w-md w-full p-6 animate-bounce-slow">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-wiggle">😢</div>
              <h2 className="font-cute text-2xl text-pixel-dark mb-2">
                Ты уже уходишь?
              </h2>
              <p className="text-pixel-dark/70 font-main">
                Мы будем скучать! Уверен, что хочешь выйти?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-pixel-green hover:bg-pixel-green-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover px-6 py-3 font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
              >
                Остаться 💚
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-pixel-red hover:bg-pixel-red-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover px-6 py-3 font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
              >
                Выйти 👋
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
