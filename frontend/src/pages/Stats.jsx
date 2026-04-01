import { useNavigate } from 'react-router-dom'
import { useStatsBySubjects, useStreak, useLeaderboard } from '../hooks'

export default function Stats() {
  const navigate = useNavigate()
  const { stats } = useStatsBySubjects()
  const { streak } = useStreak()
  const { leaderboard } = useLeaderboard()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:text-blue-700 font-medium mb-4"
          >
            ← Назад к меню
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Моя статистика</h1>
        </div>

        {/* Streak */}
        {streak && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-2">🔥 Дневной стрик</h2>
            <p className="text-4xl font-bold">{streak.day_streak} дней</p>
            <p className="text-white/80 mt-2">Продолжай решать вопросы каждый день!</p>
          </div>
        )}

        {/* Stats by Subjects */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Прогресс по предметам</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats && stats.length > 0 ? (
              stats.map((stat) => {
                const accuracy = stat.total_answers > 0
                  ? Math.round((stat.correct_answers / stat.total_answers) * 100)
                  : 0

                return (
                  <div key={stat.id} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{stat.subject_name || stat.name}</h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Точность</span>
                          <span className="font-bold text-lg">{accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${accuracy}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm text-gray-600">По вопросам</p>
                          <p className="font-bold text-lg">{stat.total_answers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Правильно</p>
                          <p className="font-bold text-lg text-green-600">{stat.correct_answers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Неправильно</p>
                          <p className="font-bold text-lg text-red-600">
                            {stat.total_answers - stat.correct_answers}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-2 text-center text-gray-600 py-8">
                Еще нет статистики. Начни решать вопросы!
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Лучшие игроки</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Место</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Пользователь</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Точность</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Всего ответов</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, index) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-lg font-bold">{index + 1}</td>
                      <td className="px-6 py-4">{user.username}</td>
                      <td className="px-6 py-4 font-semibold">
                        {Math.round((user.correct_answers / user.total_answers) * 100)}%
                      </td>
                      <td className="px-6 py-4">{user.total_answers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
