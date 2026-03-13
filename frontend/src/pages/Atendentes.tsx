import { useState, useEffect } from 'react'
import { atendentes, setores } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'

export function Atendentes() {
  const [list, setList] = useState<Awaited<ReturnType<typeof atendentes.list>>>([])
  const [setoresList, setSetoresList] = useState<Awaited<ReturnType<typeof setores.list>>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<'admin' | 'atendente'>('atendente')
  const [setorIds, setSetorIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    atendentes.list().then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    setores.list().then(setSetoresList)
  }, [])

  function openCreate() {
    setEditingId(null)
    setEmail('')
    setNome('')
    setSenha('')
    setRole('atendente')
    setSetorIds([])
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: Awaited<ReturnType<typeof atendentes.list>>[0]) {
    setEditingId(item.id)
    setEmail(item.email)
    setNome(item.nome)
    setSenha('')
    setRole((item.role as 'admin') || 'atendente')
    setSetorIds(item.setor_ids ?? [])
    setError('')
    setModalOpen(true)
  }

  function toggleSetor(id: number) {
    setSetorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await atendentes.update(editingId, {
          email,
          nome: nome.trim(),
          role,
          setor_ids: setorIds,
          ...(senha ? { senha } : {}),
        })
      } else {
        if (!senha) throw new Error('Senha obrigatória para novo atendente')
        await atendentes.create({
          email,
          nome: nome.trim(),
          senha,
          role,
          setor_ids: setorIds,
          ativo: true,
        })
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Atendentes</h1>
        <Button onClick={openCreate}>Novo atendente</Button>
      </div>
      <Card>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum atendente cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">{a.nome}</span>
                  <span className="ml-2 text-slate-500">{a.email}</span>
                  <span className="ml-2 text-xs text-slate-400">({a.role})</span>
                </div>
                <Button variant="ghost" onClick={() => openEdit(a)} aria-label="Editar"><IconPencil /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <Card title={editingId ? 'Editar atendente' : 'Novo atendente'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input
                label={editingId ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required={!editingId}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Perfil</label>
                <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'atendente')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="atendente">Atendente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {role === 'atendente' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Setores</label>
                  <div className="flex flex-wrap gap-2">
                    {setoresList.map((s) => (
                      <label key={s.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={setorIds.includes(s.id)}
                          onChange={() => toggleSetor(s.id)}
                        />
                        <span>{s.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" loading={saving}>Salvar</Button>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
