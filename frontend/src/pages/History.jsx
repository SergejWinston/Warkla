import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnswerHistory } from '../hooks'

export default function History() {
  const navigate = useNavigate()
  const { history, isLoading, fetchHistory } = useAnswerHistory()
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetchHistory({ limit: 20, offset: page * 20 })
  }, [page])

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
          <h1 className="text-3xl font-bold text-gray-900">История ответов</h1>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-600 py-8">Загрузка...</div>
        ) : history && history.length > 0 ? (
          <div>
            <div className="space-y-4 mb-8">
              {history.map((answer) => (
                <div key={answer.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{answer.question_text}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Твой ответ:</strong> {answer.user_answer}
                        </p>
                        {!answer.is_correct && (
                          <p>
                            <strong>Правильный ответ:</strong> {answer.correct_answer}
                          </p>
                        )}
                        {answer.time_spent && (
                          <p>
                            <strong>Время:</strong> {answer.time_spent}с
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(answer.answered_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className={`text-3xl ml-4 ${answer.is_correct ? 'text-green-500' : 'text-red-500'}`}>
                      {answer.is_correct ? '✅' : '❌'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center py-4 border-t">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition"
              >
                ← Назад
              </button>
              <span className="text-gray-600 font-medium">Страница {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={history.length < 20}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition"
              >
                Дальше →
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8">
            История ответов пуста. Начни решать вопросы!
          </div>
        )}
      </div>
    </div>
  )
}
