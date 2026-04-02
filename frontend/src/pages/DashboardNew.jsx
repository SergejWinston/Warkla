import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useStats, useSubjects, useStreak } from '../hooks'
import { useEffect } from 'react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { stats } = useStats()
  const { streak } = useStreak()
  const { subjects } = useSubjects()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const quickStats = [
    {
      label: 'Всего ответов',
      value: stats?.total_answers || 0,
      icon: '📝',
      color: 'bg-pixel-blue',
      borderColor: 'border-pixel-blue-dark',
    },
    {
      label: 'Правильных',
      value: stats?.correct_answers || 0,
      icon: '✅',
      color: 'bg-pixel-green',
      borderColor: 'border-pixel-green-dark',
    },
    {
      label: 'Точность',
      value: stats?.total_answers > 0 
        ? `${Math.round((stats.correct_answers / stats.total_answers) * 100)}%`
        : '0%',
      icon: '🎯',
      color: 'bg-pixel-yellow',
      borderColor: 'border-pixel-yellow-dark',
    },
    {
      label: 'Серия дней',
      value: streak?.current_streak || 0,
      icon: '🔥',
      color: 'bg-pixel-orange',
      borderColor: 'border-pixel-orange-dark',
    },
  ]

  const quickActions = [
    {
      title: 'Банк заданий',
      description: 'Решай задачи по всем предметам',
      icon: '📚',
      path: '/task-bank',
      color: 'bg-pixel-purple',
      hoverColor: 'hover:bg-pixel-purple-dark',
    },
    {
      title: 'Статистика',
      description: 'Смотри свой прогресс',
      icon: '📊',
      path: '/stats',
      color: 'bg-pixel-blue',
      hoverColor: 'hover:bg-pixel-blue-dark',
    },
    {
      title: 'История',
      description: 'Анализируй свои ответы',
      icon: '📖',
      path: '/history',
      color: 'bg-pixel-green',
      hoverColor: 'hover:bg-pixel-green-dark',
    },
    {
      title: 'Рейтинг',
      description: 'Соревнуйся с другими',
      icon: '🏆',
      path: '/leaderboard',
      color: 'bg-pixel-yellow',
      hoverColor: 'hover:bg-pixel-yellow-dark',
    },
  ]

  return (
    <Layout>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-pixel-pink via-pixel-purple to-pixel-blue border-6 border-pixel-dark shadow-pixel-lg p-6 md:p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-5xl animate-float opacity-50">✨</div>
        <div className="absolute bottom-4 left-4 text-4xl animate-twinkle opacity-40">⭐</div>
        
        <h2 className="font-cute text-3xl md:text-4xl text-white font-bold mb-2 relative z-10">
          Привет, {JSON.parse(localStorage.getItem('user') || '{}').username || 'Студент'}! 👋
        </h2>
        <p className="font-main text-white/90 text-lg relative z-10">
          Давай продолжим готовиться к экзаменам! 🎓
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-8">
        <h3 className="font-cute text-2xl text-pixel-dark font-bold mb-4 flex items-center gap-2">
          <span className="text-3xl">📈</span>
          Твоя статистика
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div
              key={stat.label}
              className={`${stat.color} border-4 ${stat.borderColor} shadow-pixel p-4 transform transition-all duration-100 hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1 animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-4xl mb-2 animate-bounce-slow">{stat.icon}</div>
              <div className="font-main font-bold text-2xl text-pixel-dark mb-1">
                {stat.value}
              </div>
              <div className="font-main text-sm text-pixel-dark/70">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h3 className="font-cute text-2xl text-pixel-dark font-bold mb-4 flex items-center gap-2">
          <span className="text-3xl">🚀</span>
          Быстрые действия
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`${action.color} ${action.hoverColor} border-4 border-pixel-dark shadow-pixel p-6 text-left transform transition-all duration-100 hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1 animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl flex-shrink-0 animate-float" style={{ animationDelay: `${index * 0.3}s` }}>
                  {action.icon}
                </div>
                <div>
                  <h4 className="font-cute text-xl text-white font-bold mb-1">
                    {action.title}
                  </h4>
                  <p className="font-main text-white/80">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subjects preview */}
      {subjects && subjects.length > 0 && (
        <div className="mb-8">
          <h3 className="font-cute text-2xl text-pixel-dark font-bold mb-4 flex items-center gap-2">
            <span className="text-3xl">📚</span>
            Доступные предметы
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.slice(0, 6).map((subject, index) => (
              <div
                key={subject.id}
                onClick={() => navigate('/task-bank', { state: { selectedSubject: subject } })}
                className="bg-white border-4 border-pixel-dark shadow-pixel p-4 cursor-pointer transform transition-all duration-100 hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1 animate-slide-up"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  borderColor: subject.color || '#2d1b4e',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-cute text-lg font-bold text-pixel-dark">
                    {subject.name}
                  </h4>
                  <div 
                    className="w-8 h-8 border-3 border-pixel-dark flex items-center justify-center text-xl animate-bounce-slow"
                    style={{ 
                      backgroundColor: subject.color || '#FFB3D9',
                      animationDelay: `${index * 0.2}s`,
                    }}
                  >
                    📖
                  </div>
                </div>
                {subject.description && (
                  <p className="font-main text-sm text-pixel-dark/70">
                    {subject.description}
                  </p>
                )}
              </div>
            ))}
          </div>
          {subjects.length > 6 && (
            <button
              onClick={() => navigate('/task-bank')}
              className="mt-4 w-full bg-pixel-pink hover:bg-pixel-pink-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover py-3 font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
            >
              Показать все предметы ({subjects.length}) →
            </button>
          )}
        </div>
      )}

      {/* Motivational card */}
      <div className="bg-gradient-to-br from-pixel-yellow via-pixel-orange to-pixel-red border-6 border-pixel-dark shadow-pixel-lg p-6 text-center relative overflow-hidden">
        <div className="absolute top-2 right-2 text-4xl animate-wiggle opacity-50">⭐</div>
        <div className="absolute bottom-2 left-2 text-3xl animate-twinkle opacity-40">✨</div>
        <div className="text-6xl mb-4 animate-heartbeat">💪</div>
        <h3 className="font-cute text-2xl text-white font-bold mb-2">
          Продолжай в том же духе!
        </h3>
        <p className="font-main text-white/90">
          Каждое решение приближает тебя к успеху на экзамене! 🎯
        </p>
      </div>
    </Layout>
  )
}
