import type { Metadata } from "next";
import { APP_NAME, FUNCTIONAL_LINE } from "@hireflow/shared";
import { marketingUrl } from "./site";

export function pageMeta(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${marketingUrl}${input.path === "/" ? "" : input.path}`;
  const title = input.title;
  return {
    title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · ${APP_NAME}`,
      description: input.description,
      url,
      siteName: APP_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${APP_NAME}`,
      description: input.description,
    },
  };
}

export const defaultDescription = FUNCTIONAL_LINE;
