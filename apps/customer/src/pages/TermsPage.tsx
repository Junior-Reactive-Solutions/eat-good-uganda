import { PageHeader } from '../components/PageHeader'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      <PageHeader
        heading="Terms of Service"
        subheading="Please read these terms carefully"
      />

      <div className="prose prose-sm max-w-none text-platform-fg-muted space-y-6">
        {/* Last Updated */}
        <p className="text-sm text-platform-fg-muted">
          <strong>Last Updated:</strong> June 2026
        </p>

        {/* 1. Agreement to Terms */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">1. Agreement to Terms</h2>
          <p>
            By accessing and using Eat Good Uganda ("the Service"), you accept and agree to be
            bound by the terms and provision of this agreement. If you do not agree to abide by
            the above, please do not use this service.
          </p>
        </section>

        {/* 2. Use License */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">2. Use License</h2>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on Eat Good Uganda for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        {/* 3. Disclaimer */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">3. Disclaimer</h2>
          <p>
            The materials on Eat Good Uganda are provided "as is". Eat Good Uganda makes no
            warranties, expressed or implied, and hereby disclaims and negates all other warranties
            including, without limitation, implied warranties or conditions of merchantability,
            fitness for a particular purpose, or non-infringement of intellectual property or other
            violation of rights.
          </p>
        </section>

        {/* 4. Limitations */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">4. Limitations</h2>
          <p>
            In no event shall Eat Good Uganda or its suppliers be liable for any damages
            (including, without limitation, damages for loss of data or profit, or due to business
            interruption) arising out of the use or inability to use the materials on Eat Good
            Uganda, even if Eat Good Uganda or an authorized representative has been notified
            orally or in writing of the possibility of such damage.
          </p>
        </section>

        {/* 5. Accuracy of Materials */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">5. Accuracy of Materials</h2>
          <p>
            The materials appearing on Eat Good Uganda could include technical, typographical, or
            photographic errors. Eat Good Uganda does not warrant that any of the materials on its
            website are accurate, complete, or current. Eat Good Uganda may make changes to the
            materials contained on its website at any time without notice.
          </p>
        </section>

        {/* 6. Links */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">6. Links</h2>
          <p>
            Eat Good Uganda has not reviewed all of the sites linked to its website and is not
            responsible for the contents of any such linked site. The inclusion of any link does
            not imply endorsement by Eat Good Uganda of the site. Use of any such linked website
            is at the user's own risk.
          </p>
        </section>

        {/* 7. Modifications */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">7. Modifications</h2>
          <p>
            Eat Good Uganda may revise these terms of service for its website at any time without
            notice. By using this website, you are agreeing to be bound by the then current
            version of these terms of service.
          </p>
        </section>

        {/* 8. Governing Law */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws
            of Uganda, and you irrevocably submit to the exclusive jurisdiction of the courts
            located in Uganda.
          </p>
        </section>

        {/* 9. User Accounts */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">9. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current
            information. You are responsible for maintaining the confidentiality of your password
            and account. You agree to accept responsibility for all activities that occur under
            your account. You must notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        {/* 10. Payment Terms */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">10. Payment Terms</h2>
          <p>
            All orders placed through Eat Good Uganda must be paid in accordance with the payment
            method selected. We accept multiple payment methods including mobile money, bank
            transfer, and cash on delivery. By placing an order, you agree to pay all charges
            incurred, including applicable taxes and delivery fees.
          </p>
        </section>

        {/* 11. Refunds and Returns */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">11. Refunds and Returns</h2>
          <p>
            Due to the perishable nature of baked goods, we generally do not accept returns or
            refunds. However, if you receive a damaged or incorrect order, please contact us
            immediately. We will work with the bakery to resolve the issue.
          </p>
        </section>

        {/* 12. Contact */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-platform-fg">Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div className="rounded-lg bg-platform-surface p-4">
            <p className="text-sm">
              <strong>Email:</strong> support@eatgooduganda.com<br />
              <strong>Mailing Address:</strong> Kampala, Uganda
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
