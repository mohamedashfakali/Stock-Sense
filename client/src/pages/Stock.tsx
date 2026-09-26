import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { stockApi, warehouseApi, locationApi, categoryApi, productApi } from '../lib/queries'
import { MagnifyingGlassIcon, FunnelIcon, BuildingOfficeIcon, CubeIcon, ArrowPathIcon, TagIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { format } from 'date-fns'

export function Stock() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehouseApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.list({ limit: 100 }).then(r => r.data.data) })

  const { data: locations } = useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: () => locationApi.list({ warehouseId, limit: 100 }).then(r => r.data.data),
    enabled: !!warehouseId,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['stock', { page, search, warehouseId, locationId, categoryId, lowStockOnly }],
    queryFn: () => stockApi.list({ page, limit: 50, search, warehouseId, locationId, categoryId, lowStockOnly }).then(r => r.data),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Stock Ledger</h1>
          <p className="text-surface-500 mt-1">View current stock levels across all locations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-soft"></span>
            Live
          </span>
        </div>
      </div>

      <div className="card p-4 border-b border-surface-200">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="input pl-12 pr-4" />
          </div>
          <div>
            <label className="label">Warehouse</label>
            <select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setLocationId(''); setPage(1) }} className="select">
              <option value="">All Warehouses</option>
              {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select value={locationId} onChange={e => { setLocationId(e.target.value); setPage(1) }} className="select" disabled={!locations?.length}>
              <option value="">All Locations</option>
              {locations?.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1) }} className="select">
              <option value="">All Categories</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lowStockOnly} onChange={e => { setLowStockOnly(e.target.checked); setPage(1) }} className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
              <span className="text-sm text-surface-700">Low stock only</span>
            </label>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-40">Product</th>
                <th className="w-32">SKU</th>
                <th>Category</th>
                <th>Warehouse / Location</th>
                <th className="text-right w-36">Qty on Hand</th>
                <th className="text-right w-28">Reorder Point</th>
                <th className="w-32">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="skeleton w-32 h-4"></td>
                    <td className="skeleton w-24 h-4"></td>
                    <td className="skeleton w-24 h-4"></td>
                    <td className="skeleton w-32 h-4"></td>
                    <td className="skeleton w-24 h-4"></td>
                    <td className="skeleton w-20 h-4"></td>
                    <td className="skeleton w-20 h-4"></td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 empty-state">
                    <CubeIcon className="empty-state-icon" />
                    <p className="empty-state-title">No stock records found</p>
                    <p className="empty-state-description">Try adjusting your filters or add products to see stock levels</p>
                  </td>
                </tr>
              ) : (
                data?.data.map((item) => (
                  <tr key={`${item.product.id}-${item.location.id}`} className="hover:bg-primary-50/50 transition-colors duration-150">
                    <td className="font-medium text-surface-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                          <CubeIcon className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-surface-500">{item.product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-surface-600">{item.product.sku}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                        <TagIcon className="w-3 h-3" />
                        {item.product.category?.name}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-surface-400" />
                        <span className="text-sm text-surface-600">{item.location.warehouse?.name} / {item.location.name}</span>
                      </div>
                    </td>
                    <td className="text-right font-mono tabular-nums text-surface-900">
                      <span className="font-medium">{item.quantity.toLocaleString()}</span>
                      <span className="text-xs text-surface-400 ml-1">{item.product.uom?.symbol}</span>
                    </td>
                    <td className="text-right font-mono tabular-nums text-surface-600">{item.reorderPoint}</td>
                    <td>
                      <span className={clsx('badge-dot', item.isLowStock ? 'badge-danger' : 'badge-success')}>
                        {item.isLowStock ? 'Low Stock' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.meta.totalPages > 1 && (
          <div className="card-footer">
            <p className="text-sm text-surface-500">
              Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.meta.total)} of {data.meta.total} records
            </p>
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