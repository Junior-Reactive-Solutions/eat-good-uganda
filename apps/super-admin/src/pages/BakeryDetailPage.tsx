import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'

import { BakeryStatusBadge } from '../components/BakeryStatusBadge'
import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import {
  useApproveBakery,
  useBakeryDetail,
  useReactivateBakery,
  useSuspendBakery,
} from '../features/bakeries/api'

export default function BakeryDetailPage() {
  const navigate = useNavigate()
  const { bakeryId } = useParams<{ bakeryId: string }>()
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)

  const { data: detail, isLoading, error } = useBakeryDetail(bakeryId)
  const approveMutation = useApproveBakery()
  const suspendMutation = useSuspendBakery()
  const reactivateMutation = useReactivateBakery()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !detail) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error">Failed to load bakery details</p>
        <button
          onClick={() => {
            void navigate('/bakeries')
          }}
          className="mt-2 text-sm text-platform-error underline hover:no-underline"
        >
          Go back to bakeries
        </button>
      </div>
    )
  }

  const bakery = detail.bakery

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ bakeryId: bakery.id })
      toast.success('Bakery approved successfully')
      setApproveDialogOpen(false)
    } catch {
      toast.error('Failed to approve bakery')
    }
  }

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error('Please provide a reason for suspension')
      return
    }
    try {
      await suspendMutation.mutateAsync({ bakeryId: bakery.id, reason: suspendReason })
      toast.success('Bakery suspended successfully')
      setSuspendDialogOpen(false)
      setSuspendReason('')
    } catch {
      toast.error('Failed to suspend bakery')
    }
  }

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync({ bakeryId: bakery.id })
      toast.success('Bakery reactivated successfully')
      setReactivateDialogOpen(false)
    } catch {
      toast.error('Failed to reactivate bakery')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            void navigate('/bakeries')
          }}
          className="text-platform-fg-muted hover:text-platform-fg"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-platform-fg">{bakery.display_name}</h1>
          <p className="text-platform-fg-muted">@{bakery.slug}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Bakery Info Card */}
          <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
            <h2 className="mb-6 text-lg font-semibold text-platform-fg">Bakery Information</h2>

            {/* Logo */}
            {bakery.logo_url && (
              <div className="mb-6">
                <img
                  src={bakery.logo_url}
                  alt={bakery.display_name}
                  className="h-32 w-32 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Legal Name */}
            <div className="mb-4">
              <label className="text-sm font-medium text-platform-fg">Legal Name</label>
              <p className="text-platform-fg-muted">{bakery.legal_name}</p>
            </div>

            {/* Description */}
            {bakery.description && (
              <div className="mb-4">
                <label className="text-sm font-medium text-platform-fg">Description</label>
                <p className="text-platform-fg-muted">{bakery.description}</p>
              </div>
            )}

            {/* Contact */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 text-platform-fg-muted">
                <Mail className="h-4 w-4" />
                <span>{bakery.email}</span>
              </div>
              <div className="flex items-center gap-2 text-platform-fg-muted">
                <Phone className="h-4 w-4" />
                <span>{bakery.phone}</span>
              </div>
            </div>

            {/* Address */}
            <div className="mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-platform-fg-muted" />
                <div>
                  <p className="text-platform-fg-muted">{bakery.address_line1}</p>
                  {bakery.address_line2 && (
                    <p className="text-platform-fg-muted">{bakery.address_line2}</p>
                  )}
                  <p className="text-platform-fg-muted">{bakery.city}</p>
                  <p className="text-xs text-platform-fg-muted">
                    Coordinates: {bakery.latitude.toFixed(4)}, {bakery.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Fulfillment */}
            <div className="mb-4 border-t border-platform-border pt-4">
              <h3 className="mb-2 text-sm font-medium text-platform-fg">Fulfillment</h3>
              <div className="space-y-1 text-sm text-platform-fg-muted">
                <p>
                  Pickup:{' '}
                  <span className="font-medium">{bakery.accepts_pickup ? 'Yes' : 'No'}</span>
                </p>
                <p>
                  Delivery:{' '}
                  <span className="font-medium">{bakery.accepts_delivery ? 'Yes' : 'No'}</span>
                </p>
                {bakery.delivery_fee_minor && (
                  <p>
                    Delivery Fee:{' '}
                    <span className="font-medium">
                      UGX {(bakery.delivery_fee_minor / 100).toLocaleString()}
                    </span>
                  </p>
                )}
                {bakery.delivery_radius_km && (
                  <p>
                    Delivery Radius:{' '}
                    <span className="font-medium">{bakery.delivery_radius_km} km</span>
                  </p>
                )}
              </div>
            </div>

            {/* Branding */}
            <div className="border-t border-platform-border pt-4">
              <h3 className="mb-2 text-sm font-medium text-platform-fg">Branding</h3>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-platform-fg-muted">Primary Color</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded border border-platform-border"
                      style={{ backgroundColor: bakery.primary_color }}
                    />
                    <span className="text-sm text-platform-fg">{bakery.primary_color}</span>
                  </div>
                </div>
                {bakery.accent_color && (
                  <div>
                    <p className="text-xs text-platform-fg-muted">Accent Color</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded border border-platform-border"
                        style={{ backgroundColor: bakery.accent_color }}
                      />
                      <span className="text-sm text-platform-fg">{bakery.accent_color}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Staff Card */}
          {detail.staff.length > 0 && (
            <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
              <h2 className="mb-4 text-lg font-semibold text-platform-fg">
                Staff Members ({detail.staff.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-platform-border">
                      <th className="px-4 py-2 text-left font-medium text-platform-fg">Name</th>
                      <th className="px-4 py-2 text-left font-medium text-platform-fg">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-platform-fg">Role</th>
                      <th className="px-4 py-2 text-left font-medium text-platform-fg">
                        Last Login
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.staff.map((user) => (
                      <tr key={user.id} className="border-b border-platform-border">
                        <td className="px-4 py-3 text-platform-fg">{user.full_name}</td>
                        <td className="px-4 py-3 text-platform-fg-muted">{user.email}</td>
                        <td className="px-4 py-3 text-platform-fg-muted">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-platform-fg-muted">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-platform-fg">Status</h2>
            <BakeryStatusBadge status={bakery.status} approvedAt={bakery.approved_at} />
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-platform-fg-muted">Created</p>
                <p className="font-medium text-platform-fg">
                  {new Date(bakery.created_at).toLocaleDateString()}
                </p>
              </div>
              {bakery.approved_at && (
                <div>
                  <p className="text-platform-fg-muted">Approved</p>
                  <p className="font-medium text-platform-fg">
                    {new Date(bakery.approved_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metrics Card */}
          <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-platform-fg">Metrics</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-platform-fg-muted">Total Orders</p>
                <p className="text-xl font-semibold text-platform-fg">
                  {detail.metrics.totalOrdersCount}
                </p>
              </div>
              <div>
                <p className="text-platform-fg-muted">Total Revenue</p>
                <p className="text-xl font-semibold text-platform-fg">
                  UGX {(detail.metrics.totalRevenueMinor / 100).toLocaleString()}
                </p>
              </div>
              {detail.metrics.ordersByStatus.length > 0 && (
                <div>
                  <p className="mb-2 text-platform-fg-muted">Orders by Status</p>
                  <div className="space-y-1">
                    {detail.metrics.ordersByStatus.map((item) => (
                      <p key={item.status} className="text-sm text-platform-fg-muted">
                        {item.status}: <span className="font-medium">{item.count}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-platform-fg">Actions</h2>
            <div className="space-y-2">
              {bakery.status === 'pending_approval' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setApproveDialogOpen(true)
                  }}
                  disabled={approveMutation.isPending}
                  className="w-full"
                >
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              )}

              {bakery.status === 'active' && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setSuspendDialogOpen(true)
                  }}
                  disabled={suspendMutation.isPending}
                  className="w-full"
                >
                  {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
                </Button>
              )}

              {bakery.status === 'suspended' && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setReactivateDialogOpen(true)
                  }}
                  disabled={reactivateMutation.isPending}
                  className="w-full"
                >
                  {reactivateMutation.isPending ? 'Reactivating...' : 'Reactivate'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Approve Dialog */}
      {approveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-platform-border bg-platform-surface p-6 max-w-sm">
            <h2 className="mb-2 text-lg font-semibold text-platform-fg">Approve Bakery?</h2>
            <p className="mb-6 text-sm text-platform-fg-muted">
              Are you sure you want to approve {bakery.display_name}? They will be able to accept
              orders immediately.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setApproveDialogOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  void handleApprove()
                }}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Dialog */}
      {suspendDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-platform-border bg-platform-surface p-6 max-w-sm">
            <h2 className="mb-2 text-lg font-semibold text-platform-fg">Suspend Bakery?</h2>
            <p className="mb-4 text-sm text-platform-fg-muted">Provide a reason for suspension:</p>
            <textarea
              value={suspendReason}
              onChange={(e) => {
                setSuspendReason(e.target.value)
              }}
              placeholder="Reason for suspension..."
              className="mb-4 w-full rounded-lg border border-platform-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-platform-primary"
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSuspendDialogOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void handleSuspend()
                }}
                disabled={suspendMutation.isPending || !suspendReason.trim()}
              >
                {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Dialog */}
      {reactivateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-platform-border bg-platform-surface p-6 max-w-sm">
            <h2 className="mb-2 text-lg font-semibold text-platform-fg">Reactivate Bakery?</h2>
            <p className="mb-6 text-sm text-platform-fg-muted">
              Are you sure you want to reactivate {bakery.display_name}? They will be able to accept
              orders again.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setReactivateDialogOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  void handleReactivate()
                }}
                disabled={reactivateMutation.isPending}
              >
                {reactivateMutation.isPending ? 'Reactivating...' : 'Reactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
