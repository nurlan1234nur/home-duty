import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace("/dashboard");
    else router.replace("/login");
  }, [user, loading, router]);

  return <p style={{ padding: 16 }}>Loading…</p>;
}
