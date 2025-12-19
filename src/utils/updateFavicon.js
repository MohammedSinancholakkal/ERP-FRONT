import { serverURL } from "../services/serverURL";

export const updateFavicon = (faviconPath) => {
  const link =
    document.querySelector("link#app-favicon") ||
    document.createElement("link");

  link.id = "app-favicon";
  link.rel = "icon";

  if (faviconPath) {
    const baseUrl = serverURL.replace("/api", "");

    // 🚨 cache-busting is VERY important
    link.href = `${baseUrl}/${faviconPath}?v=${Date.now()}`;
  }

  document.head.appendChild(link);
};
