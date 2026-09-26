import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryApi, warehouseApi, locationApi, productApi } from '../lib/queries'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon, ArrowUpTrayIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const lineSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  qtyOrdered: z.number().int().positive('Must be positive'),
  qtyDelivered: z.number().int().nonnegative().default(0),
})

const deliverySchema = z.object({
  customer: z.string().min(1, 'Customer required'),
  warehouseId: z.string().min(1, 'Warehouse required'),
  locationId: z.string().min(1, 'Location required'),
  lines: z.array(lineSchema).min(1, 'At least one line required'),
})

type DeliveryForm = z.infer<typeof deliverySchema>

export function DeliveryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => warehouseApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: products } = useQuery({ queryKey: ['products', { isActive: true }], queryFn: () => productApi.list({ limit: 100, isActive: true }).then(r => r.data.data) })

  const [locations, setLocations] = useState<any[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')

  useEffect(() => {
    if (selectedWarehouse) {
      locationApi.list({ warehouseId: selectedWarehouse, limit: 100 }).then(r => setLocations(r.data.data))
    } else {
      setLocations([])
    }
  }, [selectedWarehouse])

  const { data: delivery } = useQuery({
    queryKey: ['deliveries', id],
    queryFn: () => deliveryApi.get(id!).then(r => r.data),
    enabled: isEditing,
  })

  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema),
    defaultValues: { lines: [{ productId: '', qtyOrdered: 1, qtyDelivered: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  useEffect(() => {
    if (isEditing && delivery) {
      setSelectedWarehouse(delivery.warehouseId)
      reset({
        customer: delivery.customer,
        warehouseId: delivery.warehouseId,
        locationId: delivery.locationId,
        lines: delivery.lines.map(l => ({
          productId: l.productId,
          qtyOrdered: l.qtyOrdered,
          qtyDelivered: l.qtyDelivered,
        })),
      })
    }
  }, [isEditing, delivery, reset])

  const createMutation = useMutation({
    mutationFn: (data: any) => deliveryApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast.success('Delivery created')
      navigate(`/operations/deliveries/${res.data.id}/edit`)
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => deliveryApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast.success('Delivery updated')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update'),
  })

  const validateMutation = useMutation({
    mutationFn: () => deliveryApi.validate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast.success('Delivery validated, stock updated')
      navigate('/operations/deliveries')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to validate'),
  })

  const watchedWarehouse = watch('warehouseId')
  useEffect(() => {
    if (watchedWarehouse !== selectedWarehouse) {
      setSelectedWarehouse(watchedWarehouse)
    }
  }, [watchedWarehouse, selectedWarehouse])

  const onSubmit = (data: DeliveryForm) => {
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
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">{isEditing ? 'Edit Delivery' : 'New Delivery'}</h1>
          <p className="text-surface-500 mt-1">Record outgoing stock to customer</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-icon btn-ghost text-surface-500 hover:text-surface-700 hover:bg-surface-100" title="Back">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-100 text-success-600 flex items-center justify-center">
              <ArrowUpTrayIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">{isEditing ? 'Edit Delivery' : 'Create New Delivery'}</h2>
              <p className="text-surface-500 text-sm">{isEditing ? 'Update delivery details' : 'Record outgoing stock to customer'}</p>
            </div>
          </div>
          {isEditing && delivery?.status === 'DRAFT' && (
            <button
              onClick={() => { if (confirm('Validate this delivery? Stock will be deducted.')) validateMutation.mutate() }}
              disabled={validateMutation.isPending}
              className="btn-success ml-auto"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Validate</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="form-group">
              <label htmlFor="customer" className="label">Customer</label>
              <input id="customer" {...register('customer')} className="input" placeholder="e.g., ABC Furniture Co." />
              {errors.customer && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.customer.message}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="warehouseId" className="label">Warehouse</label>
              <select {...register('warehouseId')} className="select" onChange={e => { setSelectedWarehouse(e.target.value); setValue('locationId', '') }}>
                <option value="">Select warehouse</option>
                {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              {errors.warehouseId && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.warehouseId.message}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="locationId" className="label">Location</label>
              <select {...register('locationId')} className="select" disabled={!locations.length}>
                <option value="">Select location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
              </select>
              {errors.locationId && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.locationId.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900">Products</h3>
              <button type="button" onClick={() => append({ productId: '', qtyOrdered: 1, qtyDelivered: 0 })} className="btn-outline btn-sm">
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
                      <label className="label">Ordered</label>
                      <input type="number" min="1" {...register(`lines.${index}.qtyOrdered`, { valueAsNumber: true })} className="input" />
                    </div>
                    <div className="w-28 form-group">
                      <label className="label">Delivered</label>
                      <input type="number" min="0" {...register(`lines.${index}.qtyDelivered`, { valueAsNumber: true })} className="input" />
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
                  <span>Update Delivery</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  <span>Create Delivery</span>
                </>
              )}
            </button>
            {isEditing && delivery?.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => { if (confirm('Validate this delivery? Stock will be deducted.')) validateMutation.mutate() }}
                disabled={validateMutation.isPending}
                className="btn-success"
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