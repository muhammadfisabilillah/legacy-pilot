"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { POLI_LIST } from "@/lib/legacy/types";

type Success = { patientName: string; code: string; poli: string; date: string; time: string; medicalRecordNo: string };

const emptyForm = {
  name: "",
  nik: "",
  phone: "",
  birthDate: "",
  poli: "",
  date: "",
  time: "",
  complaint: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);

  function update(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(null);
    try {
      const res = await fetch("/api/legacy/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Pendaftaran gagal.");
        return;
      }
      setSuccess({
        patientName: data.patient.name,
        code: data.appointment.code,
        poli: data.appointment.poli,
        date: data.appointment.date,
        time: data.appointment.time,
        medicalRecordNo: data.patient.medicalRecordNo,
      });
      setForm(emptyForm);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="legacy-panel">
      <h2>PENDAFTARAN PASIEN BARU</h2>
      <div className="body">
        <p className="legacy-note" style={{ marginTop: 0 }}>
          Isi seluruh data. Field bertanda * wajib. NIK harus 16 digit dan belum pernah terdaftar.
        </p>

        {error && <div className="legacy-error">{error}</div>}

        {success && (
          <div className="legacy-success">
            <b>Pendaftaran berhasil.</b>
            <br />
            Pasien: {success.patientName} ({success.medicalRecordNo})
            <br />
            No. Antrean: <b>{success.code}</b> — Poli {success.poli}, {success.date} pukul {success.time}.
            <br />
            <Link href="/legacy/patients">Lihat data pasien &amp; jadwal</Link>
            {" | "}
            <Link href="/legacy/register">Daftarkan pasien lain</Link>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="legacy-field">
            <label htmlFor="name">Nama Lengkap *</label>
            <input id="name" name="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="legacy-field">
            <label htmlFor="nik">NIK (16 digit) *</label>
            <input id="nik" name="nik" maxLength={16} value={form.nik} onChange={(e) => update("nik", e.target.value)} />
          </div>
          <div className="legacy-field">
            <label htmlFor="phone">No. Telepon *</label>
            <input id="phone" name="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="legacy-field">
            <label htmlFor="birthDate">Tanggal Lahir</label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
            />
          </div>
          <div className="legacy-field">
            <label htmlFor="poli">Poli Tujuan *</label>
            <select id="poli" name="poli" value={form.poli} onChange={(e) => update("poli", e.target.value)}>
              <option value="">-- Pilih Poli --</option>
              {POLI_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="legacy-field">
            <label htmlFor="date">Tanggal Kunjungan *</label>
            <input id="date" name="date" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
          </div>
          <div className="legacy-field">
            <label htmlFor="time">Jam Kunjungan *</label>
            <input id="time" name="time" type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
          </div>
          <div className="legacy-field">
            <label htmlFor="complaint">Keluhan / Catatan</label>
            <textarea
              id="complaint"
              name="complaint"
              rows={2}
              value={form.complaint}
              onChange={(e) => update("complaint", e.target.value)}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <button type="submit" className="legacy-btn legacy-btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Pendaftaran"}
            </button>
            <button
              type="button"
              className="legacy-btn"
              onClick={() => {
                setForm(emptyForm);
                setError("");
                setSuccess(null);
              }}
            >
              Bersihkan Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
