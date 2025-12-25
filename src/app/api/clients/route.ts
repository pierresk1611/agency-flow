import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// PATCH: Aktualizácia údajov klienta
export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, priority, scope } = body

    // Spracovanie scope (ak je pole, spojíme ho na string)
    const scopeString = Array.isArray(scope) ? scope.join(', ') : (scope || "")

    const updatedClient = await prisma.client.update({
      where: { id: params.clientId },
      data: {
        name,
        priority: parseInt(priority),
        scope: scopeString
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Update client error:", error)
    return NextResponse.json({ error: 'Chyba pri aktualizácii' }, { status: 500 })
  }
}