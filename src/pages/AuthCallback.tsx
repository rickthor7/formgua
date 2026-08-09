import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Halaman perantara OAuth.
 * Supabase akan redirect ke sini setelah proses Google OAuth.
 * - Jika sukses: session sudah otomatis di-set, kita lempar ke /dashboard.
 * - Jika gagal: ada parameter error di hash/query, kita lempar ke /auth/error.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    const error =
      hashParams.get("error") ||
      hashParams.get("error_code") ||
      queryParams.get("error") ||
      queryParams.get("error_code");
    const description =
      hashParams.get("error_description") ||
      queryParams.get("error_description") ||
      "";

    if (error) {
      const params = new URLSearchParams({
        code: error,
        description: description,
      });
      navigate(`/auth/error?${params.toString()}`, { replace: true });
      return;
    }

    // Beri waktu sebentar agar Supabase memproses session dari URL hash
    const t = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Memproses login…</p>
      </div>
    </div>
  );
}
