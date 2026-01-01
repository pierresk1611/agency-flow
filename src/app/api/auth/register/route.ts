import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { sendDynamicEmail } from '@/lib/email'

// FORCE LOCAL CONNECTION
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_Aw56YZHlVUhO@ep-calm-violet-aggutujf-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        },
    },
})

// Vlastná implementácia generovania slugu
// Keďže nemôžeme inštalovať nové npm balíky, použijeme jednoduchú funkciu
function generateSlug(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD') // odstráni diakritiku
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')     // nahradí medzery pomlčkou
        .replace(/[^\w\-]+/g, '') // odstráni nealfanumerické znaky
        .replace(/\-\-+/g, '-')   // nahradí viacnásobné pomlčky
        .replace(/^-+/, '')       // oreže pomlčku na začiatku
        .replace(/-+$/, '')       // oreže pomlčku na konci
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { agencyName, adminName, email, password } = body

        // 1. Validácia
        if (!agencyName || !adminName || !email || !password) {
            return NextResponse.json({ error: 'Všetky polia sú povinné' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Heslo musí mať aspoň 6 znakov' }, { status: 400 })
        }

        // 2. Kontrola existujúceho užívateľa
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ error: 'Užívateľ s týmto emailom už existuje' }, { status: 400 })
        }

        // 3. Generovanie slugu
        let slug = generateSlug(agencyName)
        let existingAgency = await prisma.agency.findUnique({ where: { slug } })

        // Ak už slug existuje, pridáme náhodné číslo
        if (existingAgency) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`
        }

        // 4. Hash hesla
        const passwordHash = await bcrypt.hash(password, 10)

        // 5. Transakcia: Vytvor Agentúru a Usera
        const result = await prisma.$transaction(async (tx) => {
            // Vytvoríme agentúru
            const agency = await tx.agency.create({
                data: {
                    name: agencyName,
                    slug: slug,
                    status: 'PENDING',
                    contactName: adminName,
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dní trial
                }
            })

            // Vytvoríme admina (neaktívny)
            const user = await tx.user.create({
                data: {
                    name: adminName,
                    email: email,
                    passwordHash: passwordHash,
                    role: 'ADMIN',
                    active: false, // Dôležité: čaká na schválenie
                    agencyId: agency.id
                }
            })

            return { agency, user }
        })

        // 6. Odoslanie notifikácie Superadminovi
        const recipientEmail = 'super@agencyflow.com'

        await sendDynamicEmail('ADMIN_NEW_REGISTRATION', recipientEmail, {
            agencyName: result.agency.name,
            adminName: result.user.name || '',
            email: result.user.email,
            link: 'https://agency-flow.vercel.app/superadmin/requests'
        })

        return NextResponse.json({
            success: true,
            message: 'Registrácia úspešná. Čakajte na schválenie.',
            agencyId: result.agency.id
        }, { status: 201 })

    } catch (error: any) {
        console.error('REGISTER ERROR:', error)
        return NextResponse.json({ error: 'Interná chyba servera: ' + error.message }, { status: 500 })
    }
}
