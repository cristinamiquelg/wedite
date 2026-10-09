import Link from "next/link";
import SparkleIcon from "@/components/site/SparkleIcon";
import styles from "./ribera.module.css";

// The one footer of a Ribera site: "Made with Wedite" on the left and the
// couple's hashtag on the right. Used by the home and by the RSVP page so the
// two can never drift apart.
export default function RiberaFooter({ madeWith, hashtag }: { madeWith: string; hashtag?: string }) {
  return (
    <footer id="footer" className={styles.footer}>
      <p>
        {madeWith}{" "}
        <Link href="/" className="group inline-flex items-center gap-1" style={{ color: "var(--r-coral)" }}>
          Wedite
          <SparkleIcon className="h-3 w-3 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-125" />
        </Link>
      </p>
      {hashtag ? <p className={styles.footerHashtag}>{hashtag}</p> : null}
    </footer>
  );
}
