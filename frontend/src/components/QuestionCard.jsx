import { useEffect, useMemo, useState } from 'react'
import { decodeHtmlEntities } from '../lib/text'

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

const parseOptions = (optionsValue) => {
  if (!optionsValue) return []
  if (Array.isArray(optionsValue)) return optionsValue

  if (typeof optionsValue === 'string') {
    try {
      const parsed = JSON.parse(optionsValue)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return optionsValue
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  return []
}

export default function QuestionCard({ question, onSubmit, isLoading, result }) {
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [isHintVisible, setIsHintVisible] = useState(false)

  useEffect(() => {
    setAnswer('')
    setSelectedOption('')
    setIsHintVisible(false)
  }, [question?.id])

  const safeHtmlText = useMemo(() => sanitizeHtml(question?.html_text), [question?.html_text])
  const options = useMemo(() => parseOptions(question?.options), [question?.options])
  const safeHintHtml = useMemo(() => sanitizeHtml(result?.solution_html), [result?.solution_html])
  const hasHint = Boolean(safeHintHtml || result?.explanation)

  const handleSubmit = () => {
    if (!question) return

    if ((question.type === 'choice' || question.type === 'multiple') && options.length > 0) {
      onSubmit(question.id, selectedOption)
    } else {
      onSubmit(question.id, answer.trim())
    }
  }

  if (!question) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-pixel-cream border-4 border-pixel-dark shadow-pixel p-6 animate-bounce-slow">
          <div className="text-3xl mb-2 animate-spin">⏳</div>
          <div className="font-main font-semibold text-pixel-dark">Загрузка вопроса...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-pixel-cream/30 border-4 border-pixel-dark shadow-pixel p-6">
      <div className="mb-6">
        {question.difficulty && (
          <div className="inline-flex items-center gap-2 bg-pixel-yellow border-3 border-pixel-dark shadow-pixel-sm px-3 py-1 mb-4 font-main font-semibold text-sm text-pixel-dark">
            <span>⭐</span>
            Сложность: {question.difficulty}
          </div>
        )}
        {safeHtmlText ? (
          <div
            className="task-content font-main text-pixel-dark"
            dangerouslySetInnerHTML={{ __html: safeHtmlText }}
          />
        ) : (
          <h2 className="font-cute text-2xl font-bold text-pixel-dark">{decodeHtmlEntities(question.text)}</h2>
        )}
      </div>

      <div className="mb-6">
        {(question.type === 'choice' || question.type === 'multiple') && options.length > 0 && (
          <div className="space-y-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(String(option))}
                className={`w-full p-4 text-left border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-main font-semibold transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 ${
                  selectedOption === String(option)
                    ? 'bg-pixel-pink text-pixel-dark'
                    : 'bg-white text-pixel-dark'
                }`}
              >
                {decodeHtmlEntities(String(option))}
              </button>
            ))}
          </div>
        )}

        {(question.type === 'text' || question.type === 'number') && (
          <input
            type={question.type === 'number' ? 'number' : 'text'}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введи ответ..."
            className="w-full px-4 py-3 bg-white border-4 border-pixel-dark shadow-pixel-sm focus:shadow-pixel-pink focus:border-pixel-pink-dark font-main transition-all disabled:opacity-50"
            disabled={isLoading}
          />
        )}

        {question.type === 'multiple' && options.length === 0 && (
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введи ответ (обычно без пробелов и запятых)..."
            className="w-full px-4 py-3 bg-white border-4 border-pixel-dark shadow-pixel-sm focus:shadow-pixel-pink focus:border-pixel-pink-dark font-main transition-all disabled:opacity-50"
            disabled={isLoading}
          />
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={
          isLoading ||
          ((question.type === 'choice' || question.type === 'multiple') && options.length > 0 && !selectedOption) ||
          ((question.type === 'text' || question.type === 'number' || (question.type === 'multiple' && options.length === 0)) && !answer)
        }
        className="w-full py-4 px-6 bg-pixel-green hover:bg-pixel-green-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute text-lg font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Проверка...
          </>
        ) : (
          <>
            <span>✨</span>
            Проверить ответ
          </>
        )}
      </button>

      {result && !result.is_correct && (
        <div className="mt-4 bg-pixel-blue/15 border-4 border-pixel-blue p-4 space-y-3">
          <p className="font-main font-semibold text-pixel-dark">
            Ответ не засчитан. Посмотри подсказку, чтобы понять, как решать это задание.
          </p>

          {hasHint ? (
            <>
              <button
                onClick={() => setIsHintVisible((prev) => !prev)}
                className="px-4 py-2 bg-pixel-blue hover:bg-pixel-blue-dark border-3 border-pixel-dark shadow-pixel-sm hover:shadow-pixel font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
              >
                {isHintVisible ? 'Скрыть подсказку' : 'Показать подсказку'}
              </button>

              {isHintVisible && (
                <div className="bg-white border-3 border-pixel-dark p-4">
                  {safeHintHtml ? (
                    <div
                      className="task-content font-main text-pixel-dark"
                      dangerouslySetInnerHTML={{ __html: safeHintHtml }}
                    />
                  ) : (
                    <p className="font-main text-pixel-dark">{result.explanation}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="font-main text-sm text-pixel-dark/70">
              Подсказка пока недоступна для этого задания.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
