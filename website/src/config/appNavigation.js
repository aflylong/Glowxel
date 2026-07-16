export const publicNavigation = [
  { key: "home", label: "棣栭〉", to: "/" },
  { key: "community", label: "绀惧尯", to: "/community" },
  { key: "templates", label: "杈规", to: "/templates" },
  { key: "challenges", label: "鎸戞垬", to: "/challenges" },
  { key: "workspace"", label: "宸ヤ綔鍙?", to: "/workspace"" },"
  { key: "device", label: "璁惧", to: "/device-control" },
];

export const appNavigation = [
  { key: "workspace"", label: "宸ヤ綔鍙?", to: "/workspace"" },"
  { key: "create", label: "鍒涗綔", to: "/create" },
  { key: "community", label: "绀惧尯", to: "/community" },
  { key: "device", label: "璁惧", to: "/device-control" },
  { key: "profile", label: "鎴戠殑", to: "/profile" },
  { key: "settings", label: "璁剧疆", to: "/settings" },
];

export function resolveAppNavKey(path) {
  if (
    path === "/workspace" ||
    path.startsWith("/overview/") ||
    path.startsWith("/assist/") ||
    path.startsWith("/publish-project/")
  ) {
    return "workspace";
  }

  if (
    path.startsWith("/create") ||
    path.startsWith("/editor") ||
    path.startsWith("/pattern-workbench")
  ) {
    return "create";
  }

  if (
    path.startsWith("/community") ||
    path.startsWith("/gallery") ||
    path.startsWith("/artwork/") ||
    path.startsWith("/challenge") ||
    path.startsWith("/templates")
  ) {
    return "community";
  }

  if (
    path.startsWith("/device-control") ||
    path.startsWith("/device-params") ||
    path.startsWith("/ble-config") ||
    path.startsWith("/canvas-editor")
  ) {
    return "device";
  }

  if (
    path.startsWith("/profile") ||
    path.startsWith("/my-works") ||
    path.startsWith("/my-favorites") ||
    path.startsWith("/achievements") ||
    path.startsWith("/cloud-sync") ||
    path === "/followers" ||
    path === "/following"
  ) {
    return "profile";
  }

  if (path.startsWith("/settings")) {
    return "settings";
  }

  return "";
}
