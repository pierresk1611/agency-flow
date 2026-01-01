import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

// Inicializácia s kľúčom z .env
const resend = new Resend(process.env.RESEND_API_KEY)

// Poznámka: Pre produkciu treba overiť doménu v Resend dashboarde.
// Zatiaľ používame default 'onboarding@resend.dev'
const FROM_EMAIL = 'AgencyFlow <onboarding@resend.dev>'

export async function sendDynamicEmail(
    templateSlug: string,
    to: string,
    variables: Record<string, string>
) {
    try {
        // 1. Načítanie šablóny
        const template = await prisma.emailTemplate.findUnique({
            where: { slug: templateSlug }
        })

        if (!template) {
            console.error(`❌ Email template '${templateSlug}' not found in DB!`)
            return false
        }

        // 2. Nahradenie premenných {{variable}}
        let subject = template.subject
        let html = template.body

        Object.entries(variables).forEach(([key, value]) => {
            // Nahradí všetky výskyty {{key}}
            const regex = new RegExp(`{{${key}}}`, 'g')
            subject = subject.replace(regex, value)
            html = html.replace(regex, value)
        })

        // 3. Odoslanie cez Resend
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: [to], // Resend vyžaduje pole
            subject: subject,
            html: html
        })

        console.log(`✅ Email sent: ${templateSlug} to ${to}`, data)
        return true

    } catch (error) {
        console.error('❌ Failed to send email:', error)
        return false
    }
}
