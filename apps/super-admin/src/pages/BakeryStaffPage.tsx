import type { BakeryStaff } from '@eatgood/db'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'


import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { StaffFormModal } from '@/components/modals/StaffFormModal'
import {
  IconNavigationMenu,
  IconInteractionEdit,
  IconInteractionDelete,
} from '@/components/icons'
import { useRemoveStaffMember, useStaff } from '@/features/staff/api'

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-blue-100 text-blue-700'
    case 'manager':
      return 'bg-orange-100 text-orange-700'
    case 'staff':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function BakeryStaffPage() {
  const navigate = useNavigate()
  const { bakeryId } = useParams<{ bakeryId: string }>()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<BakeryStaff | undefined>(undefined)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<BakeryStaff | undefined>(undefined)

  const { data: staff, isLoading, error } = useStaff(bakeryId ?? '')
  const removeMutation = useRemoveStaffMember()

  const handleAddStaff = () => {
    setSelectedStaff(undefined)
    setModalOpen(true)
  }

  const handleEditStaff = (member: BakeryStaff) => {
    setSelectedStaff(member)
    setModalOpen(true)
  }

  const handleDeleteClick = (member: BakeryStaff) => {
    setStaffToDelete(member)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return
    try {
      await removeMutation.mutateAsync(staffToDelete.id)
      toast.success('Staff member removed')
      setDeleteConfirmOpen(false)
      setStaffToDelete(undefined)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove staff member'
      toast.error(message)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error mb-3">Failed to load staff members</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigate('/bakeries')
          }}
        >
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            void navigate('/bakeries')
          }}
          className="text-platform-fg-muted hover:text-platform-fg transition-colors"
          aria-label="Go back"
        >
          <IconNavigationMenu size="md" color="default" alt="" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-platform-fg">Bakery Staff</h1>
          <p className="text-sm text-platform-fg-muted mt-1">Manage staff members for this bakery</p>
        </div>
        <Button variant="primary" onClick={handleAddStaff}>
          Add Staff Member
        </Button>
      </div>

      {/* Staff Table */}
      <div className="rounded-lg border border-platform-border bg-platform-surface overflow-hidden">
        {staff && staff.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-platform-fg-muted mb-4">No staff members yet. Add one to get started.</p>
            <Button variant="primary" onClick={handleAddStaff}>
              Add First Staff Member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-platform-border bg-platform-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Last Login</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-platform-fg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platform-border">
                {staff?.map((member) => (
                  <tr key={member.id} className="hover:bg-platform-bg transition-colors">
                    <td className="px-6 py-3 text-sm text-platform-fg">{member.full_name}</td>
                    <td className="px-6 py-3 text-sm text-platform-fg-muted">{member.email}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(member.role)}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-platform-fg-muted">
                      {formatDate(member.last_login_at)}
                    </td>
                    <td className="px-6 py-3 text-sm space-x-2">
                      <button
                        onClick={() => { handleEditStaff(member); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-platform-fg hover:bg-platform-bg transition-colors"
                        title="Edit staff member"
                      >
                        <IconInteractionEdit size="sm" color="default" alt="" />
                      </button>
                      <button
                        onClick={() => { handleDeleteClick(member); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-platform-error hover:bg-red-50 transition-colors"
                        title="Remove staff member"
                      >
                        <IconInteractionDelete size="sm" color="error" alt="" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <StaffFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedStaff(undefined)
          }}
          bakeryId={bakeryId ?? ''}
          initialData={selectedStaff ?? undefined}
          onSuccess={() => {
            // Data will be refetched via query invalidation
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-platform-surface shadow-lg p-6">
            <h3 className="text-lg font-semibold text-platform-fg mb-2">Remove Staff Member?</h3>
            <p className="text-sm text-platform-fg-muted mb-4">
              Are you sure you want to remove <strong>{staffToDelete.full_name}</strong> from the staff?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setStaffToDelete(undefined)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void handleConfirmDelete()
                }}
                loading={removeMutation.isPending}
                className="flex-1"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
