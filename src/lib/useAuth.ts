import { useEffect, useState } from "react";
import { apiGet } from "./api";
import { setAuthToken } from "./authToken";

type Me = {
  id: string;
  name: string;
  nickname?: string;
  displayName?: string;
  notificationPrefs?: {
    enabled: boolean;
    types: { note: boolean; photo: boolean; checkin: boolean };
  };
  email: string;
  role: "admin" | "member";
};

export function useAuth() {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const me = await apiGet("/api/v1/me");
      if (me?.token) setAuthToken(me.token);
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
