import Link from "next/link";
import { getData, todayIso } from "@/lib/legacy/store";

export const dynamic = "force-dynamic";

export default function LegacyHome() {
  const data = getData();
  const today = todayIso();
  const todayAppointments = data.appointments.filter((a) => a.date === today && a.status === "Terjadwal");
  const lowStock = data.medicines.filter((m) => m.stock <= 5);

  return (
    <div>
      <div className="legacy-panel">
        <h2>BERANDA — RINGKASAN HARI INI</h2>
        <div className="body">
          <p style={{ marginTop: 0 }}>
            Selamat datang, <b>admin</b>. Hari ini: {today}
          </p>
          <table className="legacy-table" style={{ width: "auto" }}>
            <tbody>
              <tr>
                <th>Total Pasien</th>
                <td>{data.patients.length}</td>
              </tr>
              <tr>
                <th>Jadwal Hari Ini</th>
                <td>{todayAppointments.length}</td>
              </tr>
              <tr>
                <th>Total Jadwal</th>
                <td>{data.appointments.filter((a) => a.status === "Terjadwal").length}</td>
              </tr>
              <tr>
                <th>Obat Stok Rendah (&le; 5)</th>
                <td>{lowStock.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="legacy-panel">
        <h2>JADWAL HARI INI</h2>
        <div className="body">
          {todayAppointments.length === 0 ? (
            <p className="legacy-note">Tidak ada jadwal untuk hari ini.</p>
          ) : (
            <table className="legacy-table">
              <thead>
                <tr>
                  <th>No. Antrean</th>
                  <th>Pasien</th>
                  <th>Poli</th>
                  <th>Jam</th>
                  <th>Keluhan</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.code}</td>
                    <td>{a.patientName}</td>
                    <td>{a.poli}</td>
                    <td>{a.time}</td>
                    <td>{a.complaint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="legacy-panel">
        <h2>PERINGATAN STOK</h2>
        <div className="body">
          {lowStock.length === 0 ? (
            <p className="legacy-note">Semua stok aman.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {lowStock.map((m) => (
                <li key={m.id}>
                  {m.name} — sisa <b>{m.stock}</b> {m.unit} <span className="legacy-badge legacy-badge-low">STOK RENDAH</span>
                </li>
              ))}
            </ul>
          )}
          <p className="legacy-note" style={{ marginBottom: 0 }}>
            Gunakan menu <Link href="/legacy/pharmacy">Farmasi / Stok Obat</Link> untuk menambah stok.
          </p>
        </div>
      </div>
    </div>
  );
}
