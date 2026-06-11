import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../../lib/api'

interface MomoCredentials {
  subscription_key: string
  user_id: string
  api_key: string
  target_environment: 'sandbox' | 'production'
  collection_primary_key?: string
}

interface AirtelCredentials {
  client_id: string
  client_secret: string
  target_environment: 'staging' | 'production'
}

export function PaymentSettingsPage() {
  const [momoData, setMomoData] = useState<MomoCredentials>({
    subscription_key: '',
    user_id: '',
    api_key: '',
    target_environment: 'sandbox',
  })

  const [airtelData, setAirtelData] = useState<AirtelCredentials>({
    client_id: '',
    client_secret: '',
    target_environment: 'staging',
  })

  const [activeTab, setActiveTab] = useState<'momo' | 'airtel' | 'other'>('momo')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch current settings
  const { data: settings } = useQuery({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      const response = await api.get('/v1/bakery/payment-settings')
      return response.data
    },
  })

  // Check MoMo configuration
  const { data: momoStatus } = useQuery({
    queryKey: ['paymentSettings', 'momo'],
    queryFn: async () => {
      const response = await api.get('/v1/bakery/payment-settings/mtn-momo')
      return response.data
    },
  })

  // Save MoMo credentials mutation
  const saveMomoMutation = useMutation({
    mutationFn: async (data: MomoCredentials) => {
      const response = await api.post('/v1/bakery/payment-settings/mtn-momo', data)
      return response.data
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'MTN MoMo credentials saved successfully!' })
      setMomoData({
        subscription_key: '',
        user_id: '',
        api_key: '',
        target_environment: 'sandbox',
      })
      setTimeout(() => setMessage(null), 5000)
    },
    onError: (error) => {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save credentials',
      })
    },
  })

  // Save Airtel credentials mutation
  const saveAirtelMutation = useMutation({
    mutationFn: async (data: AirtelCredentials) => {
      const response = await api.post('/v1/bakery/payment-settings/airtel-money', data)
      return response.data
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Airtel Money credentials saved successfully!' })
      setAirtelData({
        client_id: '',
        client_secret: '',
        target_environment: 'staging',
      })
      setTimeout(() => setMessage(null), 5000)
    },
    onError: (error) => {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save credentials',
      })
    },
  })

  const handleSaveMomo = (e: React.FormEvent) => {
    e.preventDefault()
    saveMomoMutation.mutate(momoData)
  }

  const handleSaveAirtel = (e: React.FormEvent) => {
    e.preventDefault()
    saveAirtelMutation.mutate(airtelData)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure payment methods for your bakery. Keep your credentials secure.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Available Payment Methods Summary */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
          <p className="mt-1 text-sm text-gray-600">Always available</p>
          <p className="mt-2 text-lg font-bold text-green-600">✓ Enabled</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900">Bank Transfer</h3>
          <p className="mt-1 text-sm text-gray-600">Always available</p>
          <p className="mt-2 text-lg font-bold text-green-600">✓ Enabled</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900">MTN MoMo</h3>
          <p className="mt-1 text-sm text-gray-600">
            {momoStatus?.configured ? 'Configured' : 'Not yet configured'}
          </p>
          <p
            className={`mt-2 text-lg font-bold ${
              momoStatus?.configured ? 'text-green-600' : 'text-yellow-600'
            }`}
          >
            {momoStatus?.configured ? '✓ Active' : '⚠ Setup Required'}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900">Airtel Money</h3>
          <p className="mt-1 text-sm text-gray-600">Coming soon</p>
          <p className="mt-2 text-lg font-bold text-gray-400">— Inactive</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('momo')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'momo'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            MTN MoMo
          </button>
          <button
            onClick={() => setActiveTab('airtel')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'airtel'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Airtel Money
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'other'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Other Methods
          </button>
        </div>
      </div>

      {/* MTN MoMo Form */}
      {activeTab === 'momo' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">MTN MoMo Configuration</h2>

          <form onSubmit={handleSaveMomo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Environment</label>
              <select
                value={momoData.target_environment}
                onChange={(e) =>
                  setMomoData({
                    ...momoData,
                    target_environment: e.target.value as 'sandbox' | 'production',
                  })
                }
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Use Sandbox first to test your integration
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Subscription Key</label>
              <input
                type="password"
                value={momoData.subscription_key}
                onChange={(e) =>
                  setMomoData({ ...momoData, subscription_key: e.target.value })
                }
                placeholder="Enter your subscription key"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                From your MTN MoMo Developer Account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">API User ID</label>
              <input
                type="text"
                value={momoData.user_id}
                onChange={(e) => setMomoData({ ...momoData, user_id: e.target.value })}
                placeholder="Enter your API user ID"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="password"
                value={momoData.api_key}
                onChange={(e) => setMomoData({ ...momoData, api_key: e.target.value })}
                placeholder="Enter your API key"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Collection Primary Key (Optional)
              </label>
              <input
                type="password"
                value={momoData.collection_primary_key || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setMomoData({
                    ...momoData,
                    ...(value ? { collection_primary_key: value } : { collection_primary_key: undefined as any }),
                  })
                }}
                placeholder="Enter your collection primary key (if applicable)"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saveMomoMutation.isPending}
                className="rounded bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {saveMomoMutation.isPending ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Airtel Money Form */}
      {activeTab === 'airtel' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Airtel Money Configuration</h2>

          <form onSubmit={handleSaveAirtel} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Environment</label>
              <select
                value={airtelData.target_environment}
                onChange={(e) =>
                  setAirtelData({
                    ...airtelData,
                    target_environment: e.target.value as 'staging' | 'production',
                  })
                }
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="staging">Staging (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Use Staging first to test your integration
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Client ID</label>
              <input
                type="text"
                value={airtelData.client_id}
                onChange={(e) => setAirtelData({ ...airtelData, client_id: e.target.value })}
                placeholder="Enter your client ID"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                From your Airtel Money Developer Account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Client Secret</label>
              <input
                type="password"
                value={airtelData.client_secret}
                onChange={(e) =>
                  setAirtelData({ ...airtelData, client_secret: e.target.value })
                }
                placeholder="Enter your client secret"
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saveAirtelMutation.isPending}
                className="rounded bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {saveAirtelMutation.isPending ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Other Methods Info */}
      {activeTab === 'other' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Other Payment Methods</h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4">
              <h3 className="font-semibold text-green-900">Cash on Delivery (COD)</h3>
              <p className="mt-2 text-green-800">
                Customers pay your bakery when their order is delivered. No additional
                configuration needed — this is enabled by default.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900">Bank Transfer</h3>
              <p className="mt-2 text-blue-800">
                Customers transfer directly to your bank account using the reference code we
                generate. You manually verify the transfer in your bank dashboard.
              </p>
              <p className="mt-2 text-sm text-blue-700">
                <strong>Coming in Phase 6E:</strong> Bakery bank account configuration UI
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
