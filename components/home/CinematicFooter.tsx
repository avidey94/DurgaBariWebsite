import Link from "next/link";
import { Arrow, Trishul } from "./CinematicIcons";
import styles from "./HomePageCinematic.module.css";

export function CinematicFooter({
  backTo = "#home-content",
}: {
  backTo?: string;
}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <Link href="/" className={styles.footerWordmark}>
          <Trishul />
          <span>
            Durga Bari<small>Center for Spiritual & Cultural Excellence</small>
          </span>
        </Link>
        <p lang="bn">সবার সাথে, মায়ের বাড়ি।</p>
        <a href="mailto:info@thedurgacenter.org">
          Say hello <Arrow diagonal />
        </a>
      </div>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} Durga Bari · San Jose, California</span>
        <nav aria-label="Footer navigation">
          <Link href="/about">Our story</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Member login</Link>
          <button type="button" disabled lang="bn" className={styles.languageUnavailable} title="Bengali translation is coming later">
            বাংলা
          </button>
        </nav>
        <a href={backTo}>Back to the beginning ↑</a>
      </div>
    </footer>
  );
}
