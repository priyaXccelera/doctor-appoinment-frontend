import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmDialog, EmptyState, ErrorState, Field, ListSkeleton, Modal, PageHeader, Spinner, Tabs } from '../components/ui'
import { createMasterItem, deleteMasterItem, updateMasterItem } from '../data/adminStore'
import { getMaster, getSpecialties } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import type { MasterItem, MasterType } from '../types'
import { errorMessage } from '../utils/errors'
import { validateRequired } from '../validation'

const LABELS: Record<MasterType, { title: string; extra: string }> = {
  specialties: { title: 'Specialty', extra: '' },
  symptoms: { title: 'Symptom', extra: 'Mapped specialty' },
  cities: { title: 'City', extra: 'Coordinates (lat,lng)' },
}

export function AdminMasterData() {
  useDocumentMeta('Master data')
  const [type, setType] = useState<MasterType>('specialties')
  const { data, loading, error, reload } = useAsync(() => getMaster(type), [type])
  const specialties = useAsync(getSpecialties)
  const [editing, setEditing] = useState<MasterItem | 'new' | null>(null)
  const [name, setName] = useState('')
  const [extra, setExtra] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<MasterItem | null>(null)

  const nameError = validateRequired(name, 'Name')
  const open = (item: MasterItem | 'new') => {
    setEditing(item)
    setName(item === 'new' ? '' : item.name)
    setExtra(item === 'new' ? '' : (item.extra ?? ''))
    setSubmitted(false)
  }

  const save = async () => {
    setSubmitted(true)
    if (nameError) return
    setSaving(true)
    try {
      if (editing === 'new') await createMasterItem(type, name.trim(), extra)
      else if (editing) await updateMasterItem(type, editing.id, name.trim(), extra)
      toast.success(`${LABELS[type].title} saved`)
      setEditing(null)
      reload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const items = data ?? []

  return (
    <div>
      <PageHeader title="Master data" actions={<button type="button" className="btn-primary" onClick={() => open('new')}><Plus size={16} /> Add {LABELS[type].title.toLowerCase()}</button>} />
      <Tabs<MasterType> tabs={[{ id: 'specialties', label: 'Specialties' }, { id: 'symptoms', label: 'Symptom mapping' }, { id: 'cities', label: 'Cities' }]} active={type} onChange={setType} />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title={`No ${type} yet`} />}
      {items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Name</th>{LABELS[type].extra && <th>{LABELS[type].extra}</th>}<th className="text-right"><span className="pr-3">Actions</span></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="p-3 font-medium">{item.name}</td>
                  {LABELS[type].extra && <td>{item.extra}</td>}
                  <td className="space-x-2 p-3 text-right">
                    <button type="button" className="btn-ghost" aria-label={`Edit ${item.name}`} onClick={() => open(item)}><Pencil size={14} /></button>
                    <button type="button" className="btn-danger" aria-label={`Delete ${item.name}`} onClick={() => setToDelete(item)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={editing !== null} title={`${editing === 'new' ? 'Add' : 'Edit'} ${LABELS[type].title.toLowerCase()}`} onClose={() => setEditing(null)} footer={<><button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="button" className="btn-primary" disabled={saving} onClick={save}>{saving && <Spinner />} Save</button></>}>
        <div className="space-y-3">
          <Field label="Name" error={submitted ? nameError : ''}>{(props) => <input {...props} className="input" value={name} onChange={(event) => setName(event.target.value)} />}</Field>
          {type === 'symptoms' && (
            <Field label="Mapped specialty">
              {(props) => (
                <select {...props} className="input" value={extra} onChange={(event) => setExtra(event.target.value)}>
                  <option value="">Select specialty</option>
                  {(specialties.data ?? []).map((item) => <option key={item.id}>{item.name}</option>)}
                </select>
              )}
            </Field>
          )}
          {type === 'cities' && <Field label="Coordinates (lat,lng)" hint="e.g. 12.9716,77.5946">{(props) => <input {...props} className="input" value={extra} onChange={(event) => setExtra(event.target.value)} />}</Field>}
        </div>
      </Modal>
      <ConfirmDialog open={toDelete !== null} title={`Delete ${LABELS[type].title.toLowerCase()}?`} message={`"${toDelete?.name ?? ''}" will be removed from search and filters.`} confirmLabel="Delete" danger onCancel={() => setToDelete(null)} onConfirm={async () => { if (toDelete) { await deleteMasterItem(type, toDelete.id); toast.success('Deleted'); setToDelete(null); reload() } }} />
    </div>
  )
}
