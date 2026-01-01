'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AgencyRequest {
    id: string
    name: string
    slug: string
    createdAt: string
    contactName: string
    email: string
}

export default function SuperAdminRequestsPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<AgencyRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchRequests = async () => {
        try {
            const token = document.cookie
                .split('; ')
                .find((row) => row.startsWith('token='))
                ?.split('=')[1]

            if (!token) {
                // Redirect if not logged in (simplified check)
                router.push('/login')
                return
            }

            const res = await fetch('/api/superadmin/requests', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.status === 401) {
                setError('Neautorizovaný prístup. Vyžaduje sa rola SUPERADMIN.')
                setLoading(false)
                return
            }

            if (!res.ok) throw new Error('Chyba pri načítaní dát')

            const data = await res.json()
            setRequests(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleAction = async (agencyId: string, action: 'APPROVE' | 'REJECT') => {
        try {
            const token = document.cookie
                .split('; ')
                .find((row) => row.startsWith('token='))
                ?.split('=')[1]

            const res = await fetch('/api/superadmin/requests', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ agencyId, action })
            })

            if (!res.ok) throw new Error('Akcia zlyhala')

            // Refresh list
            fetchRequests()
        } catch (err: any) {
            alert(err.message)
        }
    }

    if (loading) return <div className="p-8">Načítavam...</div>

    if (error) return (
        <div className="p-8">
            <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
            <button onClick={() => router.push('/dashboard')} className="text-blue-600 underline">Späť na dashboard</button>
        </div>
    )

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Žiadosti o registráciu</h1>

            {requests.length === 0 ? (
                <p className="text-gray-500">Žiadne čakajúce žiadosti.</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                                    <p className="text-sm text-gray-500">@{request.slug}</p>
                                </div>
                                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                    PENDING
                                </span>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="text-sm">
                                    <span className="text-gray-500">Kontakt:</span>{' '}
                                    <span className="font-medium">{request.contactName}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-gray-500">Email:</span>{' '}
                                    <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">{request.email}</a>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {new Date(request.createdAt).toLocaleDateString('sk-SK')}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAction(request.id, 'APPROVE')}
                                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-500 transition-colors"
                                >
                                    Schváliť
                                </button>
                                <button
                                    onClick={() => handleAction(request.id, 'REJECT')}
                                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-500 transition-colors"
                                >
                                    Zamietnuť
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
