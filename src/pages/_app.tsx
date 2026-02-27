import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const isLogin = router.pathname === "/login";
    document.body.classList.toggle("login-page", isLogin);
    document.body.classList.toggle("app-page", !isLogin);
  }, [router.pathname]);

  return <Component {...pageProps} />;
}
