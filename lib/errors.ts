// An error whose message is intentionally written for end users. API routes
// return ONLY these messages to the client; any other error (SDK internals,
// network failures, bugs) is logged server-side and replaced with a generic
// message, so stack details or provider internals never leak to the browser.
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}
