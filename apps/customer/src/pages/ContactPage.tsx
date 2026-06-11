import { useState } from 'react'

import { PageHeader } from '../components/PageHeader'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send the message to a backend service
    console.log('Contact form submitted:', formData)
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      <PageHeader
        heading="Contact Us"
        subheading="We'd love to hear from you"
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact Information */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-platform-fg mb-4">Get in Touch</h2>
            <p className="text-platform-fg-muted mb-6">
              Whether you have a question about orders, need technical support, or just want to
              provide feedback, we're here to help.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="rounded-lg border border-platform-border bg-platform-surface p-4">
              <h3 className="font-semibold text-platform-fg mb-2">Email</h3>
              <a
                href="mailto:support@eatgooduganda.com"
                className="text-amber-500 hover:underline text-sm"
              >
                support@eatgooduganda.com
              </a>
              <p className="text-xs text-platform-fg-muted mt-1">
                We respond within 24 hours
              </p>
            </div>

            <div className="rounded-lg border border-platform-border bg-platform-surface p-4">
              <h3 className="font-semibold text-platform-fg mb-2">Phone</h3>
              <a
                href="tel:+256753000000"
                className="text-amber-500 hover:underline text-sm"
              >
                +256 753 000 000
              </a>
              <p className="text-xs text-platform-fg-muted mt-1">
                Mon-Fri, 8am-6pm EAT
              </p>
            </div>

            <div className="rounded-lg border border-platform-border bg-platform-surface p-4">
              <h3 className="font-semibold text-platform-fg mb-2">Location</h3>
              <p className="text-sm text-platform-fg-muted">
                Kampala, Uganda
              </p>
            </div>
          </div>

          {/* FAQ Links */}
          <div className="rounded-lg border border-dashed border-platform-border bg-platform-surface/50 p-4">
            <h3 className="font-semibold text-platform-fg mb-3">Common Questions</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-amber-500 hover:underline">
                  How do I track my order?
                </a>
              </li>
              <li>
                <a href="#" className="text-amber-500 hover:underline">
                  What payment methods do you accept?
                </a>
              </li>
              <li>
                <a href="#" className="text-amber-500 hover:underline">
                  What are your delivery fees?
                </a>
              </li>
              <li>
                <a href="#" className="text-amber-500 hover:underline">
                  How do I cancel my order?
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-lg border border-platform-border bg-platform-surface p-6">
          <h2 className="text-lg font-semibold text-platform-fg mb-4">Send us a Message</h2>

          {submitted && (
            <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
              ✓ Thank you for your message! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-platform-fg mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-platform-fg mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-platform-fg mb-2">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select a subject</option>
                <option value="order">Order Issue</option>
                <option value="delivery">Delivery Problem</option>
                <option value="product">Product Quality</option>
                <option value="payment">Payment Issue</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-platform-fg mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="Tell us more..."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-white font-medium hover:bg-amber-600 transition-colors"
            >
              Send Message
            </button>
          </form>

          <p className="mt-4 text-xs text-platform-fg-muted text-center">
            We respect your privacy. Your message is secure and will only be used to assist you.
          </p>
        </div>
      </div>
    </div>
  )
}
