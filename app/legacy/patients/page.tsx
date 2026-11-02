"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClinicData } from "@/lib/legacy/types";

export default function PatientsPage() {
  const [data, setData] = useState<ClinicData | null>(null);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/legacy/data", { cache: "no-store" });
    return (await res.json()) as ClinicData;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setData(await fetchData());
    setLoading(false);
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    fetchData()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  async function remove(id: number) {
    const res = await fetch("/api/legacy/appointments/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const result = await res.json();
    if (!res.ok) {
      setMessage(result.message ?? "Gagal menghapus jadwal.");
    } else {
      setMessage(`Jadwal ${result.appointment.code} (${result.appointment.patientName}) berhasil dihapus.`);
    }
    setConfirmId(null);
    await load();
  }

  const patients = (data?.patients ?? []).filter((p) => {
    const q = search.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.nik.includes(q) || p.medicalRecordNo.toLowerCase().includes(q);
  });
  const appointments = data?.appointments ?? [];

  return (
    <div>
      <div className="legacy-panel">
        <h2>DATA PASIEN</h2>
        <div className="body">
          <div className="legacy-field">
            <label htmlFor="search">Cari Pasien (nama / NIK / No. RM)</label>
            <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="button" className="legacy-btn" onClick={() => void load()}>
            Muat Ulang Data
          </button>
          {loading && <span className="legacy-note"> Memuat...</span>}
          <p className="legacy-note">
            Menampilkan {patients.length} dari {data?.patients.length ?? 0} pasien.
          </p>
          <table className="legacy-table">
            <thead>
              <tr>
                <th>No. RM</th>
                <th>Nama</th>
                <th>NIK</th>
                <th>Telepon</th>
                <th>Tgl Lahir</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td>{p.medicalRecordNo}</td>
                  <td>{p.name}</td>
                  <td>{p.nik}</td>
                  <td>{p.phone}</td>
                  <td>{p.birthDate || "-"}</td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5}>Tidak ada pasien yang cocok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="legacy-panel">
        <h2>JADWAL &amp; ANTREAN</h2>
        <div className="body">
          {message && <div className="legacy-success">{message}</div>}
          <table className="legacy-table">
            <thead>
              <tr>
                <th>No. Antrean</th>
                <th>Pasien</th>
                <th>Poli</th>
                <th>Tanggal</th>
                <th>Jam</th>
                <th>Keluhan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.code}</td>
                  <td>{a.patientName}</td>
                  <td>{a.poli}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.complaint}</td>
                  <td>{a.status}</td>
                  <td>
                    {a.status === "Terjadwal" ? (
                      <>
                        <button type="button" className="legacy-btn legacy-btn-danger" onClick={() => setConfirmId(a.id)}>
                          Hapus
                        </button>
                        {confirmId === a.id && (
                          <div className="legacy-confirm">
                            Yakin hapus jadwal {a.code} untuk {a.patientName}?
                            <br />
                            <button type="button" className="legacy-btn legacy-btn-danger" onClick={() => void remove(a.id)}>
                              Ya, Lanjutkan
                            </button>
                            <button type="button" className="legacy-btn" onClick={() => setConfirmId(null)}>
                              Batal
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={8}>Belum ada jadwal.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
