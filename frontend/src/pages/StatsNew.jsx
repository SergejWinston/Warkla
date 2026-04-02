import Layout from '../components/Layout'
import { useStats, useSubjects } from '../hooks'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StatsNew() {
  const navigate = useNavigate()
  const { stats } = useStats()
  const { subjects } = useSubjects()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) navigate('/login')
  }, [navigate])

  const overallStats = [
    {
      label: 'Всего ответов',
      value: stats?.total_answers || 0,
      icon: '📝',
      color: 'bg-pixel-blue',
      textColor: 'text-white',
    },
    {
      label: 'Правильных',
      value: stats?.correct_answers || 0,
      icon: '✅',
      color: 'bg-pixel-green',
      textColor: 'text-white',
    },
    {
      label: 'Неправильных',
      value: (stats?.total_answers || 0) - (stats?.correct_answers || 0),
      icon: '❌',
      color: 'bg-pixel-red',
      textColor: 'text-white',
    },
    {
      label: 'Точность',
      value: stats?.total_answers > 0 
        ? `${Math.round((stats.correct_answers / stats.total_answers) * 100)}%`
        : '0%',
      icon: '🎯',
      color: 'bg-pixel-yellow',
      textColor: 'text-pixel-dark',
    },
  ]

  // Get stats by subject
  const subjectStats = subjects?.map(subject => {
    const subjectStat = stats?.by_subject?.find(s => s.subject_id === subject.id) || {}
    const total = subjectStat.total_answers || 0
    const correct = subjectStat.correct_answers || 0
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    return {
      ...subject,
      total,
      correct,
      incorrect: total - correct,
      accuracy,
    }
  }).filter(s => s.total > 0).sort((a, b) => b.total - a.total) || []

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'bg-pixel-green'
    if (accuracy >= 60) return 'bg-pixel-yellow'
    if (accuracy >= 40) return 'bg-pixel-orange'
    return 'bg-pixel-red'
  }

  const getAccuracyEmoji = (accuracy) => {
    if (accuracy >= 80) return '🌟'
    if (accuracy >= 60) return '👍'
    if (accuracy >= 40) return '😐'
    return '😢'
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-cute text-4xl text-pixel-dark font-bold mb-2 flex items-center gap-3">
          <span className="text-5xl animate-bounce-slow">📊</span>
          Твоя статистика
        </h1>
        <p className="font-main text-pixel-dark/70 text-lg">
          Отслеживай свой прогресс и становись лучше каждый день!
        </p>
      </div>

      {/* Overall stats */}
      <div className="mb-8">
        <h2 className="font-cute text-2xl text-pixel-dark font-bold mb-4 flex items-center gap-2">
          <span className="text-3xl">🎯</span>
          Общая статистика
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {overallStats.map((stat, index) => (
            <div
              key={stat.label}
              className={`${stat.color} border-4 border-pixel-dark shadow-pixel p-6 transform transition-all duration-100 hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1 animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl mb-3 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                {stat.icon}
              </div>
              <div className={`font-cute text-3xl font-bold mb-1 ${stat.textColor}`}>
                {stat.value}
              </div>
              <div className={`font-main text-sm ${stat.textColor} opacity-90`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress message */}
      {stats?.total_answers > 0 && (
        <div className={`${
          stats.correct_answers / stats.total_answers >= 0.8 
            ? 'bg-gradient-to-r from-pixel-green to-pixel-yellow'
            : stats.correct_answers / stats.total_answers >= 0.6
            ? 'bg-gradient-to-r from-pixel-yellow to-pixel-orange'
            : 'bg-gradient-to-r from-pixel-orange to-pixel-pink'
        } border-6 border-pixel-dark shadow-pixel-lg p-6 mb-8 relative overflow-hidden`}>
          <div className="absolute top-4 right-4 text-5xl animate-twinkle opacity-50">✨</div>
          <div className="flex items-center gap-4">
            <div className="text-6xl animate-heartbeat">
              {stats.correct_answers / stats.total_answers >= 0.8 ? '🎉' 
                : stats.correct_answers / stats.total_answers >= 0.6 ? '💪'
                : '📚'}
            </div>
            <div>
              <h3 className="font-cute text-2xl text-white font-bold mb-1">
                {stats.correct_answers / stats.total_answers >= 0.8 
                  ? 'Отличная работа!'
                  : stats.correct_answers / stats.total_answers >= 0.6
                  ? 'Хорошо, но можно лучше!'
                  : 'Продолжай тренироваться!'}
              </h3>
              <p className="font-main text-white/90">
                {stats.correct_answers / stats.total_answers >= 0.8 
                  ? 'Ты просто великолепен! Так держать! 🌟'
                  : stats.correct_answers / stats.total_answers >= 0.6
                  ? 'Еще немного практики и будет идеально! 💪'
                  : 'Не сдавайся! Каждое решение делает тебя сильнее! 🚀'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats by subject */}
      {subjectStats.length > 0 && (
        <div className="mb-8">
          <h2 className="font-cute text-2xl text-pixel-dark font-bold mb-4 flex items-center gap-2">
            <span className="text-3xl">📚</span>
            Статистика по предметам
          </h2>
          <div className="space-y-4">
            {subjectStats.map((subject, index) => (
              <div
                key={subject.id}
                className="bg-white border-4 border-pixel-dark shadow-pixel p-6 transform transition-all duration-100 hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1 animate-slide-up"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  borderColor: subject.color || '#2d1b4e',
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Subject info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div 
                      className="w-16 h-16 border-4 border-pixel-dark shadow-pixel-sm flex items-center justify-center text-3xl animate-bounce-slow"
                      style={{ 
                        backgroundColor: subject.color || '#FFB3D9',
                        animationDelay: `${index * 0.2}s`,
                      }}
                    >
                      📖
                    </div>
                    <div className="flex-1">
                      <h3 className="font-cute text-xl font-bold text-pixel-dark mb-1">
                        {subject.name}
                      </h3>
                      <p className="font-main text-sm text-pixel-dark/70">
                        Решено задач: {subject.total}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="flex gap-3">
                    <div className="bg-pixel-green/20 border-3 border-pixel-green-dark px-4 py-2 text-center">
                      <div className="font-cute text-2xl font-bold text-pixel-dark">
                        {subject.correct}
                      </div>
                      <div className="font-main text-xs text-pixel-dark/70">
                        Правильно
                      </div>
                    </div>
                    <div className="bg-pixel-red/20 border-3 border-pixel-red-dark px-4 py-2 text-center">
                      <div className="font-cute text-2xl font-bold text-pixel-dark">
                        {subject.incorrect}
                      </div>
                      <div className="font-main text-xs text-pixel-dark/70">
                        Неправильно
                      </div>
                    </div>
                    <div className={`${getAccuracyColor(subject.accuracy)} border-3 border-pixel-dark px-4 py-2 text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-2xl">{getAccuracyEmoji(subject.accuracy)}</span>
                        <span className="font-cute text-2xl font-bold text-white">
                          {subject.accuracy}%
                        </span>
                      </div>
                      <div className="font-main text-xs text-white/90">
                        Точность
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!stats || stats.total_answers === 0) && (
        <div className="text-center py-12">
          <div className="text-8xl mb-6 animate-bounce-slow">📚</div>
          <h3 className="font-cute text-3xl text-pixel-dark font-bold mb-4">
            Пока нет статистики
          </h3>
          <p className="font-main text-pixel-dark/70 text-lg mb-6">
            Начни решать задачи, чтобы отслеживать свой прогресс!
          </p>
          <button
            onClick={() => navigate('/task-bank')}
            className="bg-pixel-pink hover:bg-pixel-pink-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover px-8 py-4 font-cute font-bold text-xl text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
          >
            Начать решать 🚀
          </button>
        </div>
      )}
    </Layout>
  )
}
