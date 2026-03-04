'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="admin-layout min-h-screen bg-gray-50">
      {/* Sidebar - hidden when printing (e.g. Book Studio print/PDF) */}
      <div className="print:hidden">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-16 transition-all duration-200">
        {/* Header - hidden when printing */}
        <div className="print:hidden">
          <AdminHeader onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>

        {/* Page Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
