import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const includeJobs = searchParams.get('includeJobs') === 'true'

    const users = await prisma.user.findMany({
      where: { 
        agencyId: session.agencyId,
        active: true 
      },
      orderBy: { email: 'asc' },
      include: includeJobs ? {
        assignments: {
            where: { 
                job: { 
                    status: { not: 'DONE' }, 
                    archivedAt: null 
                } 
            },
            include: { 
                job: { 
                    include: { 
                        campaign: { 
                            include: { client: true } 
                        } 
                    } 
                } 
            }
        }
      } : undefined
    })
    
    return NextResponse.json(users)
  } catch (error: any) {
    console.error("GET USERS ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { email, name, password, role, position, hourlyRate, costRate } = body

    if (!email || !password || !role) return NextResponse.json({ error: 'Chýbajú údaje' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Užívateľ s týmto emailom už existuje' }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 10)
    
    const newUser = await prisma.user.create({
      data: {
        email, 
        name, 
        position, 
        role, 
        passwordHash,
        hourlyRate: parseFloat(hourlyRate || '0'),
        costRate: parseFloat(costRate || '0'),
        agencyId: session.agencyId,
        active: true
      }
    })

    return NextResponse.json(newUser)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}