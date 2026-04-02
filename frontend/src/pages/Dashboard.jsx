import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuestionCard, SubjectBanner } from '../components'
import {
  useAnswerSubmit,
  useAuth,
  useQuestion,
  useStats,
  useStreak,
  useSubjectBanner,
  useSubjects,
  useThemes,
} from '../hooks'

const navCards = [
  {
    title: 'Статистика',
    description: 'Отслеживай прогресс и точность по предметам',
    icon: '📈',
    path: '/stats',
  },
  {
    title: 'История',
    description: 'Смотри последние ответы и разбирай ошибки',
    icon: '📋',
    path: '/history',
  },
  {
    title: 'Лидеры',
    description: 'Сравни результаты с другими участниками',
    icon: '🏆',
    path: '/leaderboard',
  },
  {
    title: 'Банк заданий',
    description: 'Перейди к каталогу заданий по предметам',
    icon: '🗂️',
    path: '/task-bank',
  },
]

const withAlpha = (color, alphaSuffix) => {
  if (typeof color !== 'string') return null
  if (color.startsWith('#') && color.length === 7) {
    return `${color}${alphaSuffix}`
  }
  return color
}

const getSubjectCardStyle = (color) => ({
  borderColor: color || '#cbd5e1',
  backgroundColor: withAlpha(color, '1A') || '#f8fafc',
})

