import { MarketingNav } from '../components/landing/MarketingNav';
import { MarketingFooter } from '../components/landing/MarketingFooter';
import { PricingSection } from '@/components/pricing-section';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-linen)] text-void">
      <MarketingNav tone="light" />
      <div className="pt-16">
        <PricingSection />
      </div>
      <MarketingFooter />
    </div>
  );
}
