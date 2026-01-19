
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendDynamicEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email je povinný' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { agency: true } // Need agency slug for context? Not really, just absolute link
        })

        if (!user) {
            // Bezpečnosť: Nevracať chybu ak email neexistuje, aby sa nedali enumerovať emaily
            return NextResponse.json({ message: 'Ak email existuje, poslali sme inštrukcie.' })
        }

        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hodina

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpiry: expiresAt
            }
        })

        // Zabezpečenie existencie šablóny (Lazy Seed)
        const templateSlug = 'reset-password'
        const existingTemplate = await prisma.emailTemplate.findUnique({ where: { slug: templateSlug } })

        if (!existingTemplate) {
            await prisma.emailTemplate.create({
                data: {
                    slug: templateSlug,
                    name: 'Reset Password',
                    subject: 'Obnova hesla | AgencyFlow',
                    body: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Dobrý deň, {{name}}</h2>
    <p>Dostali sme požiadavku na obnovu vášho hesla.</p>
    <p>Pre pokračovanie kliknite na tlačidlo nižšie:</p>
    <p style="text-align: center; margin: 30px 0;">
        <a href="{{link}}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Obnoviť heslo</a>
    </p>
    <p>Odkaz je platný 60 minút.</p>
    <p style="font-size: 12px; color: #888;">Ak ste o zmenu nežiadali, tento email ignorujte.</p>
</div>
                    `
                }
            })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' // Fail-safe
        // Better to verify if env is set, or request.url
        // Use request headers origin if not set?
        // Let's rely on NEXT_PUBLIC_APP_URL or fallback.

        const resetLink = `${appUrl}/reset-password?token=${token}`

        const sent = await sendDynamicEmail(templateSlug, email, {
            name: user.name || 'Užívateľ',
            link: resetLink
        })

        if (!sent) {
            console.error("Failed to send reset email via Resend")
            // Aj tak vrátime success userovi pre bezpečnosť? Alebo error 500?
            // Vrátime success, user to skúsi znova ak nepríde.
        }

        return NextResponse.json({ message: 'Email odoslaný' })

    } catch (error) {
        console.error('Forgot Password Error:', error)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
