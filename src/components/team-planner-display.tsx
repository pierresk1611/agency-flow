'use client'

import { PlannerDisplay } from './planner-display'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserPlanner {
    user: {
        id: string
        name: string | null
        position: string | null
    }
    entries: any[]
}

interface GroupedPlanners {
    category: string
    users: UserPlanner[]
}

export function TeamPlannerDisplay({ groupedPlanners, allJobs, currentUserId }: { groupedPlanners: GroupedPlanners[], allJobs: any[], currentUserId: string }) {

    // 1. Find Current User Planner
    let myPlanner: UserPlanner | undefined

    // Search in groups
    for (const group of groupedPlanners) {
        const found = group.users.find(u => u.user.id === currentUserId)
        if (found) {
            myPlanner = found
            break
        }
    }

    return (
        <div className="space-y-12">
            {/* PINNED CURRENT USER */}
            {myPlanner && (
                <div className="space-y-4 border-b-4 border-slate-100 pb-10">
                    <h3 className="text-xl font-black uppercase tracking-widest text-emerald-600 border-b pb-2 flex items-center gap-2">
                        Môj Plán <Badge className="bg-emerald-600">JA</Badge>
                    </h3>
                    <Card key="me" className="border-2 border-emerald-100 shadow-sm">
                        <CardHeader className="px-4 py-2 flex flex-row items-center gap-4 bg-emerald-50/30">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                                {myPlanner.user.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900">{myPlanner.user.name}</h4>
                                <p className="text-sm text-slate-500 font-medium uppercase">Môj rozvrh</p>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0">
                            <PlannerDisplay
                                initialEntries={myPlanner.entries}
                                allJobs={allJobs}
                                readOnly={false} // CAN EDIT
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TEAM LIST */}
            {groupedPlanners.map((group) => {
                // Filter out current user from the list
                const filteredUsers = group.users.filter(u => u.user.id !== currentUserId)

                if (filteredUsers.length === 0) return null

                return (
                    <div key={group.category} className="space-y-4">
                        <h3 className="text-xl font-black uppercase tracking-widest text-slate-500 border-b pb-2">
                            {group.category}
                        </h3>

                        <div className="space-y-8">
                            {filteredUsers.map((planner) => (
                                <Card key={planner.user.id} className="border-0 shadow-none ring-0">
                                    <CardHeader className="px-0 py-2 flex flex-row items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                            {planner.user.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900">{planner.user.name}</h4>
                                            <p className="text-sm text-slate-500 font-medium uppercase">{planner.user.position || 'Nezaradený'}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-0">
                                        <PlannerDisplay
                                            initialEntries={planner.entries}
                                            allJobs={allJobs}
                                            readOnly={true}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
