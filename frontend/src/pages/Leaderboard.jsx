import { useNavigate } from 'react-router-dom'
import { useLeaderboard } from '../hooks'

export default function Leaderboard() {
  const navigate = useNavigate()
  const { leaderboard, isLoading } = useLeaderboard(50)

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:text-blue-700 font-medium mb-4"
          >
            ← Назад к меню
          </button>
          <h1 className="text-3xl font-bold text-gray-900">🏆 Лучшие игроки</h1>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-600 py-8">Загрузка...</div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Место</th>
                  <th className="px-6 py-4 text-left font-bold">Пользователь</th>
                  <th className="px-6 py-4 text-center font-bold">Вопросов решено</th>
                  <th className="px-6 py-4 text-center font-bold">Правильно</th>
                  <th className="px-6 py-4 text-center font-bold">Точность</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, index) => {
                  const accuracy = user.total_answers > 0
                    ? Math.round((user.correct_answers / user.total_answers) * 100)
                    : 0

                  const medal = getMedalEmoji(index)

                  return (
                    <tr
                      key={user.id}
                      className={`border-b transition ${
                        index < 3
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-lg">
                        {medal ? `${medal} ${index + 1}` : index + 1}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {user.total_answers}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-green-600">
                        {user.correct_answers}
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span className={
                          accuracy >= 80 ? 'text-green-600' :
                          accuracy >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }>
                          {accuracy}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            Лидеров еще нет. Начни решать вопросы и займи первое место!
          </div>
        )}
      </div>
    </div>
  )
}
