import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  COOKIE_NAME,
  isGateEnabled,
  isUnprotectedInProd,
  tokenIsValid,
} from "@/lib/auth";
import Profiler from "@/components/Profiler";
import PasswordGate from "@/components/PasswordGate";
import SetupNotice from "@/components/SetupNotice";

export default async function Home() {
  // Always render per request: the auth check must run on every visit (not be
  // baked in at build time from whatever env vars the build saw), and the CSP
  // nonce set in proxy.ts only works on dynamically rendered pages.
  await connection();

  // Fail closed: a production deploy with no password gate is a misconfiguration
  // (it would expose the owner's billable API key publicly). Show setup steps
  // instead of the open app. Local dev is intentionally left open.
  if (isUnprotectedInProd()) {
    return <SetupNotice />;
  }

  // If a password is configured, require it before showing the app.
  if (isGateEnabled()) {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!tokenIsValid(token)) {
      return <PasswordGate />;
    }
  }
  return <Profiler gateEnabled={isGateEnabled()} />;
}
