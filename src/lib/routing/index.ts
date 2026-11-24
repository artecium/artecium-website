export {
  DEFAULT_PORTAL_HOSTNAME,
  PRODUCTION_MAIN_SITE_HOSTNAME,
  PORTAL_STRIPE_CHECKOUT_RETURN_PUBLIC_PATHS,
  normalizePortalPathname,
  normalizeHostname,
  resolveRoutingHost,
  isPortalHostname,
  isLocalDevHostname,
  isProductionMainSiteHostname,
  servesClientRoutesOnHost,
  shouldUseExternalPortalNavigation,
  isPortalRootPublicPath,
  isPortalLoginPublicPath,
  isExcludedFromPortalRouting,
  isPortalStripeCheckoutReturnPublicPath,
  publicPortalPathToInternal,
  internalClientPathToPublic,
  isPortalProtectedPublicPath,
  isRecognizedPortalPublicAppPath,
  listPortalTopLevelSegments,
  portalSameHostRedirectPathname,
} from "./portal-host";

export {
  readRequestHostname,
  clientAreaHref,
  clientAreaLinkTarget,
  portalAbsoluteHref,
  clientAreaPathnameForNavMatch,
  postLoginRedirectUrl,
} from "./client-links";

export {
  resolveMainSiteLegacyClientPortalUrl,
  resolvePortalLegacyClientPathname,
} from "./legacy-client-redirect";

export {
  redirectBookingHostAwayFromPlatformAdmin,
  DEFAULT_BOOKING_HOSTNAME,
  BOOKING_ADMIN_PUBLIC_SEGMENTS,
  BOOKING_RESERVED_SLUGS,
  normalizeBookingPathname,
  isBookingHostname,
  isBookingLoginPublicPath,
  isBookingAdminPublicPath,
  isBookingProtectedAdminPath,
  isValidBusinessSlug,
  bookingPublicPathToInternal,
  bookingInternalAdminToPublic,
} from "./booking-host";

export {
  bookingAreaHref,
  bookingAdminPathnameForNavMatch,
  bookingInternalAdminToClientPortal,
  isClientPortalBookingPath,
  readBookingAreaHrefContext,
  resolveBookingAreaHref,
} from "./booking-links";
