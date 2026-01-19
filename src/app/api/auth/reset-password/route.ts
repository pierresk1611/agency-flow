
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json()

        if (!token || !password) {
            return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Heslo je príliš krátke' }, { status: 400 })
        }

        // Nájsť usera podľa tokenu A platnosti
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Token je neplatný alebo exspiroval' }, { status: 400 })
        }

        // Update hesla
        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        })

        return NextResponse.json({ message: 'Heslo úspešne zmenené' })

    } catch (error) {
        console.error('Reset Password Error:', error)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
