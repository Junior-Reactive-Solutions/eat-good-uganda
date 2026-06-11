import { PageHeader } from '../components/PageHeader'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      <PageHeader
        heading="Privacy Policy"
        subheading="How we protect your data"
      />

      <div className="prose prose-sm max-w-none text-platform-fg-muted space-y-6">
        {/* Last Updated */}
        <p className="text-sm text-platform-fg-muted">
          <strong>Last Updated:</strong> June 2026
        </p>

        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Introduction</h2>
          <p>
            Eat Good Uganda ("Company", "we", "our", or "us") operates the Eat Good Uganda mobile
            application and website (the "Service"). This page informs you of our policies
            regarding the collection, use, and disclosure of personal data when you use our Service
            and the choices you have associated with that data.
          </p>
        </section>

        {/* Information Collection */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Information We Collect</h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-platform-fg">Account Information</h3>
              <p>
                When you create an account, we collect your name, email address, phone number,
                and password. This information is used to identify you and send you order updates.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-platform-fg">Address Information</h3>
              <p>
                We collect delivery addresses to fulfill your orders. This information is only
                shared with the bakery preparing your order and the delivery partner.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-platform-fg">Payment Information</h3>
              <p>
                Payment details are processed through secure payment providers. We do not store
                full credit card or mobile money account information on our servers.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-platform-fg">Usage Data</h3>
              <p>
                We collect information about how you interact with our Service, including IP
                addresses, browser type, pages visited, and the time and date of your activities.
              </p>
            </div>
          </div>
        </section>

        {/* Data Usage */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">How We Use Your Information</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service</li>
            <li>To provide customer support and respond to your inquiries</li>
            <li>To gather analysis or valuable information to improve our Service</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent and address technical and security issues</li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Data Security</h2>
          <p>
            The security of your data is important to us, but remember that no method of
            transmission over the Internet or method of electronic storage is 100% secure. While
            we strive to use commercially acceptable means to protect your personal data, we
            cannot guarantee its absolute security.
          </p>
          <p>
            We use encryption, secure connections (HTTPS), and other industry-standard security
            measures to protect your information.
          </p>
        </section>

        {/* Data Retention */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our Service
            and fulfill the purposes for which it was collected. You may request deletion of your
            data at any time by contacting us.
          </p>
        </section>

        {/* Your Rights */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
        </section>

        {/* Third-Party Services */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Third-Party Services</h2>
          <p>
            Our Service may contain links to third-party websites and services that are not
            operated by us. This Privacy Policy does not apply to third-party websites, and we are
            not responsible for their privacy practices. We encourage you to review their privacy
            policies before providing your information.
          </p>
        </section>

        {/* Contact Us */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <div className="rounded-lg bg-platform-surface p-4">
            <p className="text-sm">
              <strong>Email:</strong> privacy@eatgooduganda.com<br />
              <strong>Mailing Address:</strong> Kampala, Uganda
            </p>
          </div>
        </section>

        {/* Changes */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the "Last Updated" date
            above.
          </p>
        </section>
      </div>
    </div>
  )
}
