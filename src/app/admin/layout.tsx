"use client";
import { useAdminSession } from "@/features/auth/presentation/hooks/useAdminSession";
import { Layout } from "@/shared/components/Layout";
import { LoadingScreen } from "@/shared/components/LoadingScreen/LoadingScreen";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useAdminSession();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingScreen message="Recuperando sesión..." />
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}
