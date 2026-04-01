import { useState, useCallback, useEffect } from 'react'
import { statsAPI } from '../lib/api'

export const useStats = () => {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await statsAPI.getOverall()
      setStats(data)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, isLoading, error, refetch: fetchStats }
}

export const useStatsBySubjects = () => {
  const [stats, setStats] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await statsAPI.getBySubjects()
      setStats(data)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch stats')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, isLoading, error, refetch: fetchStats }
}

export const useStreak = () => {
  const [streak, setStreak] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStreak = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await statsAPI.getStreak()
      setStreak(data)
      return data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch streak')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStreak()
  }, [])

  return { streak, isLoading, error, refetch: fetchStreak }
}

export const useLeaderboard = (limit = 10) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await statsAPI.getLeaderboard(limit)
        setLeaderboard(data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch leaderboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [limit])

  return { leaderboard, isLoading, error }
}
