import { Metadata } from 'next';
import { MarketGame } from '@/components/market';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Chợ Bến Thành | EZViet',
  description: 'Practice Vietnamese haggling at the famous Bến Thành Market',
};

export default function MarketPage() {
  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />
      <MarketGame />
    </main>
  );
}
