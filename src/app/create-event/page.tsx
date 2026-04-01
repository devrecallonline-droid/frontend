'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEvents, useAuth } from '@/hooks/use-api'
import Navigation from '@/components/Navigation'
import { Button, Card, Input, Badge } from '@/components/ui'
import { AlertCircle, Calendar, Camera, Loader2, ShieldCheck } from 'lucide-react'

const CreateEventPage = () => {
    const [mounted, setMounted] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        location: '',
        is_private: true
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const { createEvent, createEventLoading } = useEvents()
    const { isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/')
        }
    }, [isAuthenticated, router, mounted])

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required'
        } else if (formData.title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters'
        } else if (formData.title.length > 100) {
            newErrors.title = 'Title must be less than 100 characters'
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            const result = await createEvent(formData)
            if (result) {
                router.push('/events')
            }
        } catch (error: unknown) {
            setErrors({ general: (error as Error).message || 'Failed to create event' })
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        setFormData(prev => ({ ...prev, [name]: val }))
        setErrors(prev => ({ ...prev, [name]: '' }))
    }

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <div className="flex items-center mb-6">
                            <Calendar className="w-8 h-8 text-blue-500 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Create Event</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                    Event Title
                                </label>
                                <Input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter event title"
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Describe your event"
                                    className={`flex min-h-[80px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.description ? 'border-red-500' : ''}`}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                                )}
                            </div>

                            {/* Event Date */}
                            <div>
                                <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
                                    Event Date
                                </label>
                                <Input
                                    id="event_date"
                                    name="event_date"
                                    type="datetime-local"
                                    value={formData.event_date}
                                    onChange={handleInputChange}
                                    className={errors.event_date ? 'border-red-500' : ''}
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <Input
                                    id="location"
                                    name="location"
                                    type="text"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="Event location"
                                    className={errors.location ? 'border-red-500' : ''}
                                />
                                {errors.location && (
                                    <p className="text-sm text-red-600 mt-1">{errors.location}</p>
                                )}
                            </div>

                            {/* Privacy Options */}
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <ShieldCheck className="w-5 h-5 text-green-500 mr-2" />
                                    Privacy Settings
                                </h3>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_private"
                                        checked={formData.is_private}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Private Event</span>
                                </label>
                            </div>

                            {/* Status */}
                            <div className="flex justify-between items-center space-x-4">
                                <span className="text-sm text-gray-600">
                                    Data will auto-delete after 7 days
                                </span>
                                <Badge variant="secondary">Auto-Delete</Badge>
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-4 pt-4">
                                <Button
                                    type="button"
                                    onClick={() => router.push('/events')}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={createEventLoading}
                                    className="flex-1"
                                >
                                    {createEventLoading ? (
                                        <div className="flex items-center">
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                            <span>Creating...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-4 h-4 mr-2" />
                                            Create Event
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        {errors.general && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center text-red-800">
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    <p className="text-sm font-medium">{errors.general}</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    )
}

export default CreateEventPage
