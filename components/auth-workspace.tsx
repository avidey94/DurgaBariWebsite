import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { Language } from "@/lib/i18n";

import "@/styles/auth-workspace.css";

export function AuthWorkspace({
  children,
  language = "en",
}: {
  children: ReactNode;
  language?: Language;
}) {
  const isBn = language === "bn";
  const homeHref = isBn ? "/?lang=bn" : "/";

  return (
    <div className="auth-workspace">
      <aside className="auth-story" aria-label={isBn ? "দুর্গা বাড়ি" : "Durga Bari community"}>
        <Image
          src="/home/maa-durga.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 100vw, 46vw"
          className="auth-story-image"
        />
        <div className="auth-story-shade" />
        <Link
          href={homeHref}
          className="auth-brand"
          aria-label={isBn ? "দুর্গা বাড়ি হোম" : "Durga Bari home"}
        >
          <Image src="/brand/durga-bari-logo.png" alt="" width={49} height={49} />
          <span>
            Durga Bari
            <small>
              {isBn ? "বিশ্বাস · সংস্কৃতি · সম্প্রদায়" : "Faith · Culture · Community"}
            </small>
          </span>
        </Link>
        <div className="auth-story-copy">
          <span className="auth-story-eyebrow">
            {isBn ? "আমাদের সবার দুর্গা বাড়ি" : "Rooted in faith. Connected by community."}
          </span>
          <h2>
            {isBn ? (
              <>
                একটি পরিবার।
                <br />
                একসাথে পথ চলা।
              </>
            ) : (
              <>
                A place to belong.
                <br />A future to build.
              </>
            )}
          </h2>
          <p>
            {isBn
              ? "পূজা, উৎসব এবং সেবার মাধ্যমে আমাদের পরিবারের সঙ্গে যুক্ত থাকুন।"
              : "Stay close to the celebrations, shared traditions and acts of service that bring our families together."}
          </p>
        </div>
        <div className="auth-story-footer">
          <span>{isBn ? "সান ফ্রান্সিসকো বে এরিয়া" : "San Francisco Bay Area"}</span>
          <span aria-hidden="true">✦</span>
          <span>{isBn ? "আমাদের সবার পবিত্র স্থান" : "A sacred space for all"}</span>
        </div>
      </aside>

      <div className="auth-content">
        <nav className="auth-topbar" aria-label={isBn ? "সহায়ক লিংক" : "Helpful links"}>
          <Link href={homeHref} className="auth-back-link">
            <span aria-hidden="true">←</span>
            {isBn ? "ওয়েবসাইটে ফিরুন" : "Back to website"}
          </Link>
          <Link href={isBn ? "/contact?lang=bn" : "/contact"}>
            {isBn ? "সাহায্য প্রয়োজন?" : "Need a hand?"}
          </Link>
        </nav>
        <div className="auth-form-stage">{children}</div>
        <footer className="auth-content-footer">
          <span>Durga Bari</span>
          <span>
            {isBn ? "আপনার পরিবারের নিজস্ব স্থান" : "Your community, always within reach."}
          </span>
        </footer>
      </div>
    </div>
  );
}