const getSubjectBadgeStyle = (color) => ({
  borderColor: color || '#cbd5e1',
  backgroundColor: withAlpha(color, '22') || '#f1f5f9',
})

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, getMe, isAuthenticated } = useAuth()
  const { stats } = useStats()
  const { streak } = useStreak()
  const { subjects, isLoading: subjectsLoading, error: subjectsError, refetch } = useSubjects()

  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [taskSortOrder, setTaskSortOrder] = useState('asc')
  const [isPracticeStarted, setIsPracticeStarted] = useState(false)
  const [resultsByQuestion, setResultsByQuestion] = useState({})
  const [submittingQuestionId, setSubmittingQuestionId] = useState(null)
  const [answersCount, setAnswersCount] = useState(0)
  const [noTasks, setNoTasks] = useState(false)

  const { themes, isLoading: themesLoading, error: themesError } = useThemes(selectedSubject?.id)
  const {
    questions,
    isLoading: questionLoading,
    error: questionError,
    startSession,
    loadPage,
    pagination,
    resetSession,
  } = useQuestion()
  const { submit, error: submitError } = useAnswerSubmit()
  const { banner } = useSubjectBanner(selectedSubject?.slug)

  const totalAnswers = stats?.total_answers || 0
  const correctAnswers = stats?.correct_answers || 0
  const accuracy = useMemo(() => {
    if (!totalAnswers) return 0
    return Math.round((correctAnswers / totalAnswers) * 100)
  }, [correctAnswers, totalAnswers])

  const resetPracticeView = () => {
    setResultsByQuestion({})
    setSubmittingQuestionId(null)
    setAnswersCount(0)
    setNoTasks(false)
  }

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject)
    setSelectedTheme(null)
    setIsPracticeStarted(false)
    resetSession()
    resetPracticeView()
  }

  const handleBackToSubjects = () => {
    setSelectedSubject(null)
    setSelectedTheme(null)
    setIsPracticeStarted(false)
    resetSession()
    resetPracticeView()
  }

  const handleStartPractice = async (theme = null) => {
    if (!selectedSubject) return

    setSelectedTheme(theme)
    setIsPracticeStarted(true)
    resetPracticeView()

    const firstQuestion = await startSession({
      subjectSlug: selectedSubject.slug,
      themeId: theme?.id,
      perPage: 15,
      sortBy: 'id',
      sortOrder: taskSortOrder,
    })

    if (!firstQuestion) {
      setNoTasks(true)
    }
  }

  const handleAnswerSubmit = async (questionId, answer) => {
    if (!questionId) return

    setSubmittingQuestionId(questionId)

    try {
      const result = await submit(questionId, answer)
      setResultsByQuestion((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, questionId)) {
          setAnswersCount((count) => count + 1)
        }
        return {
          ...prev,
          [questionId]: result,
        }
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setSubmittingQuestionId(null)
    }
  }

  const handleLoadPage = async (targetPage) => {
    if (!selectedSubject) return

    const totalPages = pagination?.totalPages || 1
    if (targetPage < 1 || targetPage > totalPages) {
      return
    }

    resetPracticeView()

    const firstQuestion = await loadPage({
      subjectSlug: selectedSubject.slug,
      themeId: selectedTheme?.id,
      page: targetPage,
      perPage: 15,
      sortBy: 'id',
      sortOrder: taskSortOrder,
    })

    if (!firstQuestion) {
      setNoTasks(true)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (!user) {
      getMe()
    }
  }, [getMe, isAuthenticated, navigate, user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSortChange = async (event) => {
    const nextSortOrder = event.target.value
    setTaskSortOrder(nextSortOrder)

    if (!isPracticeStarted || !selectedSubject) {
      return
    }

    resetPracticeView()

    const firstQuestion = await loadPage({
      subjectSlug: selectedSubject.slug,
      themeId: selectedTheme?.id,
      page: 1,
      perPage: 15,
      sortBy: 'id',
      sortOrder: nextSortOrder,
    })

    if (!firstQuestion) {
      setNoTasks(true)
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="text-xl text-slate-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">EGE-Bot</h1>
            <p className="text-sm text-slate-500">Выбирай предмет и решай задания без лишних шагов</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-700">{user.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition"
            >
              Выход
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="text-3xl font-bold text-sky-600 mb-2">{totalAnswers}</div>
            <p className="text-slate-600">Всего ответов</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="text-3xl font-bold text-emerald-600 mb-2">{accuracy}%</div>
            <p className="text-slate-600">Точность</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="text-3xl font-bold text-amber-600 mb-2">{streak?.day_streak || 0}</div>
            <p className="text-slate-600">Дневной стрик</p>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Разделы предметов</h2>
              <p className="text-slate-500 mt-1">Сначала выбери предмет, затем тему и переходи к заданиям.</p>
            </div>
            {selectedSubject && (
              <button
                onClick={handleBackToSubjects}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Сменить предмет
              </button>
            )}
          </div>

          {!selectedSubject && (
            <div>
              {subjectsLoading && (
                <div className="text-slate-600">Загрузка предметов...</div>
              )}

              {subjectsError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-rose-700 mb-3">Не удалось загрузить предметы.</p>
                  <button
                    onClick={refetch}
                    className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition"
                  >
                    Попробовать снова
                  </button>
                </div>
              )}

              {!subjectsLoading && !subjectsError && subjects.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                  Предметы пока не найдены. Попробуй обновить страницу чуть позже.
                </div>
              )}

              {!subjectsLoading && !subjectsError && subjects.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleSubjectSelect(subject)}
                      className="rounded-xl border p-5 text-left hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                      style={getSubjectCardStyle(subject.color)}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Предмет</p>
                      <h3 className="text-xl font-bold text-slate-900 mt-2">{subject.name}</h3>
                      <p className="text-sm text-slate-600 mt-3">Открыть темы и начать решение заданий</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSubject && !isPracticeStarted && (
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm text-slate-700" style={getSubjectBadgeStyle(selectedSubject.color)}>
                {selectedSubject.name}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">Выбор темы</h3>
                  <button
                    onClick={() => handleStartPractice(null)}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition"
                  >
                    Все задания предмета
                  </button>
                </div>

                {themesLoading && <p className="text-slate-600">Загрузка тем...</p>}

                {!themesLoading && themesError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    Не удалось загрузить темы. Можно начать с общего набора заданий по предмету.
                  </div>
                )}

                {!themesLoading && themes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleStartPractice(theme)}
                        className="p-4 rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-50 transition text-left"
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                )}

                {!themesLoading && themes.length === 0 && (
                  <p className="text-slate-600">Для этого предмета нет отдельных тем. Можно решать общий набор заданий.</p>
                )}
              </div>
            </div>
          )}

          {selectedSubject && isPracticeStarted && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Решение заданий</h3>
                  <p className="text-slate-500 mt-1">
                    {selectedSubject.name}
                    {selectedTheme ? ` • ${selectedTheme.name}` : ' • все задания'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600" htmlFor="task-sort-order">Сортировка</label>
                  <select
                    id="task-sort-order"
                    value={taskSortOrder}
                    onChange={handleSortChange}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
                  >
                    <option value="asc">По возрастанию ID</option>
                    <option value="desc">По убыванию ID</option>
                  </select>
                  <button
                    onClick={() => {
                      setIsPracticeStarted(false)
                      setSelectedTheme(null)
                      resetSession()
                      resetPracticeView()
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                  >
                    Сменить тему
                  </button>
                </div>
              </div>

              <SubjectBanner banner={banner} />

              {answersCount > 0 && (
                <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                  <p className="text-sm text-slate-700">
                    Проверено заданий: <strong>{answersCount}</strong>
                  </p>
                  {pagination && (
                    <p className="text-xs text-slate-500 mt-1">
                      Страница {pagination.currentPage || 1} из {pagination.totalPages || 1}
                    </p>
                  )}
                </div>
              )}

              {(questionError || submitError) && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
                  {questionError || submitError}
                </div>
              )}

              {questionLoading && questions.length === 0 && !noTasks && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600 text-center">
                  Загружаем список заданий...
                </div>
              )}

              {!questionLoading && !noTasks && questions.length > 0 && (
                <div className="space-y-4">
                  {questions.map((questionItem, index) => {
                    const result = resultsByQuestion[questionItem.id]
                    const isSubmitting = submittingQuestionId === questionItem.id

                    return (
                      <div key={questionItem.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-700">
                            Задание {index + 1}
                          </p>
                          {result && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                result.is_correct
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {result.is_correct ? 'Решено верно' : 'Нужна корректировка'}
                            </span>
                          )}
                        </div>

                        <QuestionCard
                          question={questionItem}
                          onSubmit={handleAnswerSubmit}
                          isLoading={isSubmitting}
                        />

                        {result && (
                          <div
                            className={`rounded-lg border p-4 ${
                              result.is_correct
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-rose-200 bg-rose-50'
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {result.is_correct ? 'Верно' : 'Есть ошибка'}
                            </p>
                            {!result.is_correct && result.correct_answer && (
                              <p className="text-sm text-slate-700 mt-1">
                                Правильный ответ: <strong>{result.correct_answer}</strong>
                              </p>
                            )}
                            {result.explanation && (
                              <p className="text-sm text-slate-700 mt-2">{result.explanation}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {noTasks && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-4">
                  <h4 className="text-2xl font-bold text-slate-900">Задания закончились</h4>
                  <p className="text-slate-600">Для выбранного фильтра пока нет заданий на этой странице.</p>
                  <button
                    onClick={() => handleLoadPage(pagination?.currentPage || 1)}
                    className="py-3 px-5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
                  >
                    Обновить список
                  </button>
                </div>
              )}

              {pagination && (pagination.totalPages || 1) > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => handleLoadPage((pagination.currentPage || 1) - 1)}
                    disabled={questionLoading || (pagination.currentPage || 1) <= 1}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ← Предыдущая страница
                  </button>
                  <button
                    onClick={() => handleLoadPage((pagination.currentPage || 1) + 1)}
                    disabled={questionLoading || (pagination.currentPage || 1) >= (pagination.totalPages || 1)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Следующая страница →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Другие разделы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {navCards.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 p-4 text-left transition"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{card.description}</p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
