import { useState } from 'react'
import {
  useCustomerAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '../features/profile/api'
import { AddressForm } from '../components/AddressForm'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import {
  IconNavigationCart,
  IconInteractionEdit,
  IconInteractionDelete,
} from '../components/icons'
import type { CustomerAddress } from '@eatgood/shared'

export default function AddressesPage() {
  const { data, isLoading, error } = useCustomerAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress('')
  const deleteAddress = useDeleteAddress()

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleCreateAddress = (data: any) => {
    createAddress.mutate(data, {
      onSuccess: () => {
        setIsAdding(false)
      },
    })
  }

  const handleUpdateAddress = (addressId: string, data: any) => {
    updateAddress.mutate(data, {
      onSuccess: () => {
        setEditingId(null)
      },
    })
  }

  const handleDeleteConfirm = (addressId: string) => {
    deleteAddress.mutate(addressId, {
      onSuccess: () => {
        setDeleteConfirm(null)
      },
    })
  }

  const editingAddress = data?.items.find((a) => a.id === editingId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          heading="My Addresses"
          subheading="Manage your delivery and billing addresses"
        />
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <IconNavigationCart size="sm" color="default" alt="" />
            Add Address
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-platform-error bg-red-50 p-4">
          <p className="text-sm text-platform-error">
            {error instanceof Error ? error.message : 'Failed to load addresses'}
          </p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <Card className="rounded-lg border border-platform-border bg-platform-surface p-6">
              <h3 className="text-lg font-semibold text-platform-fg mb-4">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h3>

              <AddressForm
                address={editingAddress || null}
                isLoading={createAddress.isPending || updateAddress.isPending}
                onSubmit={(data) => {
                  if (editingId) {
                    handleUpdateAddress(editingId, data)
                  } else {
                    handleCreateAddress(data)
                  }
                }}
              />

              <Button
                variant="secondary"
                onClick={() => {
                  setIsAdding(false)
                  setEditingId(null)
                }}
                disabled={createAddress.isPending || updateAddress.isPending}
                className="w-full mt-3"
              >
                Cancel
              </Button>

              {(createAddress.isError || updateAddress.isError) && (
                <div className="mt-3 rounded-lg border border-platform-error bg-red-50 p-3">
                  <p className="text-xs text-platform-error">
                    {(createAddress.error || updateAddress.error)
                      ? (createAddress.error || updateAddress.error) instanceof Error
                        ? (createAddress.error || updateAddress.error)!.message
                        : 'Failed to save address'
                      : 'Failed to save address'}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Addresses List */}
          {data && data.items.length > 0 ? (
            <div className="space-y-3">
              {data.items.map((address: CustomerAddress) => (
                <Card
                  key={address.id}
                  className="rounded-lg border border-platform-border bg-platform-surface p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-platform-fg">
                        {address.street_address}
                      </p>
                      <p className="text-sm text-platform-fg-muted">
                        {address.city}, {address.district}
                        {address.postal_code && ` ${address.postal_code}`}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {address.is_default && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            Default
                          </span>
                        )}
                        {address.is_delivery_address && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Delivery
                          </span>
                        )}
                        {address.is_billing_address && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                            Billing
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingId(address.id)}
                        disabled={createAddress.isPending || updateAddress.isPending}
                      >
                        <IconInteractionEdit size="sm" color="default" alt="" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDeleteConfirm(address.id)}
                        disabled={deleteAddress.isPending}
                        className="text-platform-error"
                      >
                        <IconInteractionDelete size="sm" color="error" alt="" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-platform-border bg-platform-surface p-8 text-center">
              <p className="text-sm text-platform-fg-muted mb-4">
                No addresses saved yet.
              </p>
              {!isAdding && !editingId && (
                <Button
                  onClick={() => setIsAdding(true)}
                  variant="secondary"
                  className="gap-2 inline-flex"
                >
                  <IconNavigationCart size="sm" color="default" alt="" />
                  Add Your First Address
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-platform-surface rounded-lg shadow-lg max-w-sm w-full p-6 border border-platform-border">
            <h2 className="text-lg font-semibold text-platform-fg mb-2">
              Delete Address
            </h2>
            <p className="text-sm text-platform-fg-muted mb-6">
              Are you sure you want to delete this address? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteAddress.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteConfirm(deleteConfirm)}
                disabled={deleteAddress.isPending}
                className="flex-1"
              >
                {deleteAddress.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
