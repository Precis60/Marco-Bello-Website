import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
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
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" || path === "/villa-di-marco" ? 1 : 0.7,
  }));
}
