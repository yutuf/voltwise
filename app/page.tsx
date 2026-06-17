import Link from "next/link";
import { VoltwiseApp } from "@/components/VoltwiseApp";

export default function Home() {
  return (
    <>
      <VoltwiseApp />
      <footer className="text-center text-[11px] text-[var(--muted)] py-6">
        <Link href="/admin" className="text-[var(--accent)] hover:underline">
          Pilot dashboard
        </Link>
        {" · "}Zetetic · Voltwise
      </footer>
    </>
  );
}
