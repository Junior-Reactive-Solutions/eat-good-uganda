import { useEffect, useRef, useState } from 'react'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  IconAdminApproved,
  IconAdminRejected,
  IconNavigationCart,
  IconInteractionDelete,
  IconPaymentMomo,
  IconInteractionClock,
} from '../components/icons'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { PaymentCredentialForm } from '../components/PaymentCredentialForm'
import {
  useCreatePaymentCredential,
  useDeletePaymentCredential,
  usePaymentCredentials,
} from '../features/settings/api'
import {
  useCreateTestOrder,
  useInitiateTestPayment,
  useTestPaymentStatus,
} from '../features/settings/useTestPayment'

const providerLabels = {
  mtn_momo: 'MTN Mobile Money (MoMo)',
  airtel_money: 'Airtel Money',
  bank_transfer: 'Bank Transfer',
}

type TestPaymentPhase = 'idle' | 'initiating' | 'polling' | 'success' | 'failed' | 'timeout'

const TEST_PHONE = '+256700000000'
const POLL_TIMEOUT_MS = 30 * 1000 // 30 seconds

export default function PaymentSetupPage() {
  const { data, isLoading, error } = usePaymentCredentials()
  const createCredential = useCreatePaymentCredential()
  const deleteCredential = useDeletePaymentCredential()
  const [isAdding, setIsAdding] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<
    'mtn_momo' | 'airtel_money' | 'bank_transfer'
  >('mtn_momo')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Test payment state
  const [testPhase, setTestPhase] = useState<TestPaymentPhase>('idle')
  const [testOrderId, setTestOrderId] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const createTestOrder = useCreateTestOrder()
  const initiateTestPayment = useInitiateTestPayment()

  const { data: paymentStatus } = useTestPaymentStatus(testOrderId ?? '', testPhase === 'polling')

  // React to polling result
  useEffect(() => {
    if (testPhase !== 'polling' || !paymentStatus) return

    if (paymentStatus.status === 'paid') {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
      setTestPhase('success')
    } else if (paymentStatus.status === 'failed') {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
      setTestError(paymentStatus.reason ?? 'Payment failed')
      setTestPhase('failed')
    }
  }, [paymentStatus, testPhase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    }
  }, [])

  const handleTestPaymentClick = async () => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    setTestPhase('initiating')
    setTestError(null)
    setTestOrderId(null)

    try {
      // Step 1: Create a minimal test order (1000 UGX)
      const testOrder = await createTestOrder.mutateAsync()
      setTestOrderId(testOrder.id)

      // Step 2: Initiate MoMo payment with test phone
      await initiateTestPayment.mutateAsync({
        orderId: testOrder.id,
        phone: TEST_PHONE,
      })
      setTestPhase('polling')

      // Set 30-second timeout
      pollTimeoutRef.current = setTimeout(() => {
        setTestPhase('timeout')
        setTestError('Payment timed out after 30 seconds. Check your MoMo configuration.')
      }, POLL_TIMEOUT_MS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate test payment'
      setTestError(message)
      setTestPhase('failed')
    }
  }

  const resetTestPayment = () => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    setTestPhase('idle')
    setTestOrderId(null)
    setTestError(null)
  }

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
            <IconNavigationCart size="sm" color="default" alt="" />
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
              <h3 className="text-lg font-semibold text-platform-fg mb-4">Add Payment Method</h3>

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
              {data.items.map((credential) => {
                const isMomoEnabled = credential.provider === 'mtn_momo' && credential.is_enabled

                return (
                  <Card
                    key={credential.id}
                    className="rounded-lg border border-platform-border bg-platform-surface p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                      <div className="flex shrink-0 items-center gap-2">
                        {isMomoEnabled && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              void handleTestPaymentClick()
                            }}
                            disabled={
                              testPhase === 'initiating' ||
                              testPhase === 'polling' ||
                              deleteCredential.isPending
                            }
                            className="gap-1.5"
                            aria-label="Test MoMo payment"
                            data-testid="test-payment-button"
                          >
                            {testPhase === 'initiating' || testPhase === 'polling' ? (
                              <IconInteractionClock
                                size="sm"
                                color="default"
                                className="animate-spin"
                                alt=""
                              />
                            ) : (
                              <IconPaymentMomo size="sm" color="default" alt="" />
                            )}
                            Test Payment
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setDeleteConfirm(credential.id)
                          }}
                          disabled={deleteCredential.isPending}
                          className="text-platform-error"
                          aria-label="Delete payment method"
                        >
                          <IconInteractionDelete size="sm" color="error" alt="" />
                        </Button>
                      </div>
                    </div>

                    {/* Test Payment Status Banner */}
                    {isMomoEnabled && testPhase !== 'idle' && (
                      <div className="mt-3">
                        {(testPhase === 'initiating' || testPhase === 'polling') && (
                          <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800 border border-blue-200">
                            <IconInteractionClock
                              size="sm"
                              color="default"
                              className="shrink-0 animate-spin"
                              alt=""
                            />
                            <span>Payment initiated — check your phone for the MoMo prompt</span>
                          </div>
                        )}

                        {testPhase === 'success' && (
                          <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 border border-green-200">
                            <IconAdminApproved
                              size="sm"
                              color="success"
                              className="shrink-0"
                              alt=""
                            />
                            <span>Payment received! MoMo integration is working correctly.</span>
                            <button
                              onClick={resetTestPayment}
                              className="ml-auto text-xs underline"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}

                        {(testPhase === 'failed' || testPhase === 'timeout') && testError && (
                          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 border border-red-200">
                            <div className="flex items-start gap-2">
                              <IconAdminRejected
                                size="sm"
                                color="error"
                                className="mt-0.5 shrink-0"
                                alt=""
                              />
                              <div className="flex-1">
                                <p className="font-medium">
                                  {testPhase === 'timeout' ? 'Payment timed out' : 'Payment failed'}
                                </p>
                                <p className="mt-0.5 text-xs text-red-700">{testError}</p>
                                <ul className="mt-1.5 space-y-0.5 text-xs text-red-700 list-disc list-inside">
                                  <li>Verify your MTN MoMo API credentials are correct</li>
                                  <li>Check that the environment (sandbox/production) matches</li>
                                  <li>Ensure the test phone number is registered for MoMo</li>
                                </ul>
                              </div>
                              <button
                                onClick={resetTestPayment}
                                className="ml-auto shrink-0 text-xs underline"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-platform-border bg-platform-surface p-8 text-center">
              <p className="text-sm text-platform-fg-muted">No payment methods configured yet.</p>
              {!isAdding && (
                <Button
                  onClick={() => {
                    setIsAdding(true)
                  }}
                  variant="secondary"
                  className="mt-4 gap-2"
                >
                  <IconNavigationCart size="sm" color="default" alt="" />
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
            <h2 className="text-lg font-semibold text-platform-fg mb-2">Delete Payment Method</h2>
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
