import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { warehouseApi, locationApi, categoryApi, uomApi, userApi } from '../lib/queries'
import { PlusIcon, PencilIcon, TrashIcon, HomeIcon, CubeIcon, Cog6ToothIcon, UserGroupIcon, BuildingOfficeIcon, ArrowLeftIcon, CheckIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import toast from 'react-hot-toast'

const warehouseSchema = z.object({ name: z.string().min(1), code: z.string().min(1), address: z.string().optional() })
const locationSchema = z.object({ name: z.string().min(1), code: z.string().min(1), type: z.enum(['STORAGE','PRODUCTION','RECEIVING','SHIPPING','QUARANTINE']), warehouseId: z.string().min(1), parentId: z.string().optional() })
const categorySchema = z.object({ name: z.string().min(1), description: z.string().optional() })
const uomSchema = z.object({ name: z.string().min(1), symbol: z.string().min(1), description: z.string().optional() })
const userSchema = z.object({ email: z.string().email(), name: z.string().min(2), role: z.enum(['ADMIN','MANAGER','STAFF','VIEWER']), avatarUrl: z.string().url().optional().or(z.literal('')) })

type WarehouseForm = z.infer<typeof warehouseSchema>
type LocationForm = z.infer<typeof locationSchema>
type CategoryForm = z.infer<typeof categorySchema>
type UomForm = z.infer<typeof uomSchema>
type UserForm = z.infer<typeof userSchema>

const tabs = [
  { id: 'warehouses', label: 'Warehouses', icon: BuildingOfficeIcon, color: 'primary' },
  { id: 'locations', label: 'Locations', icon: CubeIcon, color: 'success' },
  { id: 'categories', label: 'Categories', icon: TagIcon, color: 'accent' },
  { id: 'uoms', label: 'Units of Measure', icon: Cog6ToothIcon, color: 'warning' },
  { id: 'users', label: 'Profiles', icon: UserGroupIcon, color: 'primary' },
] as const

export function Settings() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'warehouses' | 'locations' | 'categories' | 'uoms' | 'users'>('warehouses')
  const [editItem, setEditItem] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/settings/')) {
      const tab = path.replace('/settings/', '')
      if (['warehouses', 'locations', 'categories', 'uoms', 'users'].includes(tab)) {
        setActiveTab(tab as any)
      }
    }
  }, [location.pathname])

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehouseApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => locationApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: uoms } = useQuery({ queryKey: ['uoms'], queryFn: () => uomApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => userApi.list({ limit: 100 }).then(r => r.data.data) })

  const warehouseMutation = useMutation({
    mutationFn: (data: WarehouseForm & { id?: string }) => data.id ? warehouseApi.update(data.id, data) : warehouseApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Saved'); closeDialog() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const locationMutation = useMutation({
    mutationFn: (data: LocationForm & { id?: string }) => data.id ? locationApi.update(data.id, data) : locationApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['locations'] }); toast.success('Saved'); closeDialog() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const categoryMutation = useMutation({
    mutationFn: (data: CategoryForm & { id?: string }) => data.id ? categoryApi.update(data.id, data) : categoryApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Saved'); closeDialog() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const uomMutation = useMutation({
    mutationFn: (data: UomForm & { id?: string }) => data.id ? uomApi.update(data.id, data) : uomApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['uoms'] }); toast.success('Saved'); closeDialog() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteWarehouse = useMutation({ mutationFn: (id: string) => warehouseApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }) })
  const deleteLocation = useMutation({ mutationFn: (id: string) => locationApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locations'] }) })
  const deleteCategory = useMutation({ mutationFn: (id: string) => categoryApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }) })
  const deleteUom = useMutation({ mutationFn: (id: string) => uomApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['uoms'] }) })
  const deleteUser = useMutation({ mutationFn: (id: string) => userApi.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }) })

  const userMutation = useMutation({
    mutationFn: (data: UserForm & { id?: string }) => data.id ? userApi.update(data.id, data) : userApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Saved'); closeDialog() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const openDialog = (item?: any) => {
    setEditItem(item || null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditItem(null)
    resetForm()
  }

  const { register, handleSubmit, reset, setValue, formState: { errors: formErrors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: getDefaults(),
  })
  const errors = formErrors as any

  function getSchema() {
    switch (activeTab) {
      case 'warehouses': return warehouseSchema
      case 'locations': return locationSchema
      case 'categories': return categorySchema
      case 'uoms': return uomSchema
      case 'users': return userSchema
    }
  }

  function getDefaults() {
    switch (activeTab) {
      case 'warehouses': return { name: '', code: '', address: '' }
      case 'locations': return { name: '', code: '', type: 'STORAGE', warehouseId: '', parentId: '' }
      case 'categories': return { name: '', description: '' }
      case 'uoms': return { name: '', symbol: '', description: '' }
      case 'users': return { email: '', name: '', role: 'STAFF', avatarUrl: '' }
    }
  }

  function resetForm() {
    reset(getDefaults())
  }

  useEffect(() => {
    if (editItem) {
      reset(editItem)
    } else {
      resetForm()
    }
  }, [editItem, activeTab, reset])

  const onSubmit = (data: any) => {
    const payload = editItem ? { ...data, id: editItem.id } : data
    switch (activeTab) {
      case 'warehouses': warehouseMutation.mutate(payload); break
      case 'locations': locationMutation.mutate(payload); break
      case 'categories': categoryMutation.mutate(payload); break
      case 'uoms': uomMutation.mutate(payload); break
      case 'users': userMutation.mutate(payload); break
    }
  }

  const getMutation = () => {
    switch (activeTab) {
      case 'warehouses': return warehouseMutation
      case 'locations': return locationMutation
      case 'categories': return categoryMutation
      case 'uoms': return uomMutation
      case 'users': return userMutation
    }
  }

  const getDeleteMutation = () => {
    switch (activeTab) {
      case 'warehouses': return deleteWarehouse
      case 'locations': return deleteLocation
      case 'categories': return deleteCategory
      case 'uoms': return deleteUom
      case 'users': return deleteUser
    }
  }

  const getData = () => {
    switch (activeTab) {
      case 'warehouses': return warehouses
      case 'locations': return locations
      case 'categories': return categories
      case 'uoms': return uoms
      case 'users': return users
    }
  }

  const getColumns = () => {
    switch (activeTab) {
      case 'warehouses':
        return [
          { key: 'name', label: 'Name', render: (w: any) => <div className="font-medium">{w.name}</div> },
          { key: 'code', label: 'Code', render: (w: any) => <span className="font-mono text-sm">{w.code}</span> },
          { key: 'address', label: 'Address', render: (w: any) => <span className="text-surface-500">{w.address || '-'}</span> },
          { key: 'locations', label: 'Locations', render: (w: any) => <span className="text-surface-600">{w._count?.locations || 0}</span> },
        ]
      case 'locations':
        return [
          { key: 'name', label: 'Name', render: (l: any) => <div className="font-medium">{l.name}</div> },
          { key: 'code', label: 'Code', render: (l: any) => <span className="font-mono text-sm">{l.code}</span> },
          { key: 'type', label: 'Type', render: (l: any) => <span className="badge badge-info">{l.type}</span> },
          { key: 'warehouse', label: 'Warehouse', render: (l: any) => <span className="text-surface-600">{l.warehouse?.name}</span> },
          { key: 'parent', label: 'Parent', render: (l: any) => <span className="text-surface-500">{l.parent?.name || '-'}</span> },
        ]
      case 'categories':
        return [
          { key: 'name', label: 'Name', render: (c: any) => <div className="font-medium">{c.name}</div> },
          { key: 'description', label: 'Description', render: (c: any) => <span className="text-surface-500">{c.description || '-'}</span> },
        ]
      case 'uoms':
        return [
          { key: 'name', label: 'Name', render: (u: any) => <div className="font-medium">{u.name}</div> },
          { key: 'symbol', label: 'Symbol', render: (u: any) => <span className="font-mono text-sm">{u.symbol}</span> },
          { key: 'description', label: 'Description', render: (u: any) => <span className="text-surface-500">{u.description || '-'}</span> },
        ]
      case 'users':
        return [
          { key: 'name', label: 'Name', render: (u: any) => <div className="font-medium">{u.name}</div> },
          { key: 'email', label: 'Email', render: (u: any) => <span className="text-surface-600">{u.email}</span> },
          { key: 'role', label: 'Role', render: (u: any) => <span className="badge badge-info">{u.role}</span> },
          { key: 'created', label: 'Created', render: (u: any) => <span className="text-surface-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</span> },
        ]
    }
  }

  const activeTabConfig = tabs.find(t => t.id === activeTab) || tabs[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Settings</h1>
          <p className="text-surface-500 mt-1">Configure your inventory system</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-surface-200">
          <nav className="flex gap-1 px-2 py-2 bg-surface-50" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'flex items-center gap-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'
                )}
              >
                <tab.icon className="h-5 w-5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', `bg-${activeTabConfig.color}-100 text-${activeTabConfig.color}-600`)}>
                <activeTabConfig.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-900">{activeTabConfig.label}</h2>
                <p className="text-surface-500 text-sm">Manage {activeTabConfig.label.toLowerCase()}</p>
              </div>
            </div>
            <button onClick={() => openDialog()} className="btn-primary">
              <PlusIcon className="h-4 w-4" />
              <span>Add {activeTabConfig.label.slice(0, -1)}</span>
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {getColumns().map((col, i) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th className="text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getData()?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-primary-50/50 transition-colors duration-150">
                    {getColumns().map((col, i) => (
                      <td key={col.key}>{col.render(item)}</td>
                    ))}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDialog(item)} className="btn-icon btn-ghost text-surface-500 hover:text-primary-600 hover:bg-primary-50" title="Edit">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => { if (confirm(`Delete ${activeTabConfig.label.slice(0, -1)}?`)) getDeleteMutation().mutate(item.id) }} className="btn-icon btn-ghost text-surface-500 hover:text-danger-600 hover:bg-danger-50" title="Delete">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!getData() || getData()!.length === 0) && (
            <div className="empty-state py-16">
              <CubeIcon className="empty-state-icon" />
              <p className="empty-state-title">No {activeTabConfig.label.toLowerCase()} yet</p>
              <p className="empty-state-description">Get started by adding your first {activeTabConfig.label.slice(0, -1).toLowerCase()}</p>
              <button onClick={() => openDialog()} className="btn-primary mt-4">
                <PlusIcon className="h-4 w-4" />
                Add {activeTabConfig.label.slice(0, -1)}
              </button>
            </div>
          )}

          <Transition.Root show={dialogOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeDialog}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl animate-scale-in">
                      <div className="flex items-center justify-between mb-4">
                        <Dialog.Title as="h3" className="text-lg font-semibold text-surface-900">
                          {editItem ? 'Edit' : 'Add'} {activeTabConfig.label.slice(0, -1)}
                        </Dialog.Title>
                        <button onClick={closeDialog} className="btn-icon btn-ghost text-surface-400 hover:text-surface-600 hover:bg-surface-100">
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {activeTab === 'warehouses' && (
                          <>
                            <div className="form-group">
                              <label className="label">Name</label>
                              <input {...register('name')} className="input" />
                              {errors.name && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.name.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Code</label>
                              <input {...register('code')} className="input" />
                              {errors.code && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.code.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Address</label>
                              <input {...register('address')} className="input" />
                            </div>
                          </>
                        )}

                        {activeTab === 'locations' && (
                          <>
                            <div className="form-group">
                              <label className="label">Name</label>
                              <input {...register('name')} className="input" />
                              {errors.name && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.name.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Code</label>
                              <input {...register('code')} className="input" />
                              {errors.code && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.code.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Type</label>
                              <select {...register('type')} className="select">
                                <option value="STORAGE">Storage</option>
                                <option value="PRODUCTION">Production</option>
                                <option value="RECEIVING">Receiving</option>
                                <option value="SHIPPING">Shipping</option>
                                <option value="QUARANTINE">Quarantine</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="label">Warehouse</label>
                              <select {...register('warehouseId')} className="select">
                                <option value="">Select warehouse</option>
                                {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                              </select>
                              {errors.warehouseId && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.warehouseId.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Parent Location (optional)</label>
                              <select {...register('parentId')} className="select">
                                <option value="">None</option>
                                {locations?.filter(l => l.id !== editItem?.id).map(l => <option key={l.id} value={l.id}>{l.warehouse?.name} / {l.name}</option>)}
                              </select>
                            </div>
                          </>
                        )}

                        {activeTab === 'categories' && (
                          <>
                            <div className="form-group">
                              <label className="label">Name</label>
                              <input {...register('name')} className="input" />
                              {errors.name && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.name.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Description</label>
                              <textarea {...register('description')} rows={3} className="input" />
                            </div>
                          </>
                        )}

                        {activeTab === 'uoms' && (
                          <>
                            <div className="form-group">
                              <label className="label">Name</label>
                              <input {...register('name')} className="input" />
                              {errors.name && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.name.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Symbol</label>
                              <input {...register('symbol')} className="input" />
                              {errors.symbol && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.symbol.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Description</label>
                              <input {...register('description')} className="input" />
                            </div>
                          </>
                        )}

                        {activeTab === 'users' && (
                          <>
                            <div className="form-group">
                              <label className="label">Email</label>
                              <input {...register('email')} className="input" />
                              {errors.email && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.email.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Name</label>
                              <input {...register('name')} className="input" />
                              {errors.name && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.name.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Role</label>
                              <select {...register('role')} className="select">
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="STAFF">Staff</option>
                                <option value="VIEWER">Viewer</option>
                              </select>
                              {errors.role && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.role.message}</p>}
                            </div>
                            <div className="form-group">
                              <label className="label">Avatar URL (optional)</label>
                              <input {...register('avatarUrl')} className="input" placeholder="https://example.com/avatar.png" />
                            </div>
                          </>
                        )}

                        <div className="card-footer pt-6">
                          <button type="button" onClick={closeDialog} className="btn-secondary">
                            <ArrowLeftIcon className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                          <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                <span>Saving...</span>
                              </>
                            ) : editItem ? (
                              <>
                                <CheckIcon className="h-4 w-4" />
                                <span>Update</span>
                              </>
                            ) : (
                              <>
                                <PlusIcon className="h-4 w-4" />
                                <span>Create</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition.Root>
        </div>
      </div>
    </div>
  )
}