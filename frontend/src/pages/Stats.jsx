import { useNavigate } from 'react-router-dom'
import { useStatsBySubjects, useStreak, useLeaderboard } from '../hooks'
import Layout from '../components/Layout'

export default function Stats() {
  const navigate = useNavigate()
  const { stats } = useStatsBySubjects()
  const { streak } = useStreak()
  const { leaderboard } = useLeaderboard()

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-down">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-pixel-purple hover:bg-pixel-purple-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 mb-6 flex items-center gap-2"
          >
            <span>←</span>
            Назад к меню
          </button>
          <h1 className="font-cute text-4xl font-bold text-pixel-dark flex items-center gap-3">
            <span className="text-5xl">📊</span>
            Моя статистика
          </h1>
        </div>

        {/* Streak */}
        {streak && (
          <div className="bg-gradient-to-r from-pixel-yellow to-pixel-orange border-6 border-pixel-dark shadow-pixel-lg p-8 mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl animate-heartbeat">🔥</span>
              <div>
                <h2 className="font-cute text-3xl font-bold text-pixel-dark">Дневной стрик</h2>
                <p className="font-main text-pixel-dark/70">Так держать!</p>
              </div>
            </div>
            <p className="font-cute text-6xl font-bold text-pixel-dark mb-3">{streak.day_streak} дней</p>
            <p className="font-main font-semibold text-pixel-dark/80">Продолжай решать вопросы каждый день! 💪</p>
          </div>
        )}

        {/* Stats by Subjects */}
        <div className="mb-8">
          <h2 className="font-cute text-3xl font-bold text-pixel-dark mb-6 flex items-center gap-3">
            <span className="text-4xl">📚</span>
            Прогресс по предметам
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats && stats.length > 0 ? (
              stats.map((stat) => {
                const accuracy = stat.total_answers > 0
                  ? Math.round((stat.correct_answers / stat.total_answers) * 100)
                  : 0

                return (
                  <div key={stat.id} className="bg-pixel-cream border-4 border-pixel-dark shadow-pixel p-6 transform hover:translate-x-1 hover:translate-y-1 transition-all duration-100">
                    <h3 className="font-cute text-xl font-bold text-pixel-dark mb-5 flex items-center gap-2">
                      <span className="text-2xl">📖</span>
                      {stat.subject_name || stat.name}
                    </h3>

                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-main font-semibold text-pixel-dark">Точность</span>
                          <span className="font-cute text-2xl font-bold text-pixel-dark">{accuracy}%</span>
                        </div>
                        <div className="w-full bg-pixel-dark/20 border-2 border-pixel-dark h-6 relative overflow-hidden">
                          <div
                            className="bg-pixel-green border-r-2 border-pixel-dark h-full transition-all duration-500"
                            style={{ width: `${accuracy}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white border-3 border-pixel-dark shadow-pixel-sm p-3 text-center">
                          <p className="font-main text-xs text-pixel-dark/70 mb-1">Всего</p>
                          <p className="font-cute text-2xl font-bold text-pixel-dark">{stat.total_answers}</p>
                        </div>
                        <div className="bg-pixel-green/30 border-3 border-pixel-dark shadow-pixel-sm p-3 text-center">
                          <p className="font-main text-xs text-pixel-dark/70 mb-1">Правильно</p>
                          <p className="font-cute text-2xl font-bold text-pixel-dark">{stat.correct_answers}</p>
                        </div>
                        <div className="bg-pixel-red/30 border-3 border-pixel-dark shadow-pixel-sm p-3 text-center">
                          <p className="font-main text-xs text-pixel-dark/70 mb-1">Ошибок</p>
                          <p className="font-cute text-2xl font-bold text-pixel-dark">
                            {stat.total_answers - stat.correct_answers}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-2 bg-pixel-cream border-4 border-pixel-dark p-10 text-center">
                <div className="text-6xl mb-4 animate-bounce-slow">😊</div>
                <p className="font-cute text-xl text-pixel-dark">Еще нет статистики. Начни решать вопросы!</p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="font-cute text-3xl font-bold text-pixel-dark mb-6 flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              Лучшие игроки
            </h2>
            <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg overflow-hidden">
              <div className="bg-pixel-yellow border-b-4 border-pixel-dark p-4">
                <div className="grid grid-cols-4 gap-4 font-cute font-bold text-pixel-dark">
                  <div>Место</div>
                  <div>Пользователь</div>
                  <div>Точность</div>
                  <div>Всего ответов</div>
                </div>
              </div>
              <div className="divide-y-4 divide-pixel-dark">
                {leaderboard.slice(0, 10).map((user, index) => (
                  <div key={user.id} className="grid grid-cols-4 gap-4 p-4 bg-white hover:bg-pixel-yellow/30 transition-colors">
                    <div className="font-cute text-2xl font-bold text-pixel-dark flex items-center gap-2">
                      {index === 0 && <span className="text-3xl">🥇</span>}
                      {index === 1 && <span className="text-3xl">🥈</span>}
                      {index === 2 && <span className="text-3xl">🥉</span>}
                      {index + 1}
                    </div>
                    <div className="font-main font-semibold text-pixel-dark flex items-center">{user.username}</div>
                    <div className="font-cute text-lg font-bold text-pixel-dark flex items-center">
                      {Math.round((user.correct_answers / user.total_answers) * 100)}%
                    </div>
                    <div className="font-main font-semibold text-pixel-dark flex items-center">{user.total_answers}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
