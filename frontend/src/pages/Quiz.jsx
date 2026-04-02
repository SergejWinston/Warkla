import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubjectSelector from '../components/SubjectSelector'
import QuestionCard from '../components/QuestionCard'
import ResultCard from '../components/ResultCard'
import SubjectBanner from '../components/SubjectBanner'
import { useQuestion, useAnswerSubmit, useSubjectBanner } from '../hooks'

export default function Quiz() {
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [answersCount, setAnswersCount] = useState(0)
  const [noMoreTasks, setNoMoreTasks] = useState(false)

  const {
    question,
    isLoading: questionLoading,
    startSession,
    nextQuestion,
    pagination,
  } = useQuestion()
  const { submit, isLoading: submitLoading } = useAnswerSubmit()
  const { banner } = useSubjectBanner(selectedFilter?.subjectSlug)

  const handleSelectSubjectTheme = async (filter) => {
    setSelectedFilter(filter)
    setShowResult(false)
    setLastResult(null)
    setAnswersCount(0)
    setNoMoreTasks(false)
    const firstQuestion = await startSession({
      subjectSlug: filter.subjectSlug,
      themeId: filter.themeId,
      perPage: 15,
    })
    if (!firstQuestion) {
      setNoMoreTasks(true)
    }
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
    const next = await nextQuestion()
    if (!next) {
      setNoMoreTasks(true)
    }
  }

  const handleRestartSession = async () => {
    if (!selectedFilter) return
    setShowResult(false)
    setLastResult(null)
    setNoMoreTasks(false)
    const firstQuestion = await startSession({
      subjectSlug: selectedFilter.subjectSlug,
      themeId: selectedFilter.themeId,
      perPage: 15,
    })
    if (!firstQuestion) {
      setNoMoreTasks(true)
    }
  }

  return (
    <div className="app-shell min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            ← Назад к меню
          </button>
        </div>

        {!selectedFilter ? (
          <SubjectSelector onSelect={handleSelectSubjectTheme} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Викторина</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedFilter.subjectName}
                  {selectedFilter.themeId ? ' • тема выбрана' : ' • все задания'}
                </p>
              </div>
              <button
                onClick={() => setSelectedFilter(null)}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Изменить предмет
              </button>
            </div>

            <SubjectBanner banner={banner} />

            {answersCount > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">
                  Ты ответил на <strong>{answersCount}</strong> {answersCount === 1 ? 'вопрос' : 'вопросов'}
                </p>
                {pagination && (
                  <p className="text-xs text-gray-500 mt-1">
                    Страница {pagination.currentPage || 1} из {pagination.totalPages || 1}
                  </p>
                )}
              </div>
            )}

            {!showResult && !noMoreTasks && (
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

            {noMoreTasks && (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Задания закончились</h2>
                <p className="text-gray-600">Для выбранного фильтра больше нет новых заданий в текущем наборе.</p>
                <button
                  onClick={handleRestartSession}
                  className="py-3 px-5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
                >
                  Начать заново
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
