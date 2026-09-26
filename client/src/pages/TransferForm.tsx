import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transferApi, locationApi, productApi } from '../lib/queries'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon, ArrowsRightLeftIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const lineSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  qty: z.number().int().positive('Must be positive'),
})

const transferSchema = z.object({
  fromLocationId: z.string().min(1, 'Source location required'),
  toLocationId: z.string().min(1, 'Destination location required'),
  lines: z.array(lineSchema).min(1, 'At least one line required'),
}).refine(data => data.fromLocationId !== data.toLocationId, {
  message: 'Source and destination must be different',
  path: ['toLocationId'],
})

type TransferForm = z.infer<typeof transferSchema>

export function TransferForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => locationApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: products } = useQuery({ queryKey: ['products', { isActive: true }], queryFn: () => productApi.list({ limit: 100, isActive: true }).then(r => r.data.data) })

  const { data: transfer } = useQuery({
    queryKey: ['transfers', id],
    queryFn: () => transferApi.get(id!).then(r => r.data),
    enabled: isEditing,
  })

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: { lines: [{ productId: '', qty: 1 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  useEffect(() => {
    if (isEditing && transfer) {
      reset({
        fromLocationId: transfer.fromLocationId,
        toLocationId: transfer.toLocationId,
        lines: transfer.lines.map(l => ({ productId: l.productId, qty: l.qty })),
      })
    }
  }, [isEditing, transfer, reset])

  const createMutation = useMutation({
    mutationFn: (data: any) => transferApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      toast.success('Transfer created')
      navigate(`/operations/transfers/${res.data.id}/edit`)
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => transferApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      toast.success('Transfer updated')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update'),
  })

  const validateMutation = useMutation({
    mutationFn: () => transferApi.validate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      toast.success('Transfer validated, stock moved')
      navigate('/operations/transfers')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to validate'),
  })

  const onSubmit = (data: TransferForm) => {
    const submitData = {
      ...data,
      lines: data.lines.map(line => ({ ...line, id: '' })),
    } as any
    if (isEditing) updateMutation.mutate(submitData)
    else createMutation.mutate(submitData)
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">{isEditing ? 'Edit Transfer' : 'New Transfer'}</h1>
          <p className="text-surface-500 mt-1">Move stock between locations</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-icon btn-ghost text-surface-500 hover:text-surface-700 hover:bg-surface-100" title="Back">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center">
              <ArrowsRightLeftIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">{isEditing ? 'Edit Transfer' : 'Create New Transfer'}</h2>
              <p className="text-surface-500 text-sm">{isEditing ? 'Update transfer details' : 'Move stock between locations'}</p>
            </div>
          </div>
          {isEditing && transfer?.status === 'DRAFT' && (
            <button
              onClick={() => { if (confirm('Validate this transfer? Stock will be moved.')) validateMutation.mutate() }}
              disabled={validateMutation.isPending}
              className="btn-warning ml-auto"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Validate</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label htmlFor="fromLocationId" className="label">From Location</label>
              <select {...register('fromLocationId')} className="select">
                <option value="">Select source location</option>
                {locations?.map(l => <option key={l.id} value={l.id}>{l.warehouse?.name} / {l.name} ({l.code})</option>)}
              </select>
              {errors.fromLocationId && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.fromLocationId.message}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="toLocationId" className="label">To Location</label>
              <select {...register('toLocationId')} className="select">
                <option value="">Select destination location</option>
                {locations?.map(l => <option key={l.id} value={l.id}>{l.warehouse?.name} / {l.name} ({l.code})</option>)}
              </select>
              {errors.toLocationId && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.toLocationId.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900">Products</h3>
              <button type="button" onClick={() => append({ productId: '', qty: 1 })} className="btn-outline btn-sm">
                <PlusIcon className="h-4 w-4" />
                <span>Add Line</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="card p-4 border-surface-200 bg-surface-50/50 transition-all duration-200 hover:border-primary-200">
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0 form-group">
                      <label className="label">Product</label>
                      <select
                        {...register(`lines.${index}.productId`)}
                        className="select"
                      >
                        <option value="">Select product</option>
                        {products?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {p.uom?.symbol}</option>)}
                      </select>
                    </div>
                    <div className="w-28 form-group">
                      <label className="label">Quantity</label>
                      <input type="number" min="1" {...register(`lines.${index}.qty`, { valueAsNumber: true })} className="input" />
                    </div>
                    <button type="button" onClick={() => remove(index)} className="mt-9 btn-icon btn-ghost text-surface-400 hover:text-danger-600 hover:bg-danger-50" title="Remove line">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.lines && <p className="form-error mt-2"><XMarkIcon className="h-3.5 w-3.5" /> {errors.lines.message}</p>}
          </div>

          <div className="card-footer">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  <span>Update Transfer</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  <span>Create Transfer</span>
                </>
              )}
            </button>
            {isEditing && transfer?.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => { if (confirm('Validate this transfer? Stock will be moved.')) validateMutation.mutate() }}
                disabled={validateMutation.isPending}
                className="btn-warning"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>Validate</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}