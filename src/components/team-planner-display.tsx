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

export function TeamPlannerDisplay({ groupedPlanners, allJobs }: { groupedPlanners: GroupedPlanners[], allJobs: any[] }) {
    return (
        <div className="space-y-12">
            {groupedPlanners.map((group) => (
                <div key={group.category} className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-widest text-slate-500 border-b pb-2">
                        {group.category}
                    </h3>

                    <div className="space-y-8">
                        {group.users.map((planner) => (
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
            ))}
        </div>
    )
}
