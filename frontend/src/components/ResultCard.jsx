const sanitizeHtml = (rawHtml) => {
  if (!rawHtml) return ''

  return String(rawHtml)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
}

export default function ResultCard({ result, onNext, isLoading }) {
  if (!result) return null

  const { is_correct, correct_answer, explanation, solution_html: solutionHtml } = result
  const safeSolutionHtml = sanitizeHtml(solutionHtml)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        {is_correct ? (
          <div>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-green-600">Правильно!</h2>
          </div>
        ) : (
          <div>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-3xl font-bold text-red-600">Неправильно</h2>
          </div>
        )}
      </div>

      {!is_correct && correct_answer && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600 mb-2">Правильный ответ:</p>
          <p className="text-lg font-semibold text-gray-900">{correct_answer}</p>
        </div>
      )}

      {safeSolutionHtml ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Решение:</p>
          <div
            className="prose max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ __html: safeSolutionHtml }}
          />
        </div>
      ) : explanation ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">📚 Объяснение:</p>
          <p className="text-gray-900">{explanation}</p>
        </div>
      ) : null}

      <button
        onClick={onNext}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isLoading ? 'Загрузка...' : 'Следующий вопрос'}
      </button>
    </div>
  )
}
