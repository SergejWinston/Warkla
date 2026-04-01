import { useState } from 'react'

export default function QuestionCard({ question, onSubmit, isLoading }) {
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)

  const handleSubmit = () => {
    if (question.type === 'choice') {
      onSubmit(question.options[selectedOption])
    } else {
      onSubmit(answer)
    }
  }

  if (!question) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Загрузка вопроса...</div>
      </div>
    )
  }

  const options = typeof question.options === 'string'
    ? JSON.parse(question.options)
    : question.options

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          {question.difficulty && `Сложность: ${question.difficulty}`}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{question.text}</h2>
      </div>

      <div className="mb-6">
        {question.type === 'choice' && options && (
          <div className="space-y-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                className={`w-full p-3 text-left rounded-lg font-medium transition ${
                  selectedOption === index
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

        {question.type === 'multiple' && (
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
          (question.type === 'choice' && selectedOption === null) ||
          ((question.type === 'text' || question.type === 'number' || question.type === 'multiple') && !answer)
        }
        className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isLoading ? 'Проверка...' : 'Проверить ответ'}
      </button>
    </div>
  )
}
