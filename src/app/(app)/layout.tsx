import BottomNav from '@/components/layout/BottomNav';

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
      <BottomNav />
    </div>
  );
}