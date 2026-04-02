import { useState, useCallback } from 'react'
import { questionsAPI, answersAPI } from '../lib/api'

export const useQuestion = () => {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pagination, setPagination] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadPage = useCallback(async ({ subjectSlug, themeId = null, page = 1, perPage = 15, sortBy = 'id', sortOrder = 'asc' }) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await questionsAPI.getPage({
        subjectSlug,
        themeId,
        page,
        perPage,
        sortBy,
        sortOrder,
      })
      const pageItems = Array.isArray(data?.data) ? data.data : []

      setQuestions(pageItems)
      setCurrentIndex(0)
      setPagination(data?.pagination || null)
      setSession({ subjectSlug, themeId, page, perPage, sortBy, sortOrder })

      return pageItems[0] || null
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch questions')
      setQuestions([])
      setCurrentIndex(0)
      setPagination(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const startSession = useCallback(async ({ subjectSlug, themeId = null, perPage = 15, sortBy = 'id', sortOrder = 'asc' }) => {
    return loadPage({ subjectSlug, themeId, page: 1, perPage, sortBy, sortOrder })
  }, [loadPage])

  const nextQuestion = useCallback(async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1)
      return questions[currentIndex + 1]
    }

    if (!session || !pagination) {
      return null
    }

    const currentPage = pagination.currentPage || session.page || 1
    const totalPages = pagination.totalPages || 0
    if (currentPage >= totalPages) {
      return null
    }

    return loadPage({
      subjectSlug: session.subjectSlug,
      themeId: session.themeId,
      page: currentPage + 1,
      perPage: session.perPage,
      sortBy: session.sortBy,
      sortOrder: session.sortOrder,
    })
  }, [currentIndex, loadPage, pagination, questions, session])

  const resetSession = useCallback(() => {
    setQuestions([])
    setCurrentIndex(0)
    setPagination(null)
    setSession(null)
    setError(null)
  }, [])

  const getById = useCallback(async (questionId) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await questionsAPI.getById(questionId)
      setQuestions(data ? [data] : [])
      setCurrentIndex(0)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch question')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getSolution = useCallback(async (questionId) => {
    try {
      const { data } = await questionsAPI.getSolution(questionId)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch solution')
    }
  }, [])

  const question = questions[currentIndex] || null

  return {
    questions,
    question,
    isLoading,
    error,
    pagination,
    startSession,
    nextQuestion,
    resetSession,
    loadPage,
    getById,
    getSolution,
  }
}

export const useAnswerSubmit = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = useCallback(async (questionId, userAnswer) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await answersAPI.submit(questionId, userAnswer)
      return data
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit answer'
      setError(errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { submit, isLoading, error }
}

export const useAnswerHistory = () => {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchHistory = useCallback(async (params = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await answersAPI.getHistory(params)
      setHistory(data)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch history')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { history, isLoading, error, fetchHistory }
}
