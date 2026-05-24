import { cookies } from "next/headers";
import { COOKIE_NAME, isGateEnabled, tokenIsValid } from "@/lib/auth";
import Profiler from "@/components/Profiler";
import PasswordGate from "@/components/PasswordGate";

export default async function Home() {
  // If a password is configured, require it before showing the app.
  if (isGateEnabled()) {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!tokenIsValid(token)) {
      return <PasswordGate />;
    }
  }
  return <Profiler />;
}
