import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'

import { api } from '../lib/api'

export interface ImageUploadResult {
  url: string
  publicId: string
  width: number
  height: number
  bytes: number
  thumbnailUrl: string
}

interface ImageUploadProps {
  onUploadSuccess: (result: ImageUploadResult) => void
  onUploadError?: (error: Error) => void
  multiple?: boolean
  accept?: string
}

export function ImageUpload({
  onUploadSuccess,
  onUploadError,
  multiple = false,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<ImageUploadResult>(
        '/v1/bakery/uploads/product-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )

      return response.data
    },
    onSuccess: (data) => {
      setPreview(data.thumbnailUrl)
      onUploadSuccess(data)
    },
    onError: (error) => {
      setPreview(null)
      onUploadError?.(error as Error)
    },
  })

  const handleFileSelect = (file: File) => {
    // Validate file
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      onUploadError?.(new Error('File must be smaller than 5MB'))
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      onUploadError?.(
        new Error('File must be JPEG, PNG, WebP, or GIF'),
      )
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    uploadMutation.mutate(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-amber-500 bg-amber-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          multiple={multiple}
          className="hidden"
        />

        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-amber-500" />
            <p className="mt-4 text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900">
              Drag and drop your image here
            </p>
            <p className="text-sm text-gray-500">or click to select a file</p>
            <p className="mt-2 text-xs text-gray-400">
              JPEG, PNG, WebP, or GIF up to 5MB
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">Preview</p>
          <img
            src={preview}
            alt="Preview"
            className="h-48 w-48 rounded-lg object-cover"
          />
          {uploadMutation.isSuccess && (
            <p className="text-sm text-green-600">✓ Image uploaded successfully</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {uploadMutation.isError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {uploadMutation.error instanceof Error
            ? uploadMutation.error.message
            : 'Failed to upload image'}
        </div>
      )}
    </div>
  )
}
