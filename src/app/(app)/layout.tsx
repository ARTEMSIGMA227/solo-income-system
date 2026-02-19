import BottomNav from '@/components/layout/BottomNav';
import PWAInstallBanner from '@/components/pwa/PWAInstallBanner';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ paddingBottom: '80px' }}>
        {children}
      </div>
      <PWAInstallBanner />
      <BottomNav />
    </div>
  );
}