'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getApplicationCountdown } from "@/data/appwrite-settings-data"
import { toast } from "react-toastify"
import { Clock } from "lucide-react"

const CountdownPage = () => {
  const [status, setStatus] = useState<'upcoming' | 'open' | 'closed'>('upcoming')
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState<string>("Loading...")
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchCountdownData = async () => {
      try {
        const countdownData = await getApplicationCountdown()
        setStatus(countdownData.status)
        setTargetDate(countdownData.targetDate)
        setCountdown(countdownData.timeRemaining)
        
        if (countdownData.status === 'closed' && !countdownData.targetDate) {
          toast.error("Application period not configured.")
        }
      } catch (error) {
        console.error("Error fetching countdown data:", error)
        toast.error("Failed to fetch application status.")
        setCountdown("Error loading countdown")
      } finally {
        setLoading(false)
      }
    }

    fetchCountdownData()
  }, [])

  useEffect(() => {
    if (targetDate && status !== 'closed') {
      const interval = setInterval(() => {
        const now = new Date()
        const diff = targetDate.getTime() - now.getTime()

        if (diff <= 0) {
          if (status === 'upcoming') {
            setCountdown("Applications are now open!")
            setStatus('open')
          } else if (status === 'open') {
            setCountdown("Application period has ended")
            setStatus('closed')
          }
          clearInterval(interval)
          return
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [targetDate, status])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-col items-center">
          {/* Logo Section */}
          <img
            src="/hit_logo.png"
            alt="Logo"
            className="h-16 w-auto mb-4"
          />
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Clock className="w-8 h-8" />
            Application Countdown
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 space-y-4">
          {targetDate ? (
            <>
              <p className="text-lg">
                {status === 'upcoming' && "Applications will start on: "}
                {status === 'open' && "Applications will close on: "}
                {status === 'closed' && "Application period has ended"}
                {targetDate && (
                  <span className="font-bold">
                    {targetDate.toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
              </p>
              <p className="text-4xl font-bold">{countdown}</p>
            </>
          ) : (
            <p className="text-lg">
              {status === 'closed' 
                ? "Application period is not configured in the system." 
                : countdown}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CountdownPage
