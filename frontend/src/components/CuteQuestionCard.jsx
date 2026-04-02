import { useState } from 'react'

export default function CuteQuestionCard({ question, onSubmit, result }) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!answer.trim() || isSubmitting) return

    setIsSubmitting(true)
    await onSubmit(answer)
    setIsSubmitting(false)
  }

  const getDifficultyColor = (difficulty) => {
    if (!difficulty) return 'bg-pixel-pink'
    if (difficulty <= 2) return 'bg-pixel-green'
    if (difficulty <= 3) return 'bg-pixel-yellow'
    if (difficulty <= 4) return 'bg-pixel-orange'
    return 'bg-pixel-red'
  }

  const getDifficultyLabel = (difficulty) => {
    if (!difficulty) return 'Неизвестно'
    if (difficulty <= 2) return 'Легко'
    if (difficulty <= 3) return 'Средне'
    if (difficulty <= 4) return 'Сложно'
    return 'Очень сложно'
  }

  return (
    <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b-4 border-pixel-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-pixel-pink border-4 border-pixel-dark shadow-pixel-sm flex items-center justify-center text-2xl animate-bounce-slow">
            🎯
          </div>
          <div>
            <h3 className="font-cute text-xl text-pixel-dark font-bold">
              Вопрос #{question.id}
            </h3>
            <p className="font-main text-sm text-pixel-dark/70">
              {question.subject_id ? `Предмет: ${question.subject_id}` : 'Общий вопрос'}
            </p>
          </div>
        </div>
        
        {question.difficulty && (
          <div className={`${getDifficultyColor(question.difficulty)} border-3 border-pixel-dark px-3 py-1`}>
            <span className="font-main font-bold text-xs text-pixel-dark">
              {getDifficultyLabel(question.difficulty)}
            </span>
          </div>
        )}
      </div>

      {/* Question content */}
      <div className="mb-6">
        {question.html_text ? (
          <div 
            className="font-main text-pixel-dark task-content prose max-w-none"
            dangerouslySetInnerHTML={{ __html: question.html_text }}
          />
        ) : (
          <p className="font-main text-pixel-dark text-lg">
            {question.text}
          </p>
        )}
      </div>

      {/* Answer form or result */}
      {result ? (
        <div className={`border-4 p-4 ${
          result.is_correct 
            ? 'bg-pixel-green/20 border-pixel-green-dark' 
            : 'bg-pixel-red/20 border-pixel-red-dark'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl animate-bounce-slow">
              {result.is_correct ? '🎉' : '😢'}
            </span>
            <div>
              <h4 className="font-cute text-xl font-bold text-pixel-dark">
                {result.is_correct ? 'Правильно!' : 'Неправильно'}
              </h4>
              <p className="font-main text-sm text-pixel-dark/70">
                {result.is_correct 
                  ? 'Отличная работа! Продолжай в том же духе!' 
                  : 'Ничего страшного, учимся на ошибках!'}
              </p>
            </div>
          </div>
          
          {!result.is_correct && result.correct_answer && (
            <div className="bg-white/50 border-2 border-pixel-dark p-3 mt-3">
              <p className="font-main text-sm font-semibold text-pixel-dark mb-1">
                Правильный ответ:
              </p>
              <p className="font-main text-pixel-dark">
                {result.correct_answer}
              </p>
            </div>
          )}

          {question.explanation && !result.is_correct && (
            <div className="bg-white/50 border-2 border-pixel-dark p-3 mt-2">
              <p className="font-main text-sm font-semibold text-pixel-dark mb-1 flex items-center gap-2">
                <span>💡</span>
                Объяснение:
              </p>
              <p className="font-main text-sm text-pixel-dark">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-main font-semibold text-pixel-dark mb-2 flex items-center gap-2">
              <span className="text-xl">✍️</span>
              Твой ответ:
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Введи ответ здесь..."
              className="w-full px-4 py-3 bg-white border-4 border-pixel-dark shadow-pixel-sm focus:shadow-pixel-pink focus:border-pixel-pink-dark font-main text-lg transition-all duration-100"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            className={`w-full py-4 font-cute text-lg font-bold border-4 border-pixel-dark shadow-pixel transition-all duration-100 ${
              isSubmitting || !answer.trim()
                ? 'bg-pixel-dark/20 text-pixel-dark/50 cursor-not-allowed'
                : 'bg-pixel-blue hover:bg-pixel-blue-dark text-white hover:shadow-pixel-hover hover:translate-x-1 hover:translate-y-1'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Проверяем...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Проверить ответ 🎯
              </span>
            )}
          </button>
        </form>
      )}

      {/* Help text */}
      {!result && (
        <div className="mt-4 flex items-start gap-2 bg-pixel-blue/10 border-2 border-pixel-blue p-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <p className="font-main text-sm text-pixel-dark/70">
            <strong>Совет:</strong> Внимательно прочитай вопрос. Некоторые вопросы требуют точного ответа!
          </p>
        </div>
      )}
    </div>
  )
}
