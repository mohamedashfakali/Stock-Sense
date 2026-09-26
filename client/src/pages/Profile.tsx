import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../lib/queries'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { UserCircleIcon, LockClosedIcon, ArrowLeftIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export function Profile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  const { register: regProfile, handleSubmit: handleSubmitProfile, formState: { errors: errorsProfile, isSubmitting: isSubmittingProfile } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', avatarUrl: user?.avatarUrl || '' },
  })

  const { register: regPassword, handleSubmit: handleSubmitPassword, formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Profile updated')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to update'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) => authApi.updateProfile({ name: user?.name, avatarUrl: user?.avatarUrl, password: data.newPassword } as any),
    onSuccess: () => toast.success('Password changed'),
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to change password'),
  })

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">My Profile</h1>
          <p className="text-surface-500 mt-1">Manage your account settings</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-surface-200">
          <nav className="tabs" aria-label="Profile tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={clsx(
                'tab',
                activeTab === 'profile' && 'tab-active'
              )}
            >
              <UserCircleIcon className="h-5 w-5 mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={clsx(
                'tab',
                activeTab === 'password' && 'tab-active'
              )}
            >
              <LockClosedIcon className="h-5 w-5 mr-2" />
              Password
            </button>
          </nav>
        </div>

        <div className="p-6 animate-fade-in">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmitProfile((data) => profileMutation.mutate(data))} className="space-y-5">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <UserCircleIcon className="h-12 w-12 text-primary-600" />
                  </div>
                  {user?.avatarUrl && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-white bg-primary-600 flex items-center justify-center">
                      <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex-1 form-group">
                  <label className="label">Avatar URL</label>
                  <input {...regProfile('avatarUrl')} className="input" placeholder="https://example.com/avatar.png" />
                  {errorsProfile.avatarUrl && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errorsProfile.avatarUrl.message}</p>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name" className="label">Full Name</label>
                <input id="name" {...regProfile('name')} className="input" />
                {errorsProfile.name && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errorsProfile.name.message}</p>}
              </div>

              <div className="form-group">
                <label className="label">Email</label>
                <input type="email" value={user?.email} disabled className="input bg-surface-50" />
                <p className="form-hint">Email cannot be changed</p>
              </div>

              <div className="form-group">
                <label className="label">Role</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium capitalize">{user?.role.toLowerCase()}</span>
                </div>
                <p className="form-hint">Role is assigned by administrator</p>
              </div>

              <div className="card-footer pt-4">
                <button type="submit" disabled={isSubmittingProfile} className="btn-primary">
                  {isSubmittingProfile ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleSubmitPassword((data) => passwordMutation.mutate(data))} className="space-y-5">
              <div className="p-4 rounded-xl bg-warning-50 border border-warning-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center flex-shrink-0">
                    <LockClosedIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-warning-800">Security Notice</p>
                    <p className="text-warning-700 text-sm mt-1">Changing your password will log you out of all other sessions. Make sure to use a strong, unique password.</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="currentPassword" className="label">Current Password</label>
                <input id="currentPassword" type="password" {...regPassword('currentPassword')} className="input" autoComplete="current-password" />
                {errorsPassword.currentPassword && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errorsPassword.currentPassword.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword" className="label">New Password</label>
                <input id="newPassword" type="password" {...regPassword('newPassword')} className="input" autoComplete="new-password" />
                {errorsPassword.newPassword && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errorsPassword.newPassword.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
                <input id="confirmPassword" type="password" {...regPassword('confirmPassword')} className="input" autoComplete="new-password" />
                {errorsPassword.confirmPassword && <p className="form-error"><XMarkIcon className="h-3.5 w-3.5" /> {errorsPassword.confirmPassword.message}</p>}
              </div>

              <div className="card-footer pt-4">
                <button type="submit" disabled={isSubmittingPassword} className="btn-primary">
                  {isSubmittingPassword ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      <span>Changing...</span>
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="h-5 w-5" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}