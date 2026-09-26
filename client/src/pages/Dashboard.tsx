import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../lib/queries'
import {
  CubeIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowsRightLeftIcon,
  BuildingOfficeIcon, ClipboardDocumentListIcon, ArrowTrendingUpIcon, WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { format } from 'date-fns'
import clsx from 'clsx'

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#d946ef', '#06b6d4', '#8b5cf6', '#f97316']

const stats = [
  { key: 'totalProducts', label: 'Total Products', icon: CubeIcon, color: 'primary', trend: '+12%', trendColor: 'success' },
  { key: 'lowStockItems', label: 'Low Stock', icon: ExclamationTriangleIcon, color: 'warning', trend: 'Needs attention', trendColor: 'warning' },
  { key: 'outOfStockItems', label: 'Out of Stock', icon: ExclamationTriangleIcon, color: 'danger', trend: 'Critical', trendColor: 'danger' },
  { key: 'pendingReceipts', label: 'Pending Receipts', icon: ArrowDownTrayIcon, color: 'success', trend: 'Processing', trendColor: 'info' },
  { key: 'pendingDeliveries', label: 'Pending Deliveries', icon: ArrowUpTrayIcon, color: 'accent', trend: 'Processing', trendColor: 'info' },
  { key: 'pendingTransfers', label: 'Pending Transfers', icon: ArrowsRightLeftIcon, color: 'primary', trend: 'Scheduled', trendColor: 'info' },
]

const colorClasses: Record<string, string> = {
  primary: 'bg-primary-600',
  success: 'bg-success-600',
  warning: 'bg-warning-500',
  danger: 'bg-danger-600',
  accent: 'bg-accent-600',
}

const trendColorClasses: Record<string, string> = {
  success: 'text-success-600',
  warning: 'text-warning-600',
  danger: 'text-danger-600',
  info: 'text-primary-600',
}

const iconBgClasses: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
  danger: 'bg-danger-100 text-danger-600',
  accent: 'bg-accent-100 text-accent-600',
}

