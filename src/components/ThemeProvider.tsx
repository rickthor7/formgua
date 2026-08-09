import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const Provider = NextThemesProvider as unknown as React.FC<React.PropsWithChildren<Record<string, unknown>>>;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </Provider>
  );
}

