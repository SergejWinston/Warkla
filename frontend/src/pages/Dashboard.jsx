import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { useStats, useStreak } from '../hooks'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, getMe, isAuthenticated } = useAuth()
  const { stats } = useStats()
  const { streak } = useStreak()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (!user) {
      getMe()
    }
  }, [isAuthenticated, user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">EGE-Bot</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Выход
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {stats?.total_answers || 0}
            </div>
            <p className="text-gray-600">Всего ответов</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {stats ? Math.round((stats.correct_answers / stats.total_answers) * 100) || 0 : 0}%
            </div>
            <p className="text-gray-600">Точность</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-500 mb-2">
              {streak?.day_streak || 0}
            </div>
            <p className="text-gray-600">Дневной стрик 🔥</p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/quiz')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-lg hover:shadow-xl transition text-left"
          >
            <div className="text-4xl mb-2">📚</div>
            <h2 className="text-2xl font-bold mb-2">Начать викторину</h2>
            <p className="text-blue-100">Выбери предмет и начни отвечать на вопросы</p>
          </button>

          <button
            onClick={() => navigate('/stats')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-8 rounded-lg shadow-lg hover:shadow-xl transition text-left"
          >
            <div className="text-4xl mb-2">📊</div>
            <h2 className="text-2xl font-bold mb-2">Мои результаты</h2>
            <p className="text-purple-100">Посмотри свой прогресс по всем предметам</p>
          </button>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Быстрый старт</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/quiz')}
              className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-gray-900"
            >
              ✏️ Решить вопрос
            </button>
            <button
              onClick={() => navigate('/stats')}
              className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-gray-900"
            >
              📈 Статистика
            </button>
            <button
              onClick={() => navigate('/history')}
              className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-gray-900"
            >
              📋 История
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-gray-900"
            >
              🏆 Лидеры
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
