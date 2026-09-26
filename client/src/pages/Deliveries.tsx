import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { deliveryApi } from '../lib/queries'
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { format } from 'date-fns'

const statusColors: Record<string, string> = {
  DRAFT: 'badge-gray',
  WAITING: 'badge-info',
  READY: 'badge-warning',
  DONE: 'badge-success',
  CANCELED: 'badge-danger',
}

export function Deliveries() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['deliveries', { page, search, status }],
    queryFn: () => deliveryApi.list({ page, limit: 20, search, status }).then(r => r.data),
  })

  const validateMutation = useMutation({
    mutationFn: (id: string) => deliveryApi.validate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast.success('Delivery validated, stock updated')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to validate'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => deliveryApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast.success('Delivery canceled')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to cancel'),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-500">Manage outgoing stock to customers</p>
        </div>
        <Link to="/operations/deliveries/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Delivery
        </Link>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer..." className="input pl-10" />
            </div>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input w-auto">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting</option>
              <option value="READY">Ready</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Warehouse / Location</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Items</th>
                <th className="p-3 font-medium">Created</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No deliveries found</td></tr>
              ) : (
                data?.data.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{delivery.customer}</td>
                    <td className="p-3">{delivery.warehouse?.name} / {delivery.location?.name}</td>
                    <td className="p-3"><span className={clsx('badge', statusColors[delivery.status])}>{delivery.status}</span></td>
                    <td className="p-3">{delivery.lines.length} items</td>
                    <td className="p-3 text-gray-500">{format(new Date(delivery.createdAt), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/operations/deliveries/${delivery.id}/edit`} className="text-primary-600 hover:text-primary-800" title="View/Edit">
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        {delivery.status === 'DRAFT' && (
                          <>
                            <button onClick={() => validateMutation.mutate(delivery.id)} disabled={validateMutation.isPending} className="text-green-600 hover:text-green-800" title="Validate">
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => { if (confirm('Cancel this delivery?')) cancelMutation.mutate(delivery.id) }} disabled={cancelMutation.isPending} className="text-red-600 hover:text-red-800" title="Cancel">
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.meta.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.meta.total)} of {data.meta.total} deliveries</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-outline btn-sm">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === data.meta.totalPages} className="btn-outline btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}