export function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => dashboardApi.getKPIs().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: byCategory } = useQuery({
    queryKey: ['dashboard', 'by-category'],
    queryFn: () => dashboardApi.getStockByCategory().then(r => r.data),
  })

  const { data: byWarehouse } = useQuery({
    queryKey: ['dashboard', 'by-warehouse'],
    queryFn: () => dashboardApi.getStockByWarehouse().then(r => r.data),
  })

  const { data: activity } = useQuery({
    queryKey: ['dashboard', 'activity', 7],
    queryFn: () => dashboardApi.getActivity(7).then(r => r.data),
  })

  if (kpisLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-200 rounded-xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-6 w-32 bg-surface-200 rounded-lg mb-4"></div>
              <div className="h-10 w-24 bg-surface-200 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6"><div className="h-64 bg-surface-200 rounded-xl"></div></div>
          <div className="card p-6"><div className="h-64 bg-surface-200 rounded-xl"></div></div>
        </div>
        <div className="card p-6"><div className="h-64 bg-surface-200 rounded-xl"></div></div>
        <div className="card p-6"><div className="h-32 bg-surface-200 rounded-xl"></div></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Dashboard</h1>
          <p className="text-surface-500 mt-1">Overview of your inventory operations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-success-50 text-success-700 text-xs font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-soft"></span>
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const value = kpis?.[stat.key] ?? 0
          return (
            <div key={stat.key} className="card-hover p-5 group">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">{stat.label}</p>
                  <p className="text-2xl font-bold text-surface-900 tabular-nums group-hover:text-primary-600 transition-colors">{value.toLocaleString()}</p>
                  <p className={clsx('text-xs font-medium mt-1.5 flex items-center gap-1', trendColorClasses[stat.trendColor])}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-20"></span>
                    {stat.trend}
                  </p>
                </div>
                <div className={clsx('p-3 rounded-xl shrink-0', iconBgClasses[stat.color])}>
                  <stat.icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-surface-900">Stock by Category</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
              {byCategory?.reduce((sum: number, c: any) => sum + (c.totalQuantity || 0), 0) || 0} total units
            </span>
          </div>
          {byCategory && byCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="totalQuantity"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {byCategory.map((_item: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Units']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state h-64">
              <ClipboardDocumentListIcon className="empty-state-icon" />
              <p className="empty-state-title">No category data</p>
              <p className="empty-state-description">Add products and categories to see stock distribution</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-surface-900">Stock by Warehouse</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
              {byWarehouse?.reduce((sum: number, w: any) => sum + (w.totalQuantity || 0), 0) || 0} total units
            </span>
          </div>
          {byWarehouse && byWarehouse.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byWarehouse} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f5f5f5" vertical={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <YAxis dataKey="warehouse" type="category" width={100} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Units']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="totalQuantity" fill="#3b82f6" radius={[0, 8, 8, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state h-64">
              <BuildingOfficeIcon className="empty-state-icon" />
              <p className="empty-state-title">No warehouse data</p>
              <p className="empty-state-description">Configure warehouses to see stock distribution</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-surface-900">Activity Trend (7 Days)</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
              Last 7 days
            </span>
          </div>
          {activity && activity.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activity} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f5f5f5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(new Date(v), 'MMM dd')}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('_', ' ')
                    ]}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1)' }}
                    labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  {['RECEIPT', 'DELIVERY', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'].map((type, index) => (
                    <Line
                      key={type}
                      type="monotone"
                      dataKey={type}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state h-64">
              <ArrowTrendingUpIcon className="empty-state-icon" />
              <p className="empty-state-title">No activity data</p>
              <p className="empty-state-description">Activity will appear once operations are performed</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-surface-900">Quick Actions</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
              Common tasks
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href="/operations/receipts/new" className="card-hover p-4 text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <ArrowDownTrayIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-surface-900">New Receipt</p>
              <p className="text-xs text-surface-500 mt-0.5">Record incoming stock</p>
            </a>
            <a href="/operations/deliveries/new" className="card-hover p-4 text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-success-100 text-success-600 flex items-center justify-center group-hover:bg-success-600 group-hover:text-white transition-colors">
                <ArrowUpTrayIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-surface-900">New Delivery</p>
              <p className="text-xs text-surface-500 mt-0.5">Ship to customer</p>
            </a>
            <a href="/operations/transfers/new" className="card-hover p-4 text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center group-hover:bg-warning-600 group-hover:text-white transition-colors">
                <ArrowsRightLeftIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-surface-900">New Transfer</p>
              <p className="text-xs text-surface-500 mt-0.5">Move between locations</p>
            </a>
            <a href="/operations/adjustments/new" className="card-hover p-4 text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center group-hover:bg-accent-600 group-hover:text-white transition-colors">
                <WrenchScrewdriverIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-surface-900">New Adjustment</p>
              <p className="text-xs text-surface-500 mt-0.5">Fix stock count</p>
            </a>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-surface-900">Recent Stock Movements</h2>
          <a href="/stock" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all
            <ArrowTrendingUpIcon className="h-4 w-4" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Location</th>
                <th>Type</th>
                <th className="text-right">Qty Change</th>
                <th>User</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {kpis?.recentMoves?.slice(0, 8).map((move) => (
                <tr key={move.id}>
                  <td className="font-medium text-surface-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <CubeIcon className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{move.product?.name}</p>
                        <p className="text-xs text-surface-500">{move.product?.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="h-4 w-4 text-surface-400" />
                      <span className="text-sm">{move.location?.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={clsx('badge-dot', {
                      'badge-info': move.refType === 'RECEIPT',
                      'badge-success': move.refType === 'DELIVERY',
                      'badge-warning': move.refType === 'TRANSFER_IN',
                      'badge-gray': move.refType === 'TRANSFER_OUT',
                      'badge-danger': move.refType === 'ADJUSTMENT',
                    })}>{move.refType}</span>
                  </td>
                  <td className="text-right font-mono tabular-nums">
                    <span className={clsx('font-medium', move.qtyDelta > 0 ? 'text-success-600' : 'text-danger-600')}>
                      {move.qtyDelta > 0 ? '+' : ''}{move.qtyDelta}
                    </span>
                  </td>
                  <td className="text-sm text-surface-600">{move.user?.name}</td>
                  <td className="text-sm text-surface-500 whitespace-nowrap">{format(new Date(move.createdAt), 'MMM dd, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}