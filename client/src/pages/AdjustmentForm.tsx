import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adjustmentApi, locationApi, productApi, stockApi } from '../lib/queries'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon, WrenchScrewdriverIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const lineSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  systemQty: z.number().int().nonnegative(),
  countedQty: z.number().int().nonnegative(),
})

const adjustmentSchema = z.object({
  locationId: z.string().min(1, 'Location required'),
  reason: z.string().min(1, 'Reason required'),
  lines: z.array(lineSchema).min(1, 'At least one line required'),
})

type AdjustmentForm = z.infer<typeof adjustmentSchema>

export function AdjustmentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => locationApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: products } = useQuery({ queryKey: ['products', { isActive: true }], queryFn: () => productApi.list({ limit: 100, isActive: true }).then(r => r.data.data) })

  const [systemQtys, setSystemQtys] = useState<Record<string, number>>({})

  const { data: adjustment } = useQuery({
    queryKey: ['adjustments', id],
    queryFn: () => adjustmentApi.get(id!).then(r => r.data),
    enabled: isEditing,
  })

  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { lines: [{ productId: '', systemQty: 0, countedQty: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const watchedLocation = watch('locationId')
  const watchedLines = watch('lines')

  useEffect(() => {
    if (isEditing && adjustment) {
      reset({
        locationId: adjustment.locationId,
        reason: adjustment.reason,
        lines: adjustment.lines.map(l => ({
          productId: l.productId,
          systemQty: l.systemQty,
          countedQty: l.countedQty,
        })),
      })
    }
  }, [isEditing, adjustment, reset])

  useEffect(() => {
    if (watchedLocation) {
      watchedLines.forEach((line, index) => {
        if (line.productId) {
          stockApi.getProductLocation(line.productId, watchedLocation).then(res => {
            const qty = res.data.quantity
            setSystemQtys(prev => ({ ...prev, [line.productId]: qty }))
            setValue(`lines.${index}.systemQty`, qty)
          })
        }
      })
    }
  }, [watchedLocation, watchedLines, setValue])

  const createMutation = useMutation({
    mutationFn: (data: any) => adjustmentApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] })
      toast.success('Adjustment created')
      navigate(`/operations/adjustments/${res.data.id}/edit`)
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => adjustmentApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] })
      toast.success('Adjustment updated')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update'),
  })

  const validateMutation = useMutation({
    mutationFn: () => adjustmentApi.validate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] })
      toast.success('Adjustment validated, stock updated')
      navigate('/operations/adjustments')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to validate'),
  })

  const onSubmit = (data: AdjustmentForm) => {
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
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">{isEditing ? 'Edit Adjustment' : 'New Adjustment'}</h1>
          <p className="text-surface-500 mt-1">Fix mismatches between recorded and physical stock</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-icon btn-ghost text-surface-500 hover:text-surface-700 hover:bg-surface-100" title="Back">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center">
              <WrenchScrewdriverIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">{isEditing ? 'Edit Adjustment' : 'Create New Adjustment'}</h2>
              <p className="text-surface-500 text-sm">{isEditing ? 'Update adjustment details' : 'Fix mismatches between recorded and physical stock'}</p>
            </div>
          </div>
          {isEditing && adjustment?.status === 'DRAFT' && (
            <button
              onClick={() => { if (confirm('Validate this adjustment? Stock will be updated.')) validateMutation.mutate() }}
              disabled={validateMutation.isPending}
              className="btn-accent ml-auto"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Validate</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label htmlFor="locationId" className="label">Location</label>
              <select {...register('locationId')} className="select" onChange={e => { setSystemQtys({}) }}>
                <option value="">Select location</option>
                {locations?.map(l => <option key={l.id} value={l.id}>{l.warehouse?.name} / {l.name} ({l.code})</option>)}
              </select>
              {errors.locationId && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.locationId.message}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="reason" className="label">Reason</label>
              <input {...register('reason')} className="input" placeholder="e.g., Damaged during handling, Count discrepancy" />
              {errors.reason && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.reason.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900">Adjustment Lines</h3>
              <button type="button" onClick={() => append({ productId: '', systemQty: 0, countedQty: 0 })} className="btn-outline btn-sm">
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
                        onChange={e => {
                          const productId = e.target.value
                          if (productId && watchedLocation) {
                            stockApi.getProductLocation(productId, watchedLocation).then(res => {
                              const qty = res.data.quantity
                              setSystemQtys(prev => ({ ...prev, [productId]: qty }))
                              setValue(`lines.${index}.systemQty`, qty)
                              setValue(`lines.${index}.countedQty`, qty)
                            })
                          }
                        }}
                      >
                        <option value="">Select product</option>
                        {products?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {p.uom?.symbol}</option>)}
                      </select>
                    </div>
                    <div className="w-28 form-group">
                      <label className="label">System Qty</label>
                      <input type="number" min="0" {...register(`lines.${index}.systemQty`, { valueAsNumber: true })} className="input bg-surface-100" readOnly />
                    </div>
                    <div className="w-28 form-group">
                      <label className="label">Counted Qty</label>
                      <input type="number" min="0" {...register(`lines.${index}.countedQty`, { valueAsNumber: true })} className="input" />
                    </div>
                    <div className="w-28 mt-9 flex items-center justify-center">
                      {watchedLines[index]?.productId && systemQtys[watchedLines[index].productId] !== undefined && (
                        <span className={clsx('text-sm font-medium', systemQtys[watchedLines[index].productId] > (watchedLines[index].countedQty || 0) ? 'text-danger-600' : 'text-success-600')}>
                          Δ { (watchedLines[index].countedQty || 0) - systemQtys[watchedLines[index].productId] }
                        </span>
                      )}
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
                  <span>Update Adjustment</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  <span>Create Adjustment</span>
                </>
              )}
            </button>
            {isEditing && adjustment?.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => { if (confirm('Validate this adjustment? Stock will be updated.')) validateMutation.mutate() }}
                disabled={validateMutation.isPending}
                className="btn-accent"
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