import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi } from '../lib/queries'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon, ArrowPathIcon, ArrowPathIcon as RefreshIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export function Products() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', { page, search }],
    queryFn: () => productApi.list({ page, limit: 20, search }).then(r => r.data),
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    refetch()
    toast.success('Products refreshed')
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product archived')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to archive'),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Products</h1>
          <p className="text-surface-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isLoading} className="btn-icon btn-ghost text-surface-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200" title="Refresh products">
            <RefreshIcon className={clsx('h-5 w-5 transition-transform duration-300', isLoading && 'animate-spin')} />
          </button>
          <Link to="/products/new" className="btn-primary">
            <PlusIcon className="h-5 w-5" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-xl">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="input pl-12 pr-4"
              />
            </div>
            <button type="submit" className="btn-ghost hidden sm:flex">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-36">SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th className="w-24">UoM</th>
                <th className="w-32 text-right">Reorder Point</th>
                <th className="w-32">Status</th>
                <th className="w-48 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="skeleton w-24 h-4"></td>
                    <td className="skeleton w-40 h-4"></td>
                    <td className="skeleton w-28 h-4"></td>
                    <td className="skeleton w-16 h-4"></td>
                    <td className="skeleton w-20 h-4"></td>
                    <td className="skeleton w-20 h-4"></td>
                    <td className="skeleton w-12 h-4"></td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 empty-state">
                    <div className="empty-state-icon">
                      <svg className="w-12 h-12 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="empty-state-title">No products found</p>
                    <p className="empty-state-description">Get started by adding your first product</p>
                    <Link to="/products/new" className="btn-primary mt-4">
                      <PlusIcon className="h-4 w-4" />
                      Add Product
                    </Link>
                  </td>
                </tr>
              ) : (
                data?.data.map((product) => (
                  <tr key={product.id} className="hover:bg-primary-50/50 transition-colors duration-150">
                    <td className="font-mono text-sm text-surface-700">{product.sku}</td>
                    <td className="font-medium text-surface-900">{product.name}</td>
                    <td className="text-surface-600">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="text-surface-600">
                      <span className="px-2 py-0.5 rounded-lg bg-surface-100 text-surface-700 text-xs font-mono">{product.uom?.symbol}</span>
                    </td>
                    <td className="text-right font-mono tabular-nums text-surface-600">{product.reorderPoint}</td>
                    <td>
                      <span className={clsx('badge-dot', product.isActive ? 'badge-success' : 'badge-gray')}>
                        {product.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/products/${product.id}/edit`} className="btn-icon btn-ghost text-surface-500 hover:text-primary-600 hover:bg-primary-50" title="Edit">
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <Link to={`/products/${product.id}/stock`} className="btn-icon btn-ghost text-surface-500 hover:text-primary-600 hover:bg-primary-50" title="View Stock">
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link to={`/products/${product.id}/moves`} className="btn-icon btn-ghost text-surface-500 hover:text-primary-600 hover:bg-primary-50" title="Movement History">
                          <ArrowPathIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('Archive this product? This action cannot be undone.')) deleteMutation.mutate(product.id)
                          }}
                          disabled={deleteMutation.isPending}
                          className="btn-icon btn-ghost text-surface-500 hover:text-danger-600 hover:bg-danger-50"
                          title="Archive"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
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
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.meta.total)} of {data.meta.total} products
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="btn-outline btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === data.meta.totalPages}
                className="btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}