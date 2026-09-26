import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productApi, categoryApi, uomApi } from '../lib/queries'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  uomId: z.string().min(1, 'Unit of Measure is required'),
  reorderPoint: z.number().int().nonnegative().default(10),
})

type ProductForm = z.infer<typeof productSchema>

export function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.list({ limit: 100 }).then(r => r.data.data) })
  const { data: uoms } = useQuery({ queryKey: ['uoms'], queryFn: () => uomApi.list({ limit: 100 }).then(r => r.data.data) })

  const { data: product } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.get(id!).then(r => r.data),
    enabled: isEditing,
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { reorderPoint: 10 },
  })

  useEffect(() => {
    if (isEditing && product) {
      reset({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        uomId: product.uomId,
        reorderPoint: product.reorderPoint,
      })
    }
  }, [isEditing, product, reset])

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created successfully')
      navigate('/products')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProductForm) => productApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated successfully')
      navigate('/products')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update'),
  })

  const onSubmit = (data: ProductForm) => {
    if (isEditing) updateMutation.mutate(data)
    else createMutation.mutate(data)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">{isEditing ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-surface-500 mt-1">{isEditing ? 'Update product details' : 'Add a new product to your catalog'}</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-icon btn-ghost text-surface-500 hover:text-surface-700 hover:bg-surface-100" title="Back">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-surface-900">{isEditing ? 'Edit Product' : 'Create New Product'}</h2>
          <p className="text-surface-500 text-sm mt-0.5">{isEditing ? 'Update the product details below' : 'Fill in the details to add a new product to your catalog'}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label htmlFor="sku" className="label">SKU / Code</label>
              <div className="relative">
                <input id="sku" {...register('sku')} className="input" disabled={isEditing} placeholder="e.g., PRD-001" />
                {isEditing && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded-lg">Not editable</span>
                )}
              </div>
              {errors.sku && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.sku.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="name" className="label">Product Name</label>
              <input id="name" {...register('name')} className="input" placeholder="e.g., Steel Rods 10mm" />
              {errors.name && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.name.message}</p>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="label">Description</label>
            <textarea id="description" {...register('description')} rows={3} className="input" placeholder="Optional description, specifications, notes..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label htmlFor="categoryId" className="label">Category</label>
              <select id="categoryId" {...register('categoryId')} className="select">
                <option value="">Select a category</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.categoryId.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="uomId" className="label">Unit of Measure</label>
              <select id="uomId" {...register('uomId')} className="select">
                <option value="">Select a unit</option>
                {uoms?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </select>
              {errors.uomId && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.uomId.message}</p>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reorderPoint" className="label">Reorder Point</label>
            <div className="relative">
              <input id="reorderPoint" type="number" min="0" step="1" {...register('reorderPoint', { valueAsNumber: true })} className="input pr-20" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">units</span>
            </div>
            <p className="form-hint">Minimum stock level before low stock alerts trigger</p>
            {errors.reorderPoint && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errors.reorderPoint.message}</p>}
          </div>

          <div className="card-footer">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>Update Product</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5" />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}