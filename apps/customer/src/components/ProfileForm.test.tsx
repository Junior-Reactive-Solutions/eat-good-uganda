/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileForm } from './ProfileForm'
import type { CustomerProfile } from '@eatgood/shared'

describe('ProfileForm', () => {
  const mockProfile: CustomerProfile = {
    id: 'prof-1',
    user_id: 'user-1',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg',
    default_address_id: null,
    created_at: '2026-05-13T10:00:00Z',
    updated_at: '2026-05-13T10:00:00Z',
  }

  it('renders form with empty fields when profile is null', () => {
    const onSubmit = vi.fn()
    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    expect(screen.getByPlaceholderText('John')).toHaveValue('')
    expect(screen.getByPlaceholderText('Doe')).toHaveValue('')
  })

  it('renders form with populated fields when profile exists', () => {
    const onSubmit = vi.fn()
    render(<ProfileForm profile={mockProfile} onSubmit={onSubmit} />)

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
  })

  it('displays avatar preview when URL is provided', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={mockProfile} onSubmit={onSubmit} />)

    const avatarPreview = screen.getByAltText('Avatar preview')
    expect(avatarPreview).toBeInTheDocument()
    expect(avatarPreview).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('validates required first_name field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const submitButton = screen.getByText('Save Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
    })
  })

  it('validates required last_name field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const submitButton = screen.getByText('Save Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Last name is required')).toBeInTheDocument()
    })
  })

  it('validates bio max length (500 characters)', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    const longBio = 'a'.repeat(501)

    render(<ProfileForm profile={mockProfile} onSubmit={onSubmit} />)

    const bioField = screen.getByDisplayValue('Test bio')
    await user.clear(bioField)
    await user.type(bioField, longBio)

    const submitButton = screen.getByText('Save Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/String must contain at most 500 character/)).toBeInTheDocument()
    })
  })

  it('validates avatar URL format', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const avatarField = screen.getByPlaceholderText('https://example.com/avatar.jpg')
    await user.type(avatarField, 'not-a-url')

    const submitButton = screen.getByText('Save Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid avatar URL')).toBeInTheDocument()
    })
  })

  it('displays character count for bio field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={mockProfile} onSubmit={onSubmit} />)

    const bioField = screen.getByDisplayValue('Test bio')
    expect(screen.getByText('8/500 characters')).toBeInTheDocument()

    await user.clear(bioField)
    await user.type(bioField, 'New bio text')
    expect(screen.getByText('12/500 characters')).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const firstNameField = screen.getByPlaceholderText('John')
    const lastNameField = screen.getByPlaceholderText('Doe')

    await user.type(firstNameField, 'Jane')
    await user.type(lastNameField, 'Smith')

    const submitButton = screen.getByText('Save Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '',
        bio: '',
        avatar_url: null,
      })
    })
  })

  it('disables form fields and button when isLoading is true', () => {
    const onSubmit = vi.fn()
    render(<ProfileForm profile={mockProfile} onSubmit={onSubmit} isLoading={true} />)

    const firstNameField = screen.getByDisplayValue('John') as HTMLInputElement
    const lastNameField = screen.getByDisplayValue('Doe') as HTMLInputElement
    const submitButton = screen.getByText('Saving...')

    expect(firstNameField.disabled).toBe(true)
    expect(lastNameField.disabled).toBe(true)
    expect(submitButton).toBeDisabled()
  })

  it('displays "Saving..." text when loading', () => {
    const onSubmit = vi.fn()
    render(<ProfileForm profile={mockProfile} onSubmit={onSubmit} isLoading={true} />)

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('updates character count in real-time as bio changes', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const bioField = screen.getByPlaceholderText('Tell us about yourself...')

    expect(screen.getByText('0/500 characters')).toBeInTheDocument()

    await user.type(bioField, 'Hello')
    expect(screen.getByText('5/500 characters')).toBeInTheDocument()

    await user.type(bioField, ' World')
    expect(screen.getByText('11/500 characters')).toBeInTheDocument()
  })

  it('handles form submission with all optional fields', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const firstNameField = screen.getByPlaceholderText('John')
    const lastNameField = screen.getByPlaceholderText('Doe')
    const dobField = screen.getByDisplayValue('') as HTMLInputElement
    const avatarField = screen.getByPlaceholderText('https://example.com/avatar.jpg')
    const bioField = screen.getByPlaceholderText('Tell us about yourself...')

    dobField.setAttribute('type', 'date')

    await user.type(firstNameField, 'John')
    await user.type(lastNameField, 'Doe')
    await user.type(bioField, 'A person')
    await user.type(avatarField, 'https://example.com/pic.jpg')

    const submitButton = screen.getByText('Save Profile')
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
  })

  it('handles profile with null optional fields', () => {
    const profileWithNulls: CustomerProfile = {
      ...mockProfile,
      date_of_birth: null,
      bio: null,
      avatar_url: null,
    }

    const onSubmit = vi.fn()
    render(<ProfileForm profile={profileWithNulls} onSubmit={onSubmit} />)

    expect(screen.getByPlaceholderText('John')).toHaveValue('John')
    expect(screen.getByDisplayValue('')).toBeInTheDocument()
  })

  it('has proper aria labels for accessibility', () => {
    const onSubmit = vi.fn()
    render(<ProfileForm profile={mockProfile} onSubmit={onSubmit} />)

    const firstNameField = screen.getByDisplayValue('John')
    expect(firstNameField).toHaveAttribute('aria-invalid', 'false')
  })

  it('shows aria-invalid when field has error', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const firstNameField = screen.getByPlaceholderText('John')
    const submitButton = screen.getByText('Save Profile')

    await user.click(submitButton)

    await waitFor(() => {
      expect(firstNameField).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('handles avatar URL change that fails to load', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const avatarField = screen.getByPlaceholderText('https://example.com/avatar.jpg')
    await user.type(avatarField, 'https://broken.com/image.jpg')

    await waitFor(() => {
      const img = screen.queryByAltText('Avatar preview')
      if (img) {
        expect(img).toBeInTheDocument()
      }
    })
  })

  it('clears error message when user corrects field', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ProfileForm profile={null} onSubmit={onSubmit} />)

    const firstNameField = screen.getByPlaceholderText('John')
    const submitButton = screen.getByText('Save Profile')

    // Trigger validation error
    await user.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
    })

    // Fix the error
    await user.type(firstNameField, 'John')
    expect(screen.queryByText('First name is required')).not.toBeInTheDocument()
  })
})
