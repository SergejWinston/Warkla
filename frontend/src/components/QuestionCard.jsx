import { useEffect, useMemo, useState } from 'react'

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

export default function QuestionCard({ question, onSubmit, isLoading }) {
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState('')

  useEffect(() => {
    setAnswer('')
    setSelectedOption('')
  }, [question?.id])

  const safeHtmlText = useMemo(() => sanitizeHtml(question?.html_text), [question?.html_text])
  const options = useMemo(() => parseOptions(question?.options), [question?.options])

  const handleSubmit = () => {
    if (!question) return

    if ((question.type === 'choice' || question.type === 'multiple') && options.length > 0) {
      onSubmit(selectedOption)
    } else {
      onSubmit(answer.trim())
    }
  }

  if (!question) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Загрузка вопроса...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          {question.difficulty && `Сложность: ${question.difficulty}`}
        </div>
        {safeHtmlText ? (
          <div
            className="prose max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ __html: safeHtmlText }}
          />
        ) : (
          <h2 className="text-2xl font-bold text-gray-900">{question.text}</h2>
        )}
      </div>

      <div className="mb-6">
        {(question.type === 'choice' || question.type === 'multiple') && options.length > 0 && (
          <div className="space-y-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(String(option))}
                className={`w-full p-3 text-left rounded-lg font-medium transition ${
                  selectedOption === String(option)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {option}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        )}

        {question.type === 'multiple' && options.length === 0 && (
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введи ответы через запятую..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isLoading ? 'Проверка...' : 'Проверить ответ'}
      </button>
    </div>
  )
}
