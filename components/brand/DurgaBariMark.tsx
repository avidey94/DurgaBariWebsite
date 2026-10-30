import Image from "next/image";

import styles from "./DurgaBariMark.module.css";

export function DurgaBariMark() {
  return (
    <span className={styles.mark} aria-hidden="true">
      <Image
        src="/brand/durga-bari-logo.png"
        alt=""
        width={300}
        height={283}
        className={styles.image}
        sizes="66px"
        priority
      />
    </span>
  );
}
