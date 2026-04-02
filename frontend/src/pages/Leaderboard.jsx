import { useNavigate } from 'react-router-dom'
import { useLeaderboard } from '../hooks'
import Layout from '../components/Layout'

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
    <Layout>
      <div className="max-w-5xl mx-auto">
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
            <span className="text-5xl animate-bounce-slow">🏆</span>
            Лучшие игроки
          </h1>
        </div>

        {isLoading ? (
          <div className="bg-pixel-cream border-4 border-pixel-dark p-10 text-center animate-bounce-slow">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <div className="font-cute text-xl text-pixel-dark">Загрузка...</div>
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-pixel-yellow to-pixel-orange border-b-6 border-pixel-dark p-5">
              <div className="grid grid-cols-5 gap-4 font-cute font-bold text-pixel-dark">
                <div>Место</div>
                <div>Пользователь</div>
                <div className="text-center">Решено</div>
                <div className="text-center">Правильно</div>
                <div className="text-center">Точность</div>
              </div>
            </div>
            <div className="divide-y-4 divide-pixel-dark">
              {leaderboard.map((user, index) => {
                const accuracy = user.total_answers > 0
                  ? Math.round((user.correct_answers / user.total_answers) * 100)
                  : 0

                const medal = getMedalEmoji(index)

                return (
                  <div
                    key={user.id}
                    className={`grid grid-cols-5 gap-4 p-5 transition-colors ${
                      index < 3
                        ? 'bg-pixel-yellow/30 hover:bg-pixel-yellow/50'
                        : 'bg-white hover:bg-pixel-cream'
                    }`}
                  >
                    <div className="font-cute text-2xl font-bold text-pixel-dark flex items-center gap-2">
                      {medal && <span className="text-3xl">{medal}</span>}
                      {index + 1}
                    </div>
                    <div className="font-main font-bold text-pixel-dark flex items-center">
                      {user.username}
                    </div>
                    <div className="font-cute text-lg font-bold text-pixel-dark flex items-center justify-center">
                      {user.total_answers}
                    </div>
                    <div className="font-cute text-lg font-bold text-pixel-green-dark flex items-center justify-center">
                      {user.correct_answers}
                    </div>
                    <div className="font-cute text-lg font-bold flex items-center justify-center">
                      <span className={`px-3 py-1 border-3 border-pixel-dark shadow-pixel-sm ${
                        accuracy >= 80 ? 'bg-pixel-green text-pixel-dark' :
                        accuracy >= 60 ? 'bg-pixel-yellow text-pixel-dark' :
                        'bg-pixel-red text-pixel-dark'
                      }`}>
                        {accuracy}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg p-10 text-center">
            <div className="text-6xl mb-4 animate-bounce-slow">🎯</div>
            <p className="font-cute text-xl text-pixel-dark">Лидеров еще нет. Начни решать вопросы и займи первое место!</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
