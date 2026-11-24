import type { MetadataRoute } from "next";
import { marketingUrl } from "../lib/site";

export const dynamic = "force-static";

const paths = [
  "/",
  "/product",
  "/product/job-discovery",
  "/product/resume-studio",
  "/product/application-tracker",
  "/product/ai-matching",
  "/for/students",
  "/for/graduates",
  "/for/internships",
  "/for/remote",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/security",
  "/accessibility",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: `${marketingUrl}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
