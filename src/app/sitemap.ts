import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const paths = [
    "/",
    "/villa-di-marco",
    "/la-stalla",
    "/the-estate",
    "/experiences",
    "/pantry",
    "/cellar-doors",
    "/events",
    "/the-farm",
    "/contact",
  ];

  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" || path === "/villa-di-marco" ? 1 : 0.7,
  }));
}
