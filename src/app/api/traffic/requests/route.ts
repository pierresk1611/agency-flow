export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userJobFilter = session.role === 'CREATIVE' ? { 
        assignments: { some: { userId: session.userId, job: { status: { not: 'DONE' }, archivedAt: null } } }
    } : {}

    const rawUsers = await prisma.user.findMany({
      where: { agencyId: session.agencyId, active: true },
      orderBy: { position: 'asc' },
      select: {
        id: true, email: true, name: true, position: true, role: true,
        assignments: { where: userJobFilter.assignments || {}, include: { job: { select: { id: true, title: true, deadline: true, campaign: { select: { name: true, client: { select: { name: true } } } } } } } }
      }
    })

    const serializedUsers = JSON.parse(JSON.stringify(rawUsers))

    const usersByPosition = serializedUsers.reduce<Record<string, typeof serializedUsers[0][]>>((acc, user) => {
      const pos = user.position || "Ostatní"
      if (!acc[pos]) acc[pos] = []
      acc[pos].push(user)
      return acc
    }, {})

    return NextResponse.json({ users: serializedUsers, usersByPosition })

  } catch (error: any) {
    console.error("CRITICAL TRAFFIC FETCH ERROR:", error)
    return NextResponse.json({ error: 'Chyba servera pri načítaní vyťaženosti: ' + error.message }, { status: 500 })
  }
}
