import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QuestionCard, SubjectBanner, Layout } from '../components'
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

const sortFieldOptions = [
  { value: 'id', label: 'ID задания' },
  { value: 'difficulty', label: 'Сложность' },
  { value: 'created_at', label: 'Дата добавления' },
  { value: 'updated_at', label: 'Дата обновления' },
  { value: 'question_type', label: 'Тип задания' },
  { value: 'theme_id', label: 'ID темы' },
]

const sortOrderOptions = [
  { value: 'asc', label: 'По возрастанию' },
  { value: 'desc', label: 'По убыванию' },
]

const perPageOptions = [10, 15, 25, 50]
const DEFAULT_SORT_BY = 'id'
const DEFAULT_SORT_ORDER = 'asc'
const DEFAULT_PER_PAGE = 15

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
  const [taskSortBy, setTaskSortBy] = useState(DEFAULT_SORT_BY)
  const [taskSortOrder, setTaskSortOrder] = useState(DEFAULT_SORT_ORDER)
  const [tasksPerPage, setTasksPerPage] = useState(DEFAULT_PER_PAGE)
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
    loadPage,
    pagination,
    resetSession,
  } = useQuestion()
  const { submit, error: submitError } = useAnswerSubmit()
  const { banner } = useSubjectBanner(selectedSubject?.slug)

  const totalAnswers = stats?.total_answers || 0
  const correctAnswers = stats?.correct_answers || 0
  const dayStreak = Number(streak?.day_streak ?? streak?.current_streak ?? 0)
  const isZeroStreak = dayStreak === 0
  const accuracy = useMemo(() => {
    if (!totalAnswers) return 0
    return Math.round((correctAnswers / totalAnswers) * 100)
  }, [correctAnswers, totalAnswers])
  const activeSortFieldLabel = useMemo(() => {
    const match = sortFieldOptions.find((option) => option.value === taskSortBy)
    return match?.label || 'ID задания'
  }, [taskSortBy])
  const activeSortOrderLabel = taskSortOrder === 'asc' ? 'по возрастанию' : 'по убыванию'

  const resetPracticeView = () => {
    setResultsByQuestion({})
    setSubmittingQuestionId(null)
    setAnswersCount(0)
    setNoTasks(false)
  }

  const handleBackToThemes = () => {
    setIsPracticeStarted(false)
    setSelectedTheme(null)
    resetSession()
    resetPracticeView()
  }

  const loadPracticeTasks = async ({ page = 1, themeId = selectedTheme?.id, sortBy = taskSortBy, sortOrder = taskSortOrder, perPage = tasksPerPage } = {}) => {
    if (!selectedSubject) return null

    resetPracticeView()

    const firstQuestion = await loadPage({
      subjectSlug: selectedSubject.slug,
      themeId,
      page,
      perPage,
      sortBy,
      sortOrder,
    })

    if (!firstQuestion) {
      setNoTasks(true)
    }

    return firstQuestion
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
    await loadPracticeTasks({
      page: 1,
      themeId: theme?.id,
    })
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

    await loadPracticeTasks({ page: targetPage })
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

  const handleApplyPracticeSettings = async () => {
    if (!isPracticeStarted || !selectedSubject) {
      return
    }

    await loadPracticeTasks({
      page: 1,
      sortBy: taskSortBy,
      sortOrder: taskSortOrder,
      perPage: tasksPerPage,
    })
  }

  const handleResetPracticeSettings = async () => {
    setTaskSortBy(DEFAULT_SORT_BY)
    setTaskSortOrder(DEFAULT_SORT_ORDER)
    setTasksPerPage(DEFAULT_PER_PAGE)

    if (!isPracticeStarted || !selectedSubject) {
      return
    }

    await loadPracticeTasks({
      page: 1,
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
      perPage: DEFAULT_PER_PAGE,
    })
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg p-8 animate-bounce-slow">
            <div className="text-4xl mb-4 text-center animate-spin">⏳</div>
            <div className="text-xl font-cute text-pixel-dark">Загрузка...</div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <main>
        <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <div className="bg-pixel-blue border-4 border-pixel-dark shadow-pixel p-6 transform hover:translate-x-1 hover:translate-y-1 transition-all duration-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">📊</span>
              <div className="text-4xl font-cute font-bold text-pixel-dark">{totalAnswers}</div>
            </div>
            <p className="font-main font-semibold text-pixel-dark">Всего ответов</p>
          </div>

          <div className="bg-pixel-green border-4 border-pixel-dark shadow-pixel p-6 transform hover:translate-x-1 hover:translate-y-1 transition-all duration-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🎯</span>
              <div className="text-4xl font-cute font-bold text-pixel-dark">{accuracy}%</div>
            </div>
            <p className="font-main font-semibold text-pixel-dark">Точность</p>
          </div>

          <div className={`${isZeroStreak ? 'bg-gray-200' : 'bg-pixel-yellow'} border-4 border-pixel-dark shadow-pixel p-6 transform hover:translate-x-1 hover:translate-y-1 transition-all duration-100`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-4xl ${isZeroStreak ? 'text-gray-500' : 'animate-heartbeat'}`}>🔥</span>
              <div className={`${isZeroStreak ? 'text-xl text-gray-600 leading-tight' : 'text-4xl text-pixel-dark'} font-cute font-bold`}>
                {isZeroStreak ? '0 дней в страйке' : dayStreak}
              </div>
            </div>
            <p className={`font-main font-semibold ${isZeroStreak ? 'text-gray-600' : 'text-pixel-dark'}`}>Дневной стрик</p>
          </div>
        </div>

        <section className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg p-6 md:p-8 animate-fade-in">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-cute text-3xl font-bold text-pixel-dark flex items-center gap-3">
                <span className="text-4xl">📚</span>
                Разделы предметов
              </h2>
              <p className="font-main text-pixel-dark/70 mt-2">Выбери предмет, затем тему и переходи к заданиям.</p>
            </div>
            {selectedSubject && (
              <button
                onClick={handleBackToSubjects}
                className="px-4 py-3 bg-pixel-purple hover:bg-pixel-purple-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
              >
                ← Сменить предмет
              </button>
            )}
          </div>

          {!selectedSubject && (
            <div>
              {subjectsLoading && (
                <div className="bg-white border-4 border-pixel-dark p-6 text-center animate-bounce-slow">
                  <div className="text-4xl mb-3 animate-spin">⏳</div>
                  <div className="font-main font-semibold text-pixel-dark">Загрузка предметов...</div>
                </div>
              )}

              {subjectsError && (
                <div className="bg-pixel-red/20 border-4 border-pixel-red-dark p-6 animate-wiggle">
                  <p className="font-main font-semibold text-pixel-red-dark mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    Не удалось загрузить предметы.
                  </p>
                  <button
                    onClick={refetch}
                    className="px-5 py-3 bg-pixel-red-dark hover:bg-pixel-red border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-white transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
                  >
                    Попробовать снова 🔄
                  </button>
                </div>
              )}

              {!subjectsLoading && !subjectsError && subjects.length === 0 && (
                <div className="bg-white border-4 border-pixel-dark p-6 text-center">
                  <div className="text-4xl mb-3">😔</div>
                  <p className="font-main text-pixel-dark">Предметы пока не найдены. Попробуй обновить страницу чуть позже.</p>
                </div>
              )}

              {!subjectsLoading && !subjectsError && subjects.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleSubjectSelect(subject)}
                      className="bg-white border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover p-6 text-left transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 focus:outline-none focus:ring-4 focus:ring-pixel-pink"
                      style={getSubjectCardStyle(subject.color)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">📖</span>
                        <p className="text-xs font-main uppercase tracking-wider text-pixel-dark/60">Предмет</p>
                      </div>
                      <h3 className="font-cute text-xl font-bold text-pixel-dark mb-3">{subject.name}</h3>
                      <p className="font-main text-sm text-pixel-dark/70">Открыть темы и начать решение заданий →</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSubject && !isPracticeStarted && (
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-white border-4 border-pixel-dark shadow-pixel px-5 py-3 font-cute font-bold text-pixel-dark" style={getSubjectBadgeStyle(selectedSubject.color)}>
                <span className="text-xl">📌</span>
                {selectedSubject.name}
              </div>

              <div className="bg-white border-4 border-pixel-dark shadow-pixel p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <h3 className="font-cute text-2xl font-bold text-pixel-dark flex items-center gap-2">
                    <span className="text-3xl">🎯</span>
                    Выбор темы
                  </h3>
                  <button
                    onClick={() => handleStartPractice(null)}
                    className="px-5 py-3 bg-pixel-pink hover:bg-pixel-pink-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
                  >
                    Все задания предмета 🚀
                  </button>
                </div>

                {themesLoading && (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2 animate-spin inline-block">⏳</div>
                    <p className="font-main text-pixel-dark">Загрузка тем...</p>
                  </div>
                )}

                {!themesLoading && themesError && (
                  <div className="bg-pixel-orange/30 border-4 border-pixel-orange-dark p-5">
                    <p className="font-main font-semibold text-pixel-dark flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      Не удалось загрузить темы. Можно начать с общего набора заданий по предмету.
                    </p>
                  </div>
                )}

                {!themesLoading && themes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleStartPractice(theme)}
                        className="p-4 bg-pixel-cream border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover hover:bg-pixel-yellow transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 text-left font-main font-semibold text-pixel-dark"
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                )}

                {!themesLoading && themes.length === 0 && (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="font-main text-pixel-dark">Для этого предмета нет отдельных тем. Можно решать общий набор заданий.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedSubject && isPracticeStarted && (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar */}
              <aside className="w-full md:w-64 bg-white border-4 border-pixel-dark shadow-pixel p-5 space-y-6 flex-shrink-0 animate-slide-left">
                  <h4 className="font-cute text-xl font-bold text-pixel-dark mb-2 flex items-center gap-2">
                    <span className="text-2xl">⚙️</span> Фильтры и сортировка
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="font-main font-semibold text-pixel-dark block mb-1" htmlFor="sort-field">Поле сортировки</label>
                      <select
                        id="sort-field"
                        value={taskSortBy}
                        onChange={e => setTaskSortBy(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-4 border-pixel-dark shadow-pixel-sm font-main font-semibold text-pixel-dark focus:border-pixel-pink focus:shadow-pixel-pink transition-all"
                      >
                        {sortFieldOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-main font-semibold text-pixel-dark block mb-1" htmlFor="sort-order">Порядок</label>
                      <select
                        id="sort-order"
                        value={taskSortOrder}
                        onChange={e => setTaskSortOrder(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-4 border-pixel-dark shadow-pixel-sm font-main font-semibold text-pixel-dark focus:border-pixel-pink focus:shadow-pixel-pink transition-all"
                      >
                        {sortOrderOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-main font-semibold text-pixel-dark block mb-1" htmlFor="per-page">Заданий на страницу</label>
                      <select
                        id="per-page"
                        value={tasksPerPage}
                        onChange={e => setTasksPerPage(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border-4 border-pixel-dark shadow-pixel-sm font-main font-semibold text-pixel-dark focus:border-pixel-pink focus:shadow-pixel-pink transition-all"
                      >
                        {perPageOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleApplyPracticeSettings}
                      className="flex-1 py-3 bg-pixel-green hover:bg-pixel-green-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
                    >
                      Применить
                    </button>
                    <button
                      onClick={handleResetPracticeSettings}
                      className="flex-1 py-3 bg-pixel-yellow hover:bg-pixel-yellow-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
                    >
                      Сбросить
                    </button>
                  </div>
                  <button
                    onClick={handleBackToThemes}
                    className="w-full mt-4 py-3 bg-pixel-purple hover:bg-pixel-purple-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
                  >
                    ← Сменить тему
                  </button>
              </aside>
              {/* Main content */}
              <div className="flex-1 space-y-5">
                  <div>
                    <h3 className="font-cute text-3xl font-bold text-pixel-dark flex items-center gap-3">
                      <span className="text-4xl">✍️</span>
                      Решение заданий
                    </h3>
                    <p className="font-main text-pixel-dark/70 mt-2">
                      {selectedSubject.name}
                      {selectedTheme ? ` • ${selectedTheme.name}` : ' • все задания'}
                    </p>
                  </div>

              <SubjectBanner banner={banner} />

              {answersCount > 0 && (
                <div className="bg-pixel-blue/30 border-4 border-pixel-blue-dark shadow-pixel p-5">
                  <p className="font-main font-semibold text-pixel-dark flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    Проверено заданий: <strong className="font-cute text-lg">{answersCount}</strong>
                  </p>
                  {pagination && (
                    <p className="font-main text-sm text-pixel-dark/70 mt-2">
                      Страница {pagination.currentPage || 1} из {pagination.totalPages || 1}
                    </p>
                  )}
                </div>
              )}

              {(questionError || submitError) && (
                <div className="bg-pixel-red/20 border-4 border-pixel-red-dark p-5 animate-wiggle">
                  <p className="font-main font-semibold text-pixel-red-dark flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    {questionError || submitError}
                  </p>
                </div>
              )}

              {questionLoading && questions.length === 0 && !noTasks && (
                <div className="bg-white border-4 border-pixel-dark p-8 text-center animate-bounce-slow">
                  <div className="text-5xl mb-4 animate-spin">⏳</div>
                  <div className="font-cute text-xl text-pixel-dark">Загружаем список заданий...</div>
                </div>
              )}

              {!questionLoading && !noTasks && questions.length > 0 && (
                <div className="space-y-5">
                  {questions.map((questionItem, index) => {
                    const result = resultsByQuestion[questionItem.id]
                    const isSubmitting = submittingQuestionId === questionItem.id
                    const safeHintHtml = sanitizeHtml(result?.solution_html || result?.explanation)

                    return (
                      <div key={questionItem.id} className="bg-white border-4 border-pixel-dark shadow-pixel p-5 md:p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">#{index + 1}</span>
                            <p className="font-cute text-lg font-bold text-pixel-dark">
                              Задание {index + 1}
                            </p>
                          </div>
                          {result && (
                            <span
                              className={`px-4 py-2 border-3 border-pixel-dark shadow-pixel font-cute font-bold text-sm ${
                                result.is_correct
                                  ? 'bg-pixel-green text-pixel-dark'
                                  : 'bg-pixel-red text-pixel-dark'
                              }`}
                            >
                              {result.is_correct ? '✅ Верно!' : '❌ Ошибка'}
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
                            className={`border-4 border-pixel-dark shadow-pixel p-5 ${
                              result.is_correct
                                ? 'bg-pixel-green/30'
                                : 'bg-pixel-red/30'
                            }`}
                          >
                            <p className="font-cute text-lg font-bold text-pixel-dark mb-2 flex items-center gap-2">
                              {result.is_correct ? '🎉 Отлично!' : '💡 Подсказка'}
                            </p>
                            {!result.is_correct && result.correct_answer && (
                              <p className="font-main text-pixel-dark mb-2">
                                Правильный ответ: <strong className="font-cute">{result.correct_answer}</strong>
                              </p>
                            )}
                            {safeHintHtml && (
                              <div
                                className="task-content font-main text-sm text-pixel-dark/80 mt-2"
                                dangerouslySetInnerHTML={{ __html: safeHintHtml }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {noTasks && (
                <div className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg p-8 text-center space-y-4">
                  <div className="text-6xl mb-4 animate-bounce-slow">📭</div>
                  <h4 className="font-cute text-3xl font-bold text-pixel-dark">Задания закончились</h4>
                  <p className="font-main text-pixel-dark/70">Для выбранного фильтра пока нет заданий на этой странице.</p>
                  <button
                    onClick={() => handleLoadPage(pagination?.currentPage || 1)}
                    className="py-3 px-6 bg-pixel-blue hover:bg-pixel-blue-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
                  >
                    Обновить список 🔄
                  </button>
                </div>
              )}

              {pagination && (pagination.totalPages || 1) > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                  <button
                    onClick={() => handleLoadPage((pagination.currentPage || 1) - 1)}
                    disabled={questionLoading || (pagination.currentPage || 1) <= 1}
                    className="px-5 py-3 bg-pixel-purple hover:bg-pixel-purple-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    ← Предыдущая
                  </button>
                  <div className="font-main font-semibold text-pixel-dark">
                    Страница {pagination.currentPage || 1} из {pagination.totalPages || 1}
                  </div>
                  <button
                    onClick={() => handleLoadPage((pagination.currentPage || 1) + 1)}
                    disabled={questionLoading || (pagination.currentPage || 1) >= (pagination.totalPages || 1)}
                    className="px-5 py-3 bg-pixel-purple hover:bg-pixel-purple-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Следующая →
                  </button>
                </div>
              )}
              </div>
            </div>
          )}
        </section>

        <section className="bg-pixel-cream border-6 border-pixel-dark shadow-pixel-lg p-6 md:p-8 animate-fade-in">
          <h2 className="font-cute text-2xl font-bold text-pixel-dark mb-6 flex items-center gap-3">
            <span className="text-3xl">🗂️</span>
            Другие разделы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {navCards.map((card) => (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className="bg-white border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover hover:bg-pixel-yellow p-5 text-left transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
              >
                <div className="text-4xl mb-3 animate-float">{card.icon}</div>
                <h3 className="font-cute text-lg font-bold text-pixel-dark mb-2">{card.title}</h3>
                <p className="font-main text-sm text-pixel-dark/70">{card.description}</p>
              </button>
            ))}
          </div>
        </section>
        </div>
      </main>
    </Layout>
  )
}
