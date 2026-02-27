import { useEffect, useState } from "react";
import { apiGet } from "./api";

type Me = { id: string; name: string; email: string; role: "admin" | "member" };

export function useAuth() {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const me = await apiGet("/api/v1/me");
      setUser(me.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { user, loading, refresh };
}
