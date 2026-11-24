/**
 * Unit checks for area access and login redirect helpers.
 */
import {
  canEnterClientPortal,
  canUseBookingOnboarding,
  resolvePostLoginPath,
  resolveBookingAreaHubHref,
  resolveClientAreaHubHref,
} from "../src/lib/auth/area-access-policy.ts";
import {
  buildAuthCallbackUrl,
  resolveSafePostAuthPath,
  sanitizeLoginNext,
  sanitizeBookingLoginNext,
} from "../src/lib/auth/login-redirect.ts";
import {
  classifySignUpError,
  validateSignUpFields,
} from "../src/lib/auth/sign-up-validation.ts";

let passed = 0;
let failed = 0;

function pass(name) {
  passed += 1;
  console.log(`PASS  ${name}`);
}

function fail(name) {
  failed += 1;
  console.error(`FAIL  ${name}`);
}

const clientOnly = {
  userId: "u1",
  isStaff: false,
  hasClientPortal: true,
  hasBookingPortal: false,
};

const bookingOnly = {
  userId: "u2",
  isStaff: false,
  hasClientPortal: false,
  hasBookingPortal: true,
};

const both = {
  userId: "u3",
  isStaff: false,
  hasClientPortal: true,
  hasBookingPortal: true,
};

if (resolvePostLoginPath(clientOnly) === "/acesso") {
  pass("post-login — client only");
} else fail("post-login — client only");

if (resolvePostLoginPath(bookingOnly) === "/acesso") {
  pass("post-login — booking only");
} else fail("post-login — booking only");

if (resolvePostLoginPath(both) === "/acesso") {
  pass("post-login — both areas");
} else fail("post-login — both areas");

const portalOnlyNoCompany = {
  userId: "u5",
  isStaff: false,
  hasClientPortal: false,
  hasBookingPortal: false,
};

if (resolvePostLoginPath(portalOnlyNoCompany) === "/acesso") {
  pass("post-login — authenticated, no company yet");
} else fail("post-login — authenticated, no company yet");

if (resolvePostLoginPath({ ...clientOnly, isStaff: true }) === "/admin/dashboard") {
  pass("post-login — staff to admin");
} else fail("post-login — staff to admin");

if (canUseBookingOnboarding(clientOnly) === false) {
  pass("onboarding blocked for client-only");
} else fail("onboarding blocked for client-only");

if (canUseBookingOnboarding(bookingOnly) === false) {
  pass("onboarding blocked when already member");
} else fail("onboarding blocked when already member");

if (
  canUseBookingOnboarding({
    userId: "u4",
    isStaff: false,
    hasClientPortal: false,
    hasBookingPortal: false,
  }) === true
) {
  pass("onboarding allowed for net-new booking user");
} else fail("onboarding allowed for net-new booking user");

if (canEnterClientPortal(clientOnly)) pass("client portal — allowed");
else fail("client portal — allowed");

if (sanitizeLoginNext("/client/dashboard") === "/client/dashboard") {
  pass("sanitizeLoginNext — client");
} else fail("sanitizeLoginNext — client");

if (sanitizeBookingLoginNext("//evil") === "/booking/admin/dashboard") {
  pass("sanitizeBookingLoginNext — blocks unsafe");
} else fail("sanitizeBookingLoginNext — blocks unsafe");

if (
  sanitizeBookingLoginNext("/client/booking/appointments") ===
  "/client/booking/appointments"
) {
  pass("sanitizeBookingLoginNext — client booking path");
} else fail("sanitizeBookingLoginNext — client booking path");

if (
  sanitizeBookingLoginNext("/client/booking/schedules?x=1") ===
  "/client/booking/schedules?x=1"
) {
  pass("sanitizeBookingLoginNext — client booking preserves query");
} else fail("sanitizeBookingLoginNext — client booking preserves query");

if (sanitizeBookingLoginNext("https://evil.test") === "/booking/admin/dashboard") {
  pass("sanitizeBookingLoginNext — blocks absolute URL");
} else fail("sanitizeBookingLoginNext — blocks absolute URL");

if (resolveClientAreaHubHref(null, false).startsWith("/login?next=")) {
  pass("hub client href — anonymous to login");
} else fail("hub client href — anonymous to login");

if (resolveClientAreaHubHref(null, true) === "/client/dashboard") {
  pass("hub client href — session to dashboard");
} else fail("hub client href — session to dashboard");

if (
  resolveBookingAreaHubHref(null, false) ===
  "/login?next=%2Fbooking%2Fadmin%2Fdashboard"
) {
  pass("hub booking href — anonymous to login");
} else fail("hub booking href — anonymous to login");

if (resolveBookingAreaHubHref(bookingOnly, true) === "/booking/admin/dashboard") {
  pass("hub booking href — member to dashboard");
} else fail("hub booking href — member to dashboard");

if (
  resolveBookingAreaHubHref(clientOnly, true).startsWith("/login?next=")
) {
  pass("hub booking href — client-only via login gate");
} else fail("hub booking href — client-only via login gate");

if (resolveSafePostAuthPath(undefined) === "/acesso") {
  pass("resolveSafePostAuthPath — default area hub");
} else fail("resolveSafePostAuthPath — default area hub");

if (sanitizeLoginNext("/acesso") === "/acesso") {
  pass("sanitizeLoginNext — area hub");
} else fail("sanitizeLoginNext — area hub");

if (
  resolveSafePostAuthPath("/booking/admin/dashboard") ===
  "/booking/admin/dashboard"
) {
  pass("resolveSafePostAuthPath — booking next");
} else fail("resolveSafePostAuthPath — booking next");

if (resolveSafePostAuthPath("//evil") === "/acesso") {
  pass("resolveSafePostAuthPath — blocks unsafe");
} else fail("resolveSafePostAuthPath — blocks unsafe");

if (
  buildAuthCallbackUrl("http://localhost:3000", "/client/dashboard") ===
  "http://localhost:3000/auth/callback?next=%2Fclient%2Fdashboard"
) {
  pass("buildAuthCallbackUrl — with next");
} else fail("buildAuthCallbackUrl — with next");

if (
  buildAuthCallbackUrl("https://artecium.com", undefined) ===
  "https://artecium.com/auth/callback"
) {
  pass("buildAuthCallbackUrl — OAuth default callback");
} else fail("buildAuthCallbackUrl — OAuth default callback");

if (
  buildAuthCallbackUrl("http://localhost:3000", "//evil") ===
  "http://localhost:3000/auth/callback"
) {
  pass("buildAuthCallbackUrl — OAuth strips unsafe next");
} else fail("buildAuthCallbackUrl — OAuth strips unsafe next");

const invalidSignUp = validateSignUpFields({
  email: "",
  password: "short",
  confirmPassword: "other",
});
if (
  invalidSignUp?.email === "required" &&
  invalidSignUp?.password === "tooShort" &&
  invalidSignUp?.confirmPassword === "mismatch"
) {
  pass("validateSignUpFields — aggregates errors");
} else fail("validateSignUpFields — aggregates errors");

if (validateSignUpFields({
  email: "user@example.com",
  password: "longenough",
  confirmPassword: "longenough",
}) === null) {
  pass("validateSignUpFields — valid input");
} else fail("validateSignUpFields — valid input");

if (classifySignUpError("", "signup_disabled") === "signupDisabled") {
  pass("classifySignUpError — signup disabled");
} else fail("classifySignUpError — signup disabled");

if (classifySignUpError("User already registered", null) === "generic") {
  pass("classifySignUpError — existing user generic");
} else fail("classifySignUpError — existing user generic");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
