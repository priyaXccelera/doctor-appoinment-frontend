import { useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmDialog, EmptyState, ErrorState, Field, ListSkeleton, Modal, PageHeader, Spinner } from '../components/ui'
import { createFamilyMember, deleteFamilyMember, getFamilyMembers, updateFamilyMember } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import type { FamilyMember } from '../types'
import { errorMessage } from '../utils/errors'
import { ageFromDob, todayISO } from '../utils/format'
import { validateRequired } from '../validation'

const RELATIONS = ['Spouse', 'Mother', 'Father', 'Son', 'Daughter', 'Sibling', 'Other']
const EMPTY = { name: '', relation: 'Spouse', dateOfBirth: '', gender: 'Female' }

export function FamilyMembers() {
  useDocumentMeta('Family members')
  const { data, loading, error, reload } = useAsync(getFamilyMembers)
  const [editing, setEditing] = useState<FamilyMember | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [toDelete, setToDelete] = useState<FamilyMember | null>(null)

  const errors = {
    name: validateRequired(form.name, 'Name'),
    dateOfBirth: form.dateOfBirth ? '' : 'Date of birth is required',
  }
  const isValid = !errors.name && !errors.dateOfBirth

  const open = (member: FamilyMember | 'new') => {
    setEditing(member)
    setSubmitted(false)
    setFormError('')
    setForm(member === 'new' ? EMPTY : { name: member.name, relation: member.relation, dateOfBirth: member.dateOfBirth, gender: member.gender })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid) return
    setSaving(true)
    try {
      if (editing === 'new') await createFamilyMember(form)
      else if (editing) await updateFamilyMember(editing.id, form)
      toast.success('Family member saved')
      setEditing(null)
      reload()
    } catch (caught) {
      setFormError(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    await deleteFamilyMember(toDelete.id)
    toast.success('Family member removed')
    setToDelete(null)
    reload()
  }

  const members = data ?? []

  return (
    <div>
      <PageHeader title="Family members" subtitle="Book appointments on behalf of your family." actions={<button type="button" className="btn-primary" onClick={() => open('new')}><Plus size={16} /> Add member</button>} />
      {loading && <ListSkeleton rows={2} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && members.length === 0 && <EmptyState title="No family members yet" hint="Add a member to book on their behalf." />}
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((member) => (
          <article key={member.id} className="card flex items-center justify-between gap-2 p-4">
            <div>
              <p className="font-bold">{member.name}</p>
              <p className="text-sm text-muted">{member.relation} · {ageFromDob(member.dateOfBirth)} yrs · {member.gender}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost" onClick={() => open(member)} aria-label={`Edit ${member.name}`}><Pencil size={16} /></button>
              <button type="button" className="btn-danger" onClick={() => setToDelete(member)} aria-label={`Delete ${member.name}`}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>

      <Modal open={editing !== null} title={editing === 'new' ? 'Add family member' : 'Edit family member'} onClose={() => setEditing(null)}>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <Field label="Name" error={submitted ? errors.name : ''}>
            {(props) => <input {...props} className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />}
          </Field>
          <Field label="Relation">
            {(props) => (
              <select {...props} className="input" value={form.relation} onChange={(event) => setForm({ ...form, relation: event.target.value })}>
                {RELATIONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            )}
          </Field>
          <Field label="Date of birth" error={submitted ? errors.dateOfBirth : ''}>
            {(props) => <input {...props} type="date" max={todayISO()} className="input" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} />}
          </Field>
          <Field label="Gender">
            {(props) => (
              <select {...props} className="input" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            )}
          </Field>
          {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving && <Spinner />} Save</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={toDelete !== null} title="Remove family member?" message={`${toDelete?.name ?? 'This member'} will no longer be available when booking.`} confirmLabel="Remove" danger onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  )
}
