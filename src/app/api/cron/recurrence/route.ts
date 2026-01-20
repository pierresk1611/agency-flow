import { checkAndSpawnRecurringJobs } from '@/lib/recurrence'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Optional: Add authentication via a secret token if this is public
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

        const result = await checkAndSpawnRecurringJobs()

        return NextResponse.json({
            success: true,
            ...result
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
