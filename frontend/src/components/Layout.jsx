import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks'

const pixelIcons = {
  dashboard: '🏠',
  tasks: '📝',
  stats: '📊',
  history: '📚',
  leaderboard: '🏆',
  logout: '👋',
  menu: '☰',
  close: '✕',
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { user, logout, getMe, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !user) {
      getMe()
    }
  }, [getMe, isAuthenticated, user])

  const handleLogout = () => {
    logout()
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
      <div className="fixed top-10 right-10 w-24 h-16 bg-white/50 pixel-cloud animate-float opacity-30 pointer-events-none z-0" />
      <div className="fixed top-1/3 right-20 w-32 h-20 bg-white/50 pixel-cloud animate-float opacity-20 pointer-events-none z-0" style={{ animationDelay: '1s' }} />
      <div className="fixed bottom-20 right-1/4 w-28 h-18 bg-white/50 pixel-cloud animate-float opacity-25 pointer-events-none z-0" style={{ animationDelay: '2s' }} />

      {/* Mobile menu overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-pixel-purple border-r-6 border-pixel-dark shadow-pixel-lg z-50 transition-transform duration-300 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b-4 border-pixel-dark bg-pixel-yellow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pixel-pink border-4 border-pixel-dark shadow-pixel flex items-center justify-center text-2xl animate-bounce-slow flex-shrink-0">
                ✨
              </div>
              {sidebarOpen && (
                <div className="hidden lg:block">
                  <h1 className="font-cute text-lg font-bold text-pixel-dark">
                    EGE Помощник
                  </h1>
                  <p className="text-xs text-pixel-dark/70 font-main">
                    Твой помощник! 🎓
                  </p>
                </div>
              )}
              <div className="lg:hidden">
                <h1 className="font-cute text-lg font-bold text-pixel-dark">
                  EGE Помощник
                </h1>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b-4 border-pixel-dark bg-pixel-pink/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pixel-blue border-3 border-pixel-dark shadow-pixel flex items-center justify-center text-xl font-cute font-bold text-pixel-dark flex-shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'У'}
              </div>
              {sidebarOpen && (
                <div className="hidden lg:block overflow-hidden">
                  <p className="font-cute text-sm font-bold text-pixel-dark truncate">
                    {user?.username || 'Студент'}
                  </p>
                  <p className="text-xs text-pixel-dark/70 font-main truncate">
                    {user?.email || 'student@ege.ru'}
                  </p>
                </div>
              )}
              <div className="lg:hidden overflow-hidden">
                <p className="font-cute text-sm font-bold text-pixel-dark truncate">
                  {user?.username || 'Студент'}
                </p>
                <p className="text-xs text-pixel-dark/70 font-main truncate">
                  {user?.email || 'student@ege.ru'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 border-4 border-pixel-dark font-main font-semibold transition-all duration-100 ${
                      isActive
                        ? 'bg-pixel-yellow shadow-pixel-sm translate-x-1 translate-y-1'
                        : 'bg-white shadow-pixel hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1'
                    } ${!sidebarOpen ? 'lg:justify-center' : ''}`
                  }
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  {(sidebarOpen || mobileSidebarOpen) && (
                    <span className={`${sidebarOpen ? 'lg:inline' : 'lg:hidden'}`}>{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Logout button */}
          <div className="p-3 border-t-4 border-pixel-dark">
            <button
              onClick={() => {
                setShowLogoutConfirm(true)
                setMobileSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 bg-pixel-red hover:bg-pixel-red-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 ${!sidebarOpen ? 'lg:justify-center' : ''}`}
            >
              <span className="text-2xl flex-shrink-0">{pixelIcons.logout}</span>
              {(sidebarOpen || mobileSidebarOpen) && (
                <span className={`${sidebarOpen ? 'lg:inline' : 'lg:hidden'}`}>Выйти</span>
              )}
            </button>
          </div>

          {/* Toggle button (desktop only) */}
          <div className="hidden lg:block p-3 border-t-4 border-pixel-dark">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full py-2 bg-pixel-cream hover:bg-pixel-yellow border-3 border-pixel-dark shadow-pixel-sm hover:shadow-pixel font-cute font-bold text-pixel-dark transition-all duration-100"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={`min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-pixel-purple border-b-4 border-pixel-dark shadow-pixel sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="w-10 h-10 bg-pixel-yellow border-3 border-pixel-dark shadow-pixel flex items-center justify-center text-2xl"
            >
              {mobileSidebarOpen ? pixelIcons.close : pixelIcons.menu}
            </button>
            <h1 className="font-cute text-xl font-bold text-pixel-dark">EGE Помощник</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 lg:p-8 animate-fade-in relative z-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-pixel-purple/50 border-t-4 border-pixel-dark py-6 mt-12">
          <div className="px-4 text-center">
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
      </div>

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
