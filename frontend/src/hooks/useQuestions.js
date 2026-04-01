import { useState, useCallback } from 'react'
import { questionsAPI, answersAPI } from '../lib/api'

export const useQuestion = () => {
  const [question, setQuestion] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const getRandom = useCallback(async (subjectId, themeId) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await questionsAPI.getRandom(subjectId, themeId)
      setQuestion(data)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch question')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getById = useCallback(async (questionId) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await questionsAPI.getById(questionId)
      setQuestion(data)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch question')
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

  return { question, isLoading, error, getRandom, getById, getSolution }
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
