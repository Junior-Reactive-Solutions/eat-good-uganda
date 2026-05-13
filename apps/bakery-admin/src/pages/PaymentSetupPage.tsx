import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { PaymentCredentialForm } from '../components/PaymentCredentialForm'
import {
  useCreatePaymentCredential,
  useDeletePaymentCredential,
  usePaymentCredentials,
} from '../features/settings/api'

const providerLabels = {
  mtn_momo: 'MTN Mobile Money (MoMo)',
  airtel_money: 'Airtel Money',
  bank_transfer: 'Bank Transfer',
}

export default function PaymentSetupPage() {
  const { data, isLoading, error } = usePaymentCredentials()
  const createCredential = useCreatePaymentCredential()
  const deleteCredential = useDeletePaymentCredential()
  const [isAdding, setIsAdding] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'mtn_momo' | 'airtel_money' | 'bank_transfer'>(
    'mtn_momo',
  )
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleCreateCredential = (credentialData: {
    account_number: string
    account_holder: string
    api_key?: string | null
  }) => {
    // Create encrypted config object
    // For now, using a simple base64 encoding as placeholder
    // In production, this would use proper encryption
    const configJson = JSON.stringify({
      account_number: credentialData.account_number,
      account_holder: credentialData.account_holder,
      api_key: credentialData.api_key || '',
    })
    const encryptedConfig = Buffer.from(configJson).toString('base64')
    const configNonce = Buffer.from(Math.random().toString()).toString('base64')

    createCredential.mutate(
      {
        provider: selectedProvider,
        is_enabled: true,
        target_environment: 'production',
        encrypted_config: encryptedConfig,
        config_nonce: configNonce,
      },
      {
        onSuccess: () => {
          setIsAdding(false)
          setSelectedProvider('mtn_momo')
        },
      },
    )
  }

  const handleDeleteConfirm = (credentialId: string) => {
    deleteCredential.mutate(credentialId, {
      onSuccess: () => {
        setDeleteConfirm(null)
      },
    })
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <PageHeader title="Payment Setup" subtitle="Configure your payment methods" />
        {!isAdding && (
          <Button
            onClick={() => {
              setIsAdding(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method
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
            {error instanceof Error ? error.message : 'Failed to load payment methods'}
          </p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Add New Credential Form */}
          {isAdding && (
            <Card className="rounded-lg border border-platform-border bg-platform-surface p-6">
              <h3 className="text-lg font-semibold text-platform-fg mb-4">
                Add Payment Method
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-platform-fg mb-2">
                  Select Provider
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['mtn_momo', 'airtel_money', 'bank_transfer'] as const).map((prov) => (
                    <button
                      key={prov}
                      onClick={() => {
                        setSelectedProvider(prov)
                      }}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        selectedProvider === prov
                          ? 'border-platform-primary bg-platform-primary/10 text-platform-primary'
                          : 'border-platform-border bg-platform-surface text-platform-fg hover:border-platform-fg/50'
                      }`}
                    >
                      {providerLabels[prov]}
                    </button>
                  ))}
                </div>
              </div>

              <PaymentCredentialForm
                provider={selectedProvider}
                isCreating
                isLoading={createCredential.isPending}
                onSubmit={handleCreateCredential}
              />

              <Button
                variant="secondary"
                onClick={() => {
                  setIsAdding(false)
                }}
                disabled={createCredential.isPending}
                className="w-full mt-3"
              >
                Cancel
              </Button>

              {createCredential.isError && (
                <div className="mt-3 rounded-lg border border-platform-error bg-red-50 p-3">
                  <p className="text-xs text-platform-error">
                    {createCredential.error instanceof Error
                      ? createCredential.error.message
                      : 'Failed to create credentials'}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Existing Credentials */}
          {data && data.items.length > 0 ? (
            <div className="space-y-3">
              {data.items.map((credential) => (
                <Card
                  key={credential.id}
                  className="rounded-lg border border-platform-border bg-platform-surface p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-platform-fg">
                        {providerLabels[credential.provider]}
                      </h4>
                      <p className="text-sm text-platform-fg-muted">
                        Added {new Date(credential.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-platform-fg-muted mt-1">
                        Status: {credential.is_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setDeleteConfirm(credential.id)
                      }}
                      disabled={deleteCredential.isPending}
                      className="text-platform-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-platform-border bg-platform-surface p-8 text-center">
              <p className="text-sm text-platform-fg-muted">
                No payment methods configured yet.
              </p>
              {!isAdding && (
                <Button
                  onClick={() => {
                    setIsAdding(true)
                  }}
                  variant="secondary"
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Payment Method
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
              Delete Payment Method
            </h2>
            <p className="text-sm text-platform-fg-muted mb-6">
              Are you sure you want to delete this payment method? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteConfirm(null)
                }}
                disabled={deleteCredential.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleDeleteConfirm(deleteConfirm)
                }}
                disabled={deleteCredential.isPending}
                className="flex-1"
              >
                {deleteCredential.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
