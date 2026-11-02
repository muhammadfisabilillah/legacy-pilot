"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ClinicData } from "@/lib/legacy/types";

export default function PharmacyPage() {
  const [data, setData] = useState<ClinicData | null>(null);
  const [medicineId, setMedicineId] = useState("");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/legacy/data", { cache: "no-store" });
    return (await res.json()) as ClinicData;
  }, []);

  const load = useCallback(async () => {
    setData(await fetchData());
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    fetchData().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/legacy/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineId: Number(medicineId), qty: Number(qty), reason }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.message ?? "Gagal menambah stok.");
        return;
      }
      setMessage(
        `Stok ${result.medicine.name} bertambah ${result.movement.qty} ${result.medicine.unit}. Stok sekarang ${result.medicine.stock} ${result.medicine.unit}.`,
      );
      setMedicineId("");
      setQty("");
      setReason("");
      await load();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setSaving(false);
    }
  }

  const medicines = data?.medicines ?? [];
  const movements = data?.movements ?? [];

  return (
    <div>
      <div className="legacy-panel">
        <h2>STOK OBAT</h2>
        <div className="body">
          <table className="legacy-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Obat</th>
                <th>Stok</th>
                <th>Satuan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m.id}>
                  <td>{m.code}</td>
                  <td>{m.name}</td>
                  <td>{m.stock}</td>
                  <td>{m.unit}</td>
                  <td>
                    {m.stock <= 5 ? (
                      <span className="legacy-badge legacy-badge-low">STOK RENDAH</span>
                    ) : (
                      <span className="legacy-badge">AMAN</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="legacy-panel">
        <h2>PENAMBAHAN STOK</h2>
        <div className="body">
          {error && <div className="legacy-error">{error}</div>}
          {message && <div className="legacy-success">{message}</div>}
          <form onSubmit={submit}>
            <div className="legacy-field">
              <label htmlFor="medicineId">Pilih Obat *</label>
              <select id="medicineId" value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
                <option value="">-- Pilih Obat --</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (stok {m.stock} {m.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="legacy-field">
              <label htmlFor="qty">Jumlah Masuk *</label>
              <input id="qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="legacy-field">
              <label htmlFor="reason">Keterangan</label>
              <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="mis. Terima kiriman gudang" />
            </div>
            <button type="submit" className="legacy-btn legacy-btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Stok"}
            </button>
            <button type="button" className="legacy-btn" onClick={() => void load()}>
              Muat Ulang Data
            </button>
          </form>
        </div>
      </div>

      <div className="legacy-panel">
        <h2>RIWAYAT PERGERAKAN STOK</h2>
        <div className="body">
          {movements.length === 0 ? (
            <p className="legacy-note">Belum ada pergerakan stok pada sesi ini.</p>
          ) : (
            <table className="legacy-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Obat</th>
                  <th>Jumlah</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mv) => (
                  <tr key={mv.id}>
                    <td>{new Date(mv.at).toLocaleString("id-ID")}</td>
                    <td>{mv.medicineName}</td>
                    <td>+{mv.qty}</td>
                    <td>{mv.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
