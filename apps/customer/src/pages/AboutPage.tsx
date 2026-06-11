import { PageHeader } from '../components/PageHeader'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      <PageHeader
        heading="About Eat Good Uganda"
        subheading="Connecting customers with quality bakeries"
      />

      {/* Mission Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-platform-fg">Our Mission</h2>
        <p className="text-platform-fg-muted leading-relaxed">
          Eat Good Uganda is a digital bakery marketplace that empowers local bakers to reach
          customers directly. We believe in supporting Uganda's vibrant baking community by
          providing a modern platform where quality bakeries can showcase their products and
          customers can discover fresh, delicious baked goods delivered to their doorstep.
        </p>
      </section>

      {/* Values Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-platform-fg">Our Values</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-platform-border bg-platform-surface p-4">
            <h3 className="font-semibold text-platform-fg mb-2">Quality First</h3>
            <p className="text-sm text-platform-fg-muted">
              We only partner with bakeries that meet our high standards for ingredient quality,
              hygiene, and taste.
            </p>
          </div>

          <div className="rounded-lg border border-platform-border bg-platform-surface p-4">
            <h3 className="font-semibold text-platform-fg mb-2">Community Support</h3>
            <p className="text-sm text-platform-fg-muted">
              We're committed to supporting local bakers and helping small businesses grow in the
              digital economy.
            </p>
          </div>

          <div className="rounded-lg border border-platform-border bg-platform-surface p-4">
            <h3 className="font-semibold text-platform-fg mb-2">Reliability</h3>
            <p className="text-sm text-platform-fg-muted">
              On-time deliveries, fresh products, and responsive customer support are fundamental
              to everything we do.
            </p>
          </div>

          <div className="rounded-lg border border-platform-border bg-platform-surface p-4">
            <h3 className="font-semibold text-platform-fg mb-2">Innovation</h3>
            <p className="text-sm text-platform-fg-muted">
              We use technology to solve real problems: easier ordering, better tracking, and
              seamless payments.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-platform-fg">How It Works</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-platform-fg">Browse Bakeries</h3>
              <p className="text-sm text-platform-fg-muted">
                Explore our curated selection of local bakeries and their products.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-platform-fg">Place Your Order</h3>
              <p className="text-sm text-platform-fg-muted">
                Select your favorite items and choose your preferred delivery option.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-platform-fg">Choose Your Payment</h3>
              <p className="text-sm text-platform-fg-muted">
                Pay securely with MoMo, Airtel Money, bank transfer, or cash on delivery.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="font-semibold text-platform-fg">Track & Receive</h3>
              <p className="text-sm text-platform-fg-muted">
                Track your order in real-time and receive fresh baked goods.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-platform-fg">Why Choose Eat Good Uganda</h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-3 text-platform-fg-muted">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Fresh baked goods delivered same-day or next-day</span>
          </li>
          <li className="flex items-start gap-3 text-platform-fg-muted">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Wide variety from multiple local bakeries</span>
          </li>
          <li className="flex items-start gap-3 text-platform-fg-muted">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Multiple payment options for your convenience</span>
          </li>
          <li className="flex items-start gap-3 text-platform-fg-muted">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Real-time order tracking</span>
          </li>
          <li className="flex items-start gap-3 text-platform-fg-muted">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Competitive pricing and regular promotions</span>
          </li>
          <li className="flex items-start gap-3 text-platform-fg-muted">
            <span className="text-amber-500 font-bold">✓</span>
            <span>Professional customer support</span>
          </li>
        </ul>
      </section>

      {/* Contact Section */}
      <section className="rounded-lg border border-platform-border bg-platform-surface p-6">
        <h2 className="text-2xl font-bold text-platform-fg mb-4">Get in Touch</h2>
        <p className="text-platform-fg-muted mb-4">
          Have questions? We'd love to hear from you. Reach out to our team at any time.
        </p>
        <div className="space-y-2 text-sm">
          <p className="text-platform-fg-muted">
            <strong>Email:</strong>{' '}
            <a href="mailto:support@eatgooduganda.com" className="text-amber-500 hover:underline">
              support@eatgooduganda.com
            </a>
          </p>
          <p className="text-platform-fg-muted">
            <strong>Phone:</strong>{' '}
            <a href="tel:+256753000000" className="text-amber-500 hover:underline">
              +256 753 000 000
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
