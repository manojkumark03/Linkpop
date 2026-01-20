/**
 * Utility functions for consistently displaying shortlink URLs across the application
 * These functions ensure that URLs respect user's custom domain settings
 */

export function getDisplayUrl(
  shortCode: string,
  options: {
    username: string
    customDomain: string | null
    useDomainForShortlinks: boolean
    domainVerified: boolean
    appDomain?: string
  },
): string {
  const appDomain = options.appDomain || "linkpop.space"

  if (options.customDomain && options.useDomainForShortlinks && options.domainVerified) {
    return `https://${options.customDomain}/${shortCode}`
  }

  return `https://${options.username}.${appDomain}/${shortCode}`
}

export function getProfileUrl(options: {
  username: string
  customDomain: string | null
  domainVerified: boolean
  rootDomainMode?: "bio" | "redirect"
  appDomain?: string
}): string {
  const appDomain = options.appDomain || "linkpop.space"

  if (options.customDomain && options.domainVerified) {
    // If root domain is in redirect mode, bio page is at /bio
    if (options.rootDomainMode === "redirect") {
      return `https://${options.customDomain}/bio`
    }
    return `https://${options.customDomain}`
  }

  return `https://${options.username}.${appDomain}`
}

export function getShortlinkDisplayText(
  shortCode: string,
  options: {
    username: string
    customDomain: string | null
    useDomainForShortlinks: boolean
    domainVerified: boolean
  },
): string {
  if (options.customDomain && options.useDomainForShortlinks && options.domainVerified) {
    return `${options.customDomain}/${shortCode}`
  }

  return `${options.username}.linkpop.space/${shortCode}`
}
