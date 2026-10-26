import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const metadata: Metadata = { title: "Admin Console", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/* Clerk is only used by admins in Phase 1 (spec §7 Access) */
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/admin/sign-in" signUpUrl="/admin/sign-up" afterSignOutUrl="/admin/sign-in" appearance={{ baseTheme: dark, variables: { colorPrimary: "#bdf86c", colorText: "#f5f5f5", colorBackground: "#121212" } }}>
      {children}
    </ClerkProvider>
  );
}
