import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-stone-200 py-12 last:border-0 sm:py-14">
      <h2 className="text-2xl font-bold text-fresh-green sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-stone-700">{children}</div>
    </section>
  );
}

export default function SitePages() {
  return (
    <div className="bg-surface-canvas font-sans text-stone-800">
      <section className="border-b border-stone-200 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-stone-500">
            <Link to="/" className="hover:text-fresh-green">
              Home
            </Link>
            <span className="mx-2 text-stone-400">/</span>
            <span className="text-fresh-green">Pages</span>
          </p>
          <h1 className="mt-2 text-3xl font-bold text-fresh-green sm:text-4xl">Guides &amp; company</h1>
          <p className="mt-3 max-w-2xl text-lg text-stone-600">
            Practical notes about how Eato works for households and restaurant partners—seasonal shopping, sourcing, and support.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[880px] px-4 pb-16 sm:px-6 lg:px-8">
        <Section id="about" title="About Eato">
          <p>
            Eato connects people who want honest, organic-forward food with curated groceries and restaurant partners who care about flavor and provenance. We started from a simple idea: the same standards you expect from a great night out should carry through to what is in your pantry.
          </p>
          <p>
            Whether you are building a weekly box, topping up staples from our shop categories, or browsing partner restaurants, the experience is meant to feel calm, seasonal, and transparent.
          </p>
        </Section>

        <Section id="restaurants" title="For restaurants">
          <p>
            Partner kitchens use Eato to reach customers who already value quality ingredients and clear menus. Onboarding covers essentials first; you can expand profiles, imagery, and cuisine tags as you grow.
          </p>
          <p>
            Ready to apply?{' '}
            <Link to="/signup?as=restaurant" className="font-semibold text-fresh-green underline hover:text-brand-greenHover">
              Sign up as a restaurant
            </Link>{' '}
            to submit your details for review.
          </p>
        </Section>

        <Section id="how-it-works" title="How shopping works">
          <p>
            Browse shop departments like nuts &amp; seeds, oils, fruits, dairy, bakery, and beverages. Each category highlights seasonal picks and staples so you can plan meals without hunting across dozens of tabs.
          </p>
          <p>
            Restaurant ordering stays in one flow per partner: explore the menu, add to cart, and check out when you are ready—ideal for busy weeknights or office orders.
          </p>
        </Section>

        <Section id="faq" title="Frequently asked questions">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-stone-900">Do you deliver everywhere?</h3>
              <p className="mt-1 text-stone-700">
                Delivery zones depend on partner coverage in your area. At checkout, available windows and fees are shown before you pay.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">How often does the shop change?</h3>
              <p className="mt-1 text-stone-700">
                Seasonal items rotate weekly or bi-weekly; core pantry products stay in stock as long as supply is steady. Subscribe to updates on the home page to hear about restocks.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Can I order from more than one restaurant?</h3>
              <p className="mt-1 text-stone-700">
                Carts are tied to one restaurant at a time so timing and packaging stay consistent. Start a new order when you want a different kitchen.
              </p>
            </div>
          </div>
        </Section>

        <Section id="privacy" title="Privacy policy (summary)">
          <p>
            We collect account and order information needed to run the service—contact details, delivery addresses, and payment metadata handled by our payment partners. We do not sell personal data to third-party marketers.
          </p>
          <p>
            You can request account exports or deletion by contacting{' '}
            <a href="mailto:hello@eato.com" className="font-semibold text-fresh-green underline">
              hello@eato.com
            </a>
            . A full legal policy will be published before public launch; this page is a plain-language placeholder for the prototype.
          </p>
        </Section>

        <div className="pt-8 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center justify-center rounded-lg bg-fresh-green px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-greenHover"
          >
            Read the Eato blog
          </Link>
        </div>
      </div>
    </div>
  );
}
