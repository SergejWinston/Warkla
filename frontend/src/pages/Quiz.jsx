import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubjectSelector from '../components/SubjectSelector'
import QuestionCard from '../components/QuestionCard'
import ResultCard from '../components/ResultCard'
import { useQuestion, useAnswerSubmit } from '../hooks'

export default function Quiz() {
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [answersCount, setAnswersCount] = useState(0)

  const { question, isLoading: questionLoading, getRandom } = useQuestion()
  const { submit, isLoading: submitLoading } = useAnswerSubmit()

  const handleSelectSubjectTheme = async (filter) => {
    setSelectedFilter(filter)
    setShowResult(false)
    setLastResult(null)
    setAnswersCount(0)
    await getRandom(filter.subjectId, filter.themeId)
  }

  const handleAnswerSubmit = async (answer) => {
    if (!question) return

    try {
      const result = await submit(question.id, answer)
      setLastResult(result)
      setShowResult(true)
      setAnswersCount((prev) => prev + 1)
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const handleNextQuestion = async () => {
    if (!selectedFilter) return
    setShowResult(false)
    setLastResult(null)
    await getRandom(selectedFilter.subjectId, selectedFilter.themeId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            ← Назад к меню
          </button>
        </div>

        {!selectedFilter ? (
          <SubjectSelector onSelect={handleSelectSubjectTheme} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Викторина</h1>
              <button
                onClick={() => setSelectedFilter(null)}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Изменить предмет
              </button>
            </div>

            {answersCount > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">
                  Ты ответил на <strong>{answersCount}</strong> {answersCount === 1 ? 'вопрос' : 'вопросов'}
                </p>
              </div>
            )}

            {!showResult && (
              <QuestionCard
                question={question}
                onSubmit={handleAnswerSubmit}
                isLoading={submitLoading}
              />
            )}

            {showResult && (
              <ResultCard
                result={lastResult}
                onNext={handleNextQuestion}
                isLoading={questionLoading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
