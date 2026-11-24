import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";

export const metadata: Metadata = { title: "For fresh graduates" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Fresh graduates"
        title="A first search that stays organized."
        body="India and international roles in one workspace. Explained matches instead of silence after you apply on someone else's ATS."
      />
      <Prose>
        <p>The free tracker is unlimited. Two resume versions cover a core role and an internship-to-full-time pivot.</p>
      </Prose>
    </>
  );
}
