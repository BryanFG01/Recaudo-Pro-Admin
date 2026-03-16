"use client";
import { useAuthStore } from "@/features/auth/presentation/store/authStore";
import { Layout } from "@/shared/components/Layout";
import { LoadingScreen } from "@/shared/components/LoadingScreen/LoadingScreen";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 1. Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      console.log('AdminLayout: Store already hydrated');
      setHydrated(true);
      return;
    }

    // 2. Subscribe to hydration finish
    console.log('AdminLayout: Waiting for hydration...');
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      console.log('AdminLayout: Hydration finished via onFinishHydration');
      setHydrated(true);
    });

    // 3. Safety fallback: if after 5 seconds it's still not hydrated, force it.
    // This prevents being stuck on "Recuperando sesión" if zustand fails to signal completion.
    const timer = setTimeout(() => {
      if (!useAuthStore.persist.hasHydrated()) {
        console.warn('AdminLayout: Hydration timed out after 5s, forcing state');
        setHydrated(true);
      }
    }, 5000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      console.log('AdminLayout: User not found after hydration, redirecting to login');
      router.replace("/login");
    }
  }, [user, router, hydrated]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingScreen message="Recuperando sesión..." />
      </div>
    );
  }

  if (!user) return null;

  return <Layout>{children}</Layout>;
}
