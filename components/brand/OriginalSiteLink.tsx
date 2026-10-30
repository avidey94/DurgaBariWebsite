"use client";

import { usePathname } from "next/navigation";
import { getOriginalSiteHref } from "@/lib/original-site";
import styles from "./OriginalSiteLink.module.css";

export function OriginalSiteLink({ appearance = "dark" }: { appearance?: "dark" | "light" }) {
  const pathname = usePathname();

  return (
    <a
      href={getOriginalSiteHref(pathname)}
      className={`${styles.link} ${styles[appearance]}`}
      title="View the original site. Use your browser’s Back button to return."
    >
      Original site
    </a>
  );
}
