import { useState, useEffect } from 'react'
import { subjectsAPI } from '../lib/api'

export const useSubjects = () => {
  const [subjects, setSubjects] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSubjects = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await subjectsAPI.getAll()
      setSubjects(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch subjects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  return { subjects, isLoading, error, refetch: fetchSubjects }
}

export const useThemes = (subjectId) => {
  const [themes, setThemes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!subjectId) return

    const fetchThemes = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await subjectsAPI.getThemes(subjectId)
        setThemes(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch themes')
      } finally {
        setIsLoading(false)
      }
    }

    fetchThemes()
  }, [subjectId])

  return { themes, isLoading, error }
}

export const useSubjectProgress = (subjectId) => {
  const [progress, setProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!subjectId) return

    const fetchProgress = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await subjectsAPI.getProgress(subjectId)
        setProgress(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch progress')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgress()
  }, [subjectId])

  return { progress, isLoading, error }
}
