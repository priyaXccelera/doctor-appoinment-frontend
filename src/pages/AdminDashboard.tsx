import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErrorState, Field, PageHeader, Skeleton, Stat } from '../components/ui'
import { getAdminAnalytics } from '../data/adminStore'
import { useAsync, useDocumentMeta } from '../hooks'
import { addDaysISO, formatINR, todayISO } from '../utils/format'

const COLORS = ['#0f766e', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6']

export function AdminDashboard() {
  useDocumentMeta('Admin dashboard')
  const [from, setFrom] = useState(addDaysISO(todayISO(), -29))
  const [to, setTo] = useState(todayISO())
  const { data, loading, error, reload } = useAsync(() => getAdminAnalytics(from, to), [from, to])

  return (
    <div>
      <PageHeader title="Admin dashboard" />
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-4">
        <Field label="From">{(props) => <input {...props} type="date" className="input" value={from} max={to} onChange={(event) => setFrom(event.target.value)} />}</Field>
        <Field label="To">{(props) => <input {...props} type="date" className="input" value={to} min={from} onChange={(event) => setTo(event.target.value)} />}</Field>
      </div>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}
      {data && !loading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Bookings" value={data.totals.bookings} />
            <Stat label="Revenue" value={formatINR(data.totals.revenue)} />
            <Stat label="Commission" value={formatINR(data.totals.commission)} />
            <Stat label="Cancellation rate" value={`${data.cancellationRate}%`} />
            <Stat label="No-show rate" value={`${data.noShowRate}%`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card h-72 p-4" aria-label="Bookings over time">
              <h2 className="mb-2 font-bold">Bookings over time</h2>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data.bookings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" />
                  <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bookings" stroke="#0f766e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </section>
            <section className="card h-72 p-4" aria-label="Revenue and commission">
              <h2 className="mb-2 font-bold">Revenue &amp; commission</h2>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={data.revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" />
                  <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" fill="#0ea5e955" name="Revenue" />
                  <Area type="monotone" dataKey="commission" stroke="#0f766e" fill="#0f766e55" name="Commission" />
                </AreaChart>
              </ResponsiveContainer>
            </section>
            <section className="card h-72 p-4" aria-label="Top doctors">
              <h2 className="mb-2 font-bold">Top doctors</h2>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data.topDoctors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={110} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#0f766e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
            <section className="card h-72 p-4" aria-label="Specialty demand">
              <h2 className="mb-2 font-bold">Specialty demand</h2>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={data.specialtyDemand} dataKey="value" nameKey="name" outerRadius={85} label>
                    {data.specialtyDemand.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
