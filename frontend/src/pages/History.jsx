import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnswerHistory } from '../hooks'
import Layout from '../components/Layout'
import { decodeHtmlEntities } from '../lib/text'

export default function History() {
  const navigate = useNavigate()
  const { history, isLoading, error, fetchHistory, deleteHistoryItem } = useAnswerHistory()
  const [page, setPage] = useState(0)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchHistory({ limit: 20, offset: page * 20 })
  }, [fetchHistory, page])

  const handleDelete = async (answerId) => {
    const shouldDelete = window.confirm('Удалить это задание из истории?')
    if (!shouldDelete) {
      return
    }

    setDeletingId(answerId)
    const wasDeleted = await deleteHistoryItem(answerId)
    setDeletingId(null)

    if (!wasDeleted) {
      window.alert('Не удалось удалить запись из истории.')
      return
    }

    if (history.length === 1 && page > 0) {
      setPage((prev) => Math.max(0, prev - 1))
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
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
            <span className="text-5xl">📚</span>
            История ответов
          </h1>
        </div>

        {error && !isLoading && (
          <div className="mb-6 bg-pixel-red/20 border-4 border-pixel-red-dark p-4 font-main font-semibold text-pixel-red-dark">
            ⚠️ {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-pixel-cream border-4 border-pixel-dark p-10 text-center animate-bounce-slow">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <div className="font-cute text-xl text-pixel-dark">Загрузка...</div>
          </div>
        ) : history && history.length > 0 ? (
          <div>
            <div className="space-y-5 mb-8">
              {history.map((answer) => (
                <div key={answer.id} className="bg-pixel-cream border-4 border-pixel-dark shadow-pixel p-5 hover:shadow-pixel-hover transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-cute text-lg font-bold text-pixel-dark mb-3">{decodeHtmlEntities(answer.question_text) || 'Текст задания недоступен'}</h3>
                      <div className="font-main text-sm text-pixel-dark space-y-2">
                        <p className="flex items-start gap-2">
                          <span className="font-semibold">✍️ Твой ответ:</span>
                          <span className={answer.is_correct ? 'text-pixel-green-dark font-bold' : 'text-pixel-red-dark font-bold'}>
                            {answer.user_answer || '—'}
                          </span>
                        </p>
                        {!answer.is_correct && answer.correct_answer && (
                          <p className="flex items-start gap-2">
                            <span className="font-semibold">✅ Правильный:</span>
                            <span className="font-bold text-pixel-green-dark">{answer.correct_answer}</span>
                          </p>
                        )}
                        {answer.time_spent && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">⏱️ Время:</span>
                            <span className="font-bold">{answer.time_spent}с</span>
                          </p>
                        )}
                        <p className="text-xs text-pixel-dark/60 flex items-center gap-2">
                          <span>📅</span>
                          {new Date(answer.answered_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 ml-4">
                      <button
                        onClick={() => handleDelete(answer.id)}
                        disabled={deletingId === answer.id}
                        className="px-3 py-2 bg-pixel-red hover:bg-pixel-red-dark border-3 border-pixel-dark shadow-pixel-sm hover:shadow-pixel font-main font-bold text-xs text-white transition-all duration-100 transform hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {deletingId === answer.id ? 'Удаляю...' : 'Удалить'}
                      </button>
                      <div className={`px-3 py-2 border-3 border-pixel-dark shadow-pixel-sm font-main font-bold text-xs uppercase tracking-wide ${
                        answer.is_correct ? 'bg-pixel-green text-pixel-dark' : 'bg-pixel-red text-white'
                      }`}>
                        {answer.is_correct ? 'Верно' : 'Ошибка'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center py-6 border-t-4 border-pixel-dark">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-5 py-3 bg-pixel-blue hover:bg-pixel-blue-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                ← Назад
              </button>
              <span className="font-cute text-lg font-bold text-pixel-dark">Страница {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={history.length < 20}
                className="px-5 py-3 bg-pixel-blue hover:bg-pixel-blue-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Дальше →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg p-10 text-center">
            <div className="text-6xl mb-4 animate-bounce-slow">📝</div>
            <p className="font-cute text-xl text-pixel-dark">История ответов пуста. Начни решать вопросы!</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
