import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Fragment } from 'react'
import { Dialog, Transition, Menu } from '@headlessui/react'
import {
  Bars3Icon, XMarkIcon, HomeIcon, CubeIcon, ArrowPathIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  ArrowsRightLeftIcon, WrenchScrewdriverIcon, ChartBarIcon, Cog6ToothIcon, UserCircleIcon,
  ArrowRightOnRectangleIcon, ChevronDownIcon, ChevronRightIcon, BuildingOfficeIcon,
  ArrowTrendingUpIcon, ClipboardDocumentListIcon, CogIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, badge: null },
  { name: 'Products', href: '/products', icon: CubeIcon, badge: null },
  { name: 'Operations', href: '/operations', icon: ArrowPathIcon, children: [
    { name: 'Receipts', href: '/operations/receipts', icon: ArrowDownTrayIcon },
    { name: 'Deliveries', href: '/operations/deliveries', icon: ArrowUpTrayIcon },
    { name: 'Internal Transfers', href: '/operations/transfers', icon: ArrowsRightLeftIcon },
    { name: 'Adjustments', href: '/operations/adjustments', icon: WrenchScrewdriverIcon },
  ]},
  { name: 'Stock Ledger', href: '/stock', icon: ChartBarIcon, badge: null },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, children: [
    { name: 'Warehouses', href: '/settings/warehouses', icon: BuildingOfficeIcon },
    { name: 'Locations', href: '/settings/locations', icon: CogIcon },
    { name: 'Categories', href: '/settings/categories', icon: CubeIcon },
    { name: 'Units of Measure', href: '/settings/uoms', icon: ArrowTrendingUpIcon },
    { name: 'Profiles', href: '/settings/users', icon: ClipboardDocumentListIcon },
  ]},
]

export function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-surface-50">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5 rounded-xl text-surface-400 hover:bg-surface-200 hover:text-surface-600 transition-colors" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent expanded={expanded} setExpanded={setExpanded} location={location} logout={logout} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent expanded={expanded} setExpanded={setExpanded} location={location} logout={logout} />
      </div>

      <div className="lg:pl-64">
        <div className={clsx(
          'sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-surface-200 bg-white/80 backdrop-blur-lg px-4 transition-all duration-300 lg:px-8',
          scrolled && 'shadow-sm'
        )}>
          <button
            type="button"
            className="lg:hidden -m-2.5 p-2.5 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
              <BuildingOfficeIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900 tracking-tight">StockSense</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="hidden sm:block px-3 py-1.5 rounded-xl bg-surface-100 text-xs font-medium text-surface-600 capitalize">
              {user?.role}
            </div>

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 -mr-1 p-1.5 rounded-xl hover:bg-surface-100 transition-colors">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-surface-900">{user?.name}</p>
                  <p className="text-xs text-surface-500">{user?.email}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDownIcon className="h-5 w-5 text-surface-400" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="transform opacity-0 scale-95 -translate-y-1"
                enterTo="transform opacity-100 scale-100 translate-y-0"
                leave="transition ease-in duration-100"
                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                leaveTo="transform opacity-0 scale-95 -translate-y-1"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-2xl bg-white py-2 shadow-lg ring-1 ring-surface-900/5 focus:outline-none animate-slide-down">
                  <Menu.Item>
                    {({ active }) => (
                      <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                          clsx(
                            isActive || active ? 'bg-primary-50 text-primary-600' : 'text-surface-700 hover:bg-surface-50',
                            'flex items-center gap-3 px-4 py-2.5 text-sm'
                          )
                        }
                      >
                        <UserCircleIcon className="h-5 w-5 shrink-0" />
                        <span>My Profile</span>
                      </NavLink>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={clsx(
                          active ? 'bg-danger-50 text-danger-600' : 'text-surface-700 hover:bg-surface-50 hover:text-danger-600',
                          'flex w-full items-center gap-3 px-4 py-2.5 text-sm'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                        <span>Logout</span>
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        <main className="p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ expanded, setExpanded, location, logout }: { expanded: string | null; setExpanded: (s: string | null) => void; location: ReturnType<typeof useLocation>; logout: () => void }) {
  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <div className="flex grow flex-col overflow-y-auto bg-white border-r border-surface-200 px-3 pb-4 lg:pb-8">
      <div className="flex h-16 shrink-0 items-center px-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center flex-shrink-0">
          <BuildingOfficeIcon className="h-5 w-5 text-white" />
        </div>
        <span className="ml-3 text-xl font-bold text-surface-900 tracking-tight">StockSense</span>
      </div>

      <nav className="flex flex-1 flex-col pt-2" aria-label="Main navigation">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expanded === item.name
            const isActiveRoute = hasChildren ? item.children.some(c => isActive(c.href)) : isActive(item.href)

            return (
              <li key={item.name}>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : item.name)}
                    className={clsx(
                      isActiveRoute ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-600' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900',
                      'group flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 -ml-2'
                    )}
                  >
                    <item.icon className={clsx('h-5 w-5 shrink-0 transition-colors duration-200', isActiveRoute ? 'text-primary-600' : 'text-surface-400 group-hover:text-surface-600')} aria-hidden="true" />
                    <span className="flex-1 text-left truncate">{item.name}</span>
                    <ChevronRightIcon
                      className={clsx(
                        'h-5 w-5 shrink-0 text-surface-400 transition-transform duration-200',
                        isExpanded && 'rotate-90 text-primary-600'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <NavLink
                    to={item.href}
                    className={clsx(
                      isActive(item.href) ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-600' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900',
                      'flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 -ml-2'
                    )}
                  >
                    <item.icon className={clsx('h-5 w-5 shrink-0', isActive(item.href) ? 'text-primary-600' : 'text-surface-400')} aria-hidden="true" />
                    {item.name}
                  </NavLink>
                )}
                {hasChildren && isExpanded && (
                  <ul role="list" className="mt-1.5 ml-10 flex flex-col gap-y-1 animate-slide-down">
                    {item.children!.map((child) => (
                      <li key={child.name}>
                        <NavLink
                          to={child.href}
                          className={clsx(
                            isActive(child.href) ? 'bg-primary-50 text-primary-600' : 'text-surface-500 hover:bg-surface-50 hover:text-surface-800',
                            'flex items-center gap-x-3 rounded-lg px-2 py-2 text-sm transition-all duration-150 -ml-2'
                          )}
                        >
                          <child.icon className={clsx('h-4 w-4 shrink-0', isActive(child.href) ? 'text-primary-600' : 'text-surface-400')} aria-hidden="true" />
                          {child.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>

        <div className="mt-auto pt-4 border-t border-surface-200">
          <div className="px-2">
            <p className="px-3 py-1.5 text-xs font-semibold text-surface-400 uppercase tracking-wider">
              Shortcuts
            </p>
            <NavLink
              to="/profile"
              className={clsx(
                isActive('/profile') ? 'bg-primary-50 text-primary-600' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900',
                'flex items-center gap-x-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 -ml-2'
              )}
            >
              <UserCircleIcon className="h-5 w-5 shrink-0 text-surface-400" aria-hidden="true" />
              <span className="truncate">My Profile</span>
            </NavLink>
            <button
              onClick={logout}
              className="flex w-full items-center gap-x-3 rounded-xl px-3 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 hover:text-danger-600 transition-all duration-200 -ml-2"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0 text-surface-400" aria-hidden="true" />
              <span className="truncate">Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}