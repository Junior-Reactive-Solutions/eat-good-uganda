import type { SupportTicket, TicketDetail } from '@eatgood/db'
import { useState } from 'react'

import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  IconNavigationMenu,
  IconAdminAuditLog,
  IconInteractionPhone,
  IconInteractionDelete,
} from '@/components/icons'
import {
  useSendMessage,
  useTicketDetail,
  useTickets,
  useUpdateTicketPriority,
  useUpdateTicketStatus,
} from '@/features/support/api'
import { useDebounce } from '@/lib/hooks'

const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 border-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    resolved: 'bg-green-100 text-green-800 border-green-300',
    closed: 'bg-gray-100 text-gray-800 border-gray-300',
  }

  const colorClass = (colors[status] ?? colors.open) as string
  const displayStatus = status.replace('_', ' ')

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
    </span>
  )
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 border-gray-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-red-100 text-red-800 border-red-300',
  }

  const colorClass = (colors[priority] ?? colors.medium) as string

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

interface TicketDetailModalProps {
  ticket: TicketDetail | null
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
}

function TicketDetailModal({ ticket, isOpen, isLoading, onClose }: TicketDetailModalProps) {
  const [newMessage, setNewMessage] = useState('')

  const sendMessageMutation = useSendMessage()
  const updateStatusMutation = useUpdateTicketStatus()
  const updatePriorityMutation = useUpdateTicketPriority()

  if (!isOpen || !ticket) return null

  // Initialize status dropdown with current ticket status
  const handleStatusChange = (status: 'open' | 'in_progress' | 'resolved' | 'closed'): void => {
    updateStatusMutation.mutate({ ticketId: ticket.id, status })
  }

  const handleSendMessage = (): void => {
    if (!newMessage.trim()) return

    sendMessageMutation.mutate(
      {
        ticketId: ticket.id,
        message: newMessage,
      },
      {
        onSuccess: () => {
          setNewMessage('')
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-platform-surface rounded-lg border border-platform-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-platform-border p-4">
          <h2 className="text-lg font-bold text-platform-fg">{ticket.subject}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-platform-bg rounded transition-colors"
            aria-label="Close modal"
          >
            <IconInteractionDelete size="sm" color="default" alt="" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Ticket Info */}
              <div className="bg-platform-bg p-4 rounded-lg space-y-3">
                <div>
                  <label className="text-xs font-medium text-platform-fg-muted uppercase">
                    Description
                  </label>
                  <p className="text-sm text-platform-fg mt-1">{ticket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-platform-fg-muted uppercase">
                      Status
                    </label>
                    <div className="mt-1">
                      <select
                        value={ticket.status}
                        onChange={(e): void => {
                          handleStatusChange(
                            e.target.value as 'open' | 'in_progress' | 'resolved' | 'closed',
                          )
                        }}
                        className="w-full rounded border border-platform-border bg-platform-surface px-2 py-1 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-platform-fg-muted uppercase">
                      Priority
                    </label>
                    <div className="mt-1">
                      <select
                        value={ticket.priority}
                        onChange={(e): void => {
                          void updatePriorityMutation.mutateAsync({
                            ticketId: ticket.id,
                            priority: e.target.value as 'low' | 'medium' | 'high',
                          })
                        }}
                        className="w-full rounded border border-platform-border bg-platform-surface px-2 py-1 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs font-medium text-platform-fg-muted uppercase">
                      Created
                    </label>
                    <p className="text-platform-fg">{formatDate(ticket.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-platform-fg-muted uppercase">
                      Updated
                    </label>
                    <p className="text-platform-fg">{formatDate(ticket.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                <h3 className="font-medium text-platform-fg flex items-center gap-2">
                  <IconAdminAuditLog size="sm" color="default" alt="" />
                  Messages
                </h3>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ticket.messages.length > 0 ? (
                    ticket.messages.map((message: { id: string; sender_type: string; content: string; created_at: string }) => (
                      <div
                        key={message.id}
                        className="bg-platform-bg p-3 rounded-lg border border-platform-border text-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-platform-fg">
                            {message.sender_type === 'super_admin' ? 'You' : message.sender_type}
                          </span>
                          <span className="text-xs text-platform-fg-muted">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-platform-fg">{message.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-platform-fg-muted italic">No messages yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reply Form */}
        <div className="border-t border-platform-border p-4 space-y-3">
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
            }}
            placeholder="Add a reply..."
            rows={3}
            className="w-full rounded border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg placeholder-platform-fg-muted focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={onClose} variant="secondary" className="px-3 py-1 text-sm">
              Close
            </Button>
            <Button
              onClick={(): void => {
                handleSendMessage()
              }}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="px-3 py-1 text-sm inline-flex items-center gap-1"
            >
              {sendMessageMutation.isPending ? (
                'Sending...'
              ) : (
                <>
                  <IconInteractionPhone size="sm" color="default" alt="" /> Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SupportPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'open' | 'in_progress' | 'resolved' | 'closed'
  >('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)

  // Debounce filters
  const debouncedStatusFilter = useDebounce(statusFilter, 300)
  const debouncedPriorityFilter = useDebounce(priorityFilter, 300)

  const { data, isLoading, error } = useTickets({
    page,
    pageSize,
    ...(debouncedStatusFilter !== 'all' && { status: debouncedStatusFilter }),
    ...(debouncedPriorityFilter !== 'all' && { priority: debouncedPriorityFilter }),
  })

  const ticketDetailQuery = useTicketDetail(modalOpen ? selectedTicket?.id : null)
  const ticketDetail = ticketDetailQuery.data
  const isDetailLoading = ticketDetailQuery.isLoading

  const tickets = data?.tickets ?? []
  const pagination = data?.pagination ?? { page: 1, pageSize, totalCount: 0, totalPages: 0 }

  const handleOpenModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedTicket(undefined)
  }

  const handleClearFilters = () => {
    setStatusFilter('all')
    setPriorityFilter('all')
    setPage(1)
  }

  const hasFilters = statusFilter !== 'all' || priorityFilter !== 'all'

  if (isLoading && page === 1) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-platform-error bg-red-50 p-4">
        <p className="text-sm text-platform-error">Failed to load support tickets</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-platform-fg">Support Tickets</h1>
        <p className="text-sm text-platform-fg-muted mt-1">
          Manage customer support requests and respond to inquiries
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-platform-border bg-platform-surface p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-platform-fg mb-1"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e): void => {
                setStatusFilter(
                  e.target.value as 'all' | 'open' | 'in_progress' | 'resolved' | 'closed',
                )
                setPage(1)
              }}
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="priority-filter"
              className="block text-sm font-medium text-platform-fg mb-1"
            >
              Priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e): void => {
                setPriorityFilter(e.target.value as 'all' | 'low' | 'medium' | 'high')
                setPage(1)
              }}
              className="w-full rounded-lg border border-platform-border bg-platform-bg px-3 py-2 text-sm text-platform-fg focus:border-platform-primary focus:outline-none focus:ring-1 focus:ring-platform-primary"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex items-end">
            {hasFilters && (
              <Button onClick={handleClearFilters} variant="secondary" className="w-full">
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-platform-border bg-platform-surface overflow-hidden">
        {tickets.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-platform-bg border-b border-platform-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-platform-fg">Subject</th>
                    <th className="px-4 py-3 text-left font-medium text-platform-fg hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-platform-fg hidden md:table-cell">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-platform-fg hidden lg:table-cell">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-platform-fg">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => {
                        handleOpenModal(ticket)
                      }}
                      className="border-b border-platform-border hover:bg-platform-bg cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-platform-fg max-w-xs truncate">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-3 text-platform-fg-muted hidden lg:table-cell text-xs">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-4 py-3 text-platform-fg-muted">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-platform-border p-4">
                <p className="text-xs text-platform-fg-muted">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={(): void => {
                      setPage(page - 1)
                    }}
                    disabled={page === 1}
                    variant="secondary"
                    className="px-3 py-1 text-sm"
                  >
                    <IconNavigationMenu size="sm" color="default" alt="" />
                  </Button>
                  <Button
                    onClick={(): void => {
                      setPage(Math.min(pagination.totalPages, page + 1))
                    }}
                    disabled={page === pagination.totalPages}
                    variant="secondary"
                    className="px-3 py-1 text-sm"
                  >
                    <IconNavigationMenu size="sm" color="default" alt="" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-platform-fg-muted">No support tickets found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <TicketDetailModal
        ticket={ticketDetail || null}
        isOpen={modalOpen}
        isLoading={isDetailLoading}
        onClose={handleCloseModal}
      />
    </div>
  )
}
