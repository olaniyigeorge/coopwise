import type { NotificationDetail } from "@/stores/notification-store";

type NotificationLike = Pick<
  NotificationDetail,
  "id" | "title" | "message" | "event_type" | "entity_url"
>;

export interface NotificationLink {
  href: string;
  label: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PREFIX_RE =
  /^(tx_ref|txn|transaction|contribution|payout|group|cooperative|membership|kyc|ai_insight)[-:](.+)$/i;

function textOf(notification: NotificationLike) {
  return `${notification.title ?? ""} ${notification.message ?? ""}`.toLowerCase();
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

/**
 * `entity_url` is a free-form string left over from several producers: some
 * store a route (`/dashboard/...`), some a bare UUID, some a tagged reference
 * (`tx_ref-<uuid>`). Only a real path is trustworthy on its own; everything
 * else is interpreted by event type + copy.
 */
function safePath(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  if (value.startsWith("/")) {
    // A legacy route used by older producers.
    if (value.startsWith("/circle/")) {
      return `/dashboard/cooperative/${value.slice("/circle/".length)}`;
    }
    return value;
  }

  if (/^https?:\/\//i.test(value)) return value;

  return null;
}

function entityRef(raw: string | null | undefined) {
  const value = raw?.trim();
  if (!value) return { id: null, prefix: null };

  if (UUID_RE.test(value)) return { id: value, prefix: null };

  const match = value.match(PREFIX_RE);
  if (match && UUID_RE.test(match[2])) {
    return { id: match[2], prefix: match[1].toLowerCase() };
  }

  return { id: null, prefix: null };
}

function contributionHref(id: string | null, text: string) {
  if (id) return `/dashboard/contributions/${id}`;
  if (
    hasAny(text, [
      "due",
      "record",
      "make a contribution",
      "make your contribution",
      "owe",
      "upcoming payment",
      "reminder",
    ])
  ) {
    return "/dashboard/contributions/make";
  }
  return "/dashboard/contributions";
}

function groupHref(id: string | null, text: string) {
  // A join request is addressed to the group owner and refers to a
  // membership id, not a group id — send them to their groups instead of
  // guessing a cooperative id that would 404.
  if (
    hasAny(text, [
      "applied to join",
      "join request",
      "application",
      "waiting for a decision",
    ])
  ) {
    return "/dashboard/my-group";
  }
  return id ? `/dashboard/cooperative/${id}` : "/dashboard/my-group";
}

export function getNotificationLink(
  notification: NotificationLike
): NotificationLink {
  const text = textOf(notification);
  const path = safePath(notification.entity_url);
  if (path) {
    return { href: path, label: labelFor(path) };
  }

  const { id, prefix } = entityRef(notification.entity_url);

  // Some older rows put the destination in the copy instead of entity_url.
  // Use an embedded app path or absolute URL when there is one.
  if (!notification.entity_url) {
    const embedded = `${notification.title ?? ""} ${notification.message ?? ""}`.match(
      /(?:https?:\/\/[^\s]+|\/dashboard\/[a-z0-9\-_/]+)/i
    );
    if (embedded) {
      const candidate = safePath(embedded[0].replace(/[),.;]+$/, ""));
      if (candidate) return { href: candidate, label: labelFor(candidate) };
    }
  }

  if (prefix) {
    switch (prefix) {
      case "tx_ref":
      case "txn":
      case "transaction":
        return { href: "/dashboard/wallet/fund", label: "Open wallet" };
      case "contribution": {
        const href = contributionHref(id, text);
        return { href, label: labelFor(href) };
      }
      case "payout":
        return { href: "/dashboard/payouts", label: "View payouts" };
      case "group":
      case "cooperative": {
        const href = groupHref(id, text);
        return { href, label: labelFor(href) };
      }
      case "membership":
        return { href: "/dashboard/my-group", label: "View groups" };
      case "kyc":
        return { href: "/dashboard/kyc", label: "Open KYC" };
      case "ai_insight":
        return {
          href: id ? `/dashboard/ai-insights/${id}` : "/dashboard/ai-insights",
          label: "View insight",
        };
    }
  }

  switch (notification.event_type) {
    case "contribution": {
      const href = contributionHref(id, text);
      return { href, label: labelFor(href) };
    }
    case "payout":
      return { href: "/dashboard/payouts", label: "View payouts" };
    case "transaction":
      return { href: "/dashboard/wallet/fund", label: "Open wallet" };
    case "group":
    case "membership": {
      const href = groupHref(id, text);
      return { href, label: labelFor(href) };
    }
    case "ai_insight":
      return {
        href: id ? `/dashboard/ai-insights/${id}` : "/dashboard/ai-insights",
        label: "View insight",
      };
    case "system":
    case "general_alert":
    case "other":
    default:
      break;
  }

  // Content-based fallback: older rows often only carry a title/message.
  if (hasAny(text, ["kyc", "identity", "verification", "verify your"])) {
    return { href: "/dashboard/kyc", label: "Open KYC" };
  }
  if (
    hasAny(text, [
      "password",
      "security",
      "sign-in",
      "sign in",
      "login",
      "email address",
      "phone number",
      "profile",
      "account settings",
    ])
  ) {
    return { href: "/dashboard/account", label: "Account settings" };
  }
  if (hasAny(text, ["contribution", "dues", "savings due"])) {
    const href = contributionHref(id, text);
    return { href, label: labelFor(href) };
  }
  if (hasAny(text, ["payout", "payouts"])) {
    return { href: "/dashboard/payouts", label: "View payouts" };
  }
  if (hasAny(text, ["wallet", "deposit", "fund", "top up", "top-up", "payment"])) {
    return { href: "/dashboard/wallet/fund", label: "Open wallet" };
  }
  if (hasAny(text, ["cooperative", "group", "member", "membership"])) {
    return { href: "/dashboard/my-group", label: "View groups" };
  }
  if (hasAny(text, ["welcome", "sign up", "signup", "get started", "get saving"])) {
    return { href: "/dashboard", label: "Go to dashboard" };
  }

  // System/general notices have no entity of their own; the dashboard is a
  // more useful landing spot than a self-link back to this list.
  if (
    notification.event_type === "system" ||
    notification.event_type === "general_alert"
  ) {
    return { href: "/dashboard", label: "Go to dashboard" };
  }

  return {
    href: `/dashboard/notifications#${notification.id}`,
    label: "View details",
  };
}

export function getNotificationHref(notification: NotificationLike) {
  return getNotificationLink(notification).href;
}

function labelFor(href: string) {
  if (href.startsWith("/dashboard/contributions/make")) {
    return "Record contribution";
  }
  if (href.startsWith("/dashboard/contributions/")) return "View contribution";
  if (href === "/dashboard/contributions") return "View contributions";
  if (href.startsWith("/dashboard/payouts")) return "View payouts";
  if (href.startsWith("/dashboard/wallet")) return "Open wallet";
  if (href.startsWith("/dashboard/cooperative/")) return "View cooperative";
  if (href.startsWith("/dashboard/my-group")) return "View groups";
  if (href.startsWith("/dashboard/admin/kyc")) return "Review KYC";
  if (href.startsWith("/dashboard/kyc")) return "Open KYC";
  if (href.startsWith("/dashboard/ai-insights")) return "View insight";
  if (href.startsWith("/dashboard/account")) return "Account settings";
  if (href.startsWith("/dashboard/profile")) return "Your profile";
  if (href.startsWith("/dashboard/users/")) return "View member";
  if (href.startsWith("/dashboard/notifications")) return "View details";
  if (href === "/dashboard" || href === "/dashboard/") return "Go to dashboard";
  if (/\/projects?\//i.test(href)) return "View project";
  if (/\/(builders?|talent)\//i.test(href)) return "View profile";
  return "Open link";
}
