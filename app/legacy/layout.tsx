import Link from "next/link";
import type { ReactNode } from "react";

export default function LegacyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="legacy-shell">
      <div className="legacy-banner">
        <h1>RS SEHAT SENTOSA — SISTEM INFORMASI KLINIK</h1>
        <div className="sub">
          Versi 2.1 (2009) &nbsp;|&nbsp; Terminal: KASIR-01 &nbsp;|&nbsp; Login: admin &nbsp;|&nbsp; Tidak ada API
          integrasi
        </div>
      </div>
      <div className="legacy-body">
        <nav className="legacy-side">
          <div className="legacy-note" style={{ margin: "0 4px 6px" }}>
            MENU UTAMA
          </div>
          <Link href="/legacy">Beranda</Link>
          <Link href="/legacy/register">Pendaftaran Pasien</Link>
          <Link href="/legacy/patients">Data Pasien &amp; Jadwal</Link>
          <Link href="/legacy/pharmacy">Farmasi / Stok Obat</Link>
          <div className="legacy-note" style={{ margin: "12px 4px 6px" }}>
            LAIN-LAIN
          </div>
          <Link href="/">Keluar ke Console</Link>
        </nav>
        <main className="legacy-content">{children}</main>
      </div>
    </div>
  );
}
