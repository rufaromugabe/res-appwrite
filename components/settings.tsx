'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getApplicationSettings, updateApplicationSettings } from "@/data/appwrite-settings-data"
import { UserIcon as Male, UserIcon as Female, CheckCircle, SettingsIcon, CalendarIcon } from 'lucide-react'
import { toast } from "react-toastify"

const Settings = () => {
  const [boyLimit, setBoyLimit] = useState<number>(0)
  const [girlLimit, setGirlLimit] = useState<number>(0)
  const [autoAcceptBoysLimit, setAutoAcceptBoysLimit] = useState<number>(0)
  const [autoAcceptGirlsLimit, setAutoAcceptGirlsLimit] = useState<number>(0)
  const [startDateTime, setStartDateTime] = useState<string>("")
  const [endDateTime, setEndDateTime] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const settings = await getApplicationSettings()
        setBoyLimit(settings.boyLimit || 0)
        setGirlLimit(settings.girlLimit || 0)
        setAutoAcceptBoysLimit(settings.autoAcceptBoysLimit || 0)
        setAutoAcceptGirlsLimit(settings.autoAcceptGirlsLimit || 0)
        setStartDateTime(settings.startDateTime || "")
        setEndDateTime(settings.endDateTime || "")
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    fetchLimits()
  }, [])

  const handleSave = async () => {
    // Validation logic
    if (autoAcceptBoysLimit > boyLimit) {
      toast.error("Auto-Accept Boys Limit cannot exceed Boys Limit.")
      return
    }

    if (autoAcceptGirlsLimit > girlLimit) {
      toast.error("Auto-Accept Girls Limit cannot exceed Girls Limit.")
      return
    }

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      toast.error("Start Date/Time must be earlier than End Date/Time.")
      return
    }

    setSaving(true)
    try {
      await updateApplicationSettings({
        boyLimit,
        girlLimit,
        autoAcceptBoysLimit,
        autoAcceptGirlsLimit,
        startDateTime,
        endDateTime,
      })
      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-start justify-center">
      <Card className="w-full max-w-5xl mt-10 mx-auto">
        <CardHeader className="flex flex-col items-center justify-center">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-center">
            <SettingsIcon className="w-6 h-6" />
            Application Limits
          </CardTitle>
          <CardDescription className="text-center">
            Set the limits for applications and auto-acceptance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">General Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="boyLimit" className="flex items-center gap-2">
                  <Male className="w-4 h-4" />
                  Boys Limit
                </Label>
                <Input
                  id="boyLimit"
                  type="number"
                  value={boyLimit}
                  onChange={(e) => setBoyLimit(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="girlLimit" className="flex items-center gap-2">
                  <Female className="w-4 h-4" />
                  Girls Limit
                </Label>
                <Input
                  id="girlLimit"
                  type="number"
                  value={girlLimit}
                  onChange={(e) => setGirlLimit(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Auto-Accept Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="autoAcceptBoysLimit" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Auto-Accept Boys
                </Label>
                <Input
                  id="autoAcceptBoysLimit"
                  type="number"
                  value={autoAcceptBoysLimit}
                  onChange={(e) => setAutoAcceptBoysLimit(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="autoAcceptGirlsLimit" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Auto-Accept Girls
                </Label>
                <Input
                  id="autoAcceptGirlsLimit"
                  type="number"
                  value={autoAcceptGirlsLimit}
                  onChange={(e) => setAutoAcceptGirlsLimit(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <Separator />
<div className="space-y-4">
  <h3 className="text-lg font-semibold">Application Period</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="startDateTime" className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4" />
        Start Date/Time
      </Label>
      <Input
        id="startDateTime"
        type="datetime-local"
        value={startDateTime}
        onChange={(e) => setStartDateTime(e.target.value)}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="endDateTime" className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4" />
        End Date/Time
      </Label>
      <Input
        id="endDateTime"
        type="datetime-local"
        value={endDateTime}
        onChange={(e) => setEndDateTime(e.target.value)}
      />
    </div>
  </div>
</div>

        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Settings
