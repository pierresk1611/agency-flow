'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Pencil, Save, X } from 'lucide-react'

interface EmailTemplate {
    id: string
    slug: string
    name: string
    subject: string
    body: string
    description: string
    updatedAt: string
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
    const [saving, setSaving] = useState(false)

    // Fetch templates
    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/superadmin/templates')
            const data = await res.json()
            if (res.ok) {
                setTemplates(data)
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTemplates()
    }, [])

    const handleSave = async () => {
        if (!editingTemplate) return

        setSaving(true)
        try {
            const res = await fetch('/api/superadmin/templates', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingTemplate.id,
                    subject: editingTemplate.subject,
                    htmlBody: editingTemplate.body
                })
            })

            if (res.ok) {
                await fetchTemplates()
                setEditingTemplate(null)
            } else {
                alert('Chyba pri ukladaní')
            }
        } catch (error) {
            console.error('Save error:', error)
            alert('Chyba pri ukladaní')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">E-mailové šablóny</h1>
                    <p className="text-muted-foreground">Správa textov transakčných emailov.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Zoznam šablón</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Názov</TableHead>
                                <TableHead>Predmet</TableHead>
                                <TableHead className="w-[100px]">Akcia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">
                                        <div>{template.name}</div>
                                        <div className="text-xs text-muted-foreground">{template.slug}</div>
                                    </TableCell>
                                    <TableCell>{template.subject}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => setEditingTemplate(template)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Upraviť
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Upraviť šablónu: {editingTemplate?.name}</DialogTitle>
                        <DialogDescription>
                            Dostupné premenné: <code className="bg-slate-100 px-1 rounded">{editingTemplate?.description}</code>
                        </DialogDescription>
                    </DialogHeader>

                    {editingTemplate && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Predmet</Label>
                                <Input
                                    id="subject"
                                    value={editingTemplate.subject}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="body">HTML Obsah</Label>
                                <Textarea
                                    id="body"
                                    rows={15}
                                    className="font-mono text-xs"
                                    value={editingTemplate.body}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tip: Používajte štandardné HTML tagy (h1, p, ul, li, a).
                                </p>
                            </div>

                            <div className="border p-4 rounded-md bg-slate-50">
                                <Label className="mb-2 block">Náhľad (približný)</Label>
                                <div
                                    className="prose prose-sm max-w-none bg-white p-4 border rounded shadow-sm"
                                    dangerouslySetInnerHTML={{ __html: editingTemplate.body }}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                            Zrušiť
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Uložiť zmeny
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
