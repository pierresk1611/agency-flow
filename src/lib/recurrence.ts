import { prisma } from '@/lib/prisma'

/**
 * Checks for recurring jobs that need to be spawned and creates new instances.
 * updates the original job's nextRecurrence date.
 */
export async function checkAndSpawnRecurringJobs() {
    const now = new Date()

    // 1. Find jobs that are recurring and due
    const jobsToRecur = await prisma.job.findMany({
        where: {
            // @ts-ignore
            recurrenceInterval: { gt: 0 },
            // @ts-ignore
            nextRunAt: { lte: now },
            // Optional: Ensure original job is not archived? 
            // Usually we want recurrence to continue until explicitly stopped or archived.
            archivedAt: null
        },
        include: {
            assignments: true // We might want to copy assignments too
        }
    }) as any[]

    const results = {
        checked: jobsToRecur.length,
        created: 0,
        errors: [] as string[]
    }

    for (const job of jobsToRecur) {
        try {
            // Calculate new dates
            // If nextRunAt was "yesterday", and interval is 7 days, next should be yesterday + 7 days
            // The NEW job's deadline should probably be based on the schedule, not "today".
            // Implementation choice: New Job Deadline = Job.nextRunAt + 1 day? Or just nextRunAt?
            // Usually if I have a weekly task on Friday, nextRunAt is next Friday. 
            // So the new job should have deadline = nextRunAt.

            const newJobDeadline = job.nextRunAt || now

            // 2. Create the new job
            const newJob = await prisma.job.create({
                data: {
                    title: job.title,
                    campaignId: job.campaignId,
                    status: 'TODO',
                    deadline: newJobDeadline,
                    budget: job.budget,
                    // The new job itself is NOT recurring by default to prevent infinite cascades 
                    // if logic isn't careful. OR it could be recurring but we rely on the PARENT to check.
                    // Better approach: Only the "Master" job spawns children. 
                    // Children are just single instances.
                    // @ts-ignore
                    recurrenceInterval: 0,
                    // @ts-ignore
                    nextRunAt: null,

                    // Copy assignments
                    assignments: {
                        create: job.assignments.map((a: any) => ({
                            userId: a.userId,
                            roleOnJob: a.roleOnJob,
                            assignedCostType: a.assignedCostType,
                            assignedCostValue: a.assignedCostValue,
                            assignedBillingValue: a.assignedBillingValue
                        }))
                    }
                },
                include: {
                    assignments: true // Return assignments so we can map them to planner
                }
            })

            // 2.5 Create Planner Entries for assigned users
            // We want to ensure it appears in their planner for the deadline date
            // @ts-ignore
            if (newJob.assignments && newJob.assignments.length > 0) {
                await prisma.plannerEntry.createMany({
                    // @ts-ignore
                    data: newJob.assignments.map((assignment: any) => ({
                        userId: assignment.userId,
                        jobId: newJob.id,
                        date: newJobDeadline,
                        minutes: 60, // Default duration
                        title: newJob.title,
                        isDone: false
                    }))
                })
            }

            // 3. Update the original job's nextRunAt
            // nextRunAt = nextRunAt + interval
            const intervalDays = job.recurrenceInterval || 7
            const nextDate = new Date(newJobDeadline.getTime() + intervalDays * 24 * 60 * 60 * 1000)

            await prisma.job.update({
                where: { id: job.id },
                data: {
                    // @ts-ignore
                    nextRunAt: nextDate
                }
            })

            results.created++
        } catch (error: any) {
            console.error(`Failed to recur job ${job.id}:`, error)
            results.errors.push(`Job ${job.id}: ${error.message}`)
        }
    }

    return results
}
