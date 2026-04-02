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

          <div className="bg-pixel-yellow border-4 border-pixel-dark shadow-pixel p-6 transform hover:translate-x-1 hover:translate-y-1 transition-all duration-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl animate-heartbeat">🔥</span>
              <div className="text-4xl font-cute font-bold text-pixel-dark">{streak?.day_streak || 0}</div>
            </div>
            <p className="font-main font-semibold text-pixel-dark">Дневной стрик</p>
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
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
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
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="font-main font-semibold text-pixel-dark" htmlFor="task-sort-order">
                      🔀 Сортировка:
                    </label>
                    <select
                      id="task-sort-order"
                      value={taskSortOrder}
                      onChange={handleSortChange}
                      className="px-3 py-2 bg-white border-4 border-pixel-dark shadow-pixel-sm font-main font-semibold text-pixel-dark focus:border-pixel-pink focus:shadow-pixel-pink transition-all"
                    >
                      <option value="asc">По возрастанию ID</option>
                      <option value="desc">По убыванию ID</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setIsPracticeStarted(false)
                      setSelectedTheme(null)
                      resetSession()
                      resetPracticeView()
                    }}
                    className="px-4 py-2 bg-pixel-purple hover:bg-pixel-purple-dark border-4 border-pixel-dark shadow-pixel hover:shadow-pixel-hover font-cute font-bold text-pixel-dark transition-all duration-100 transform hover:translate-x-1 hover:translate-y-1"
                  >
                    Сменить тему 🔄
                  </button>
                </div>
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
                            {result.explanation && (
                              <p className="font-main text-sm text-pixel-dark/80 mt-2">{result.explanation}</p>
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
      </main>
    </div>
  )
}
