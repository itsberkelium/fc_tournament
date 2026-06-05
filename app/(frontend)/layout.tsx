import { ReactNode } from "react";
import AuthGuard from "@/components/auth-guard";

export default function FrontendLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthGuard>{children}</AuthGuard>;
}
