import {
  POLI_LIST,
  type Appointment,
  type Medicine,
  type Patient,
  type Poli,
  type StockMovement,
} from "./types";

export type { Appointment, ClinicData, Medicine, Patient, Poli, StockMovement } from "./types";
export { POLI_LIST };

type Database = {
  patients: Patient[];
  appointments: Appointment[];
  medicines: Medicine[];
  movements: StockMovement[];
  patientSeq: number;
  appointmentSeq: number;
  queueSeq: number;
  movementSeq: number;
};

const globalStore = globalThis as unknown as { __legacyClinicDb?: Database };

function localIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso() {
  return localIso(new Date());
}

function dayOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localIso(d);
}

function seed(): Database {
  return {
    patients: [
      {
        id: 1,
        medicalRecordNo: "RM-0001",
        name: "Budi Santoso",
        nik: "3201010101010001",
        phone: "081234567801",
        birthDate: "1985-04-12",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        medicalRecordNo: "RM-0002",
        name: "Siti Aminah",
        nik: "3201010101010002",
        phone: "081234567802",
        birthDate: "1992-09-03",
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        medicalRecordNo: "RM-0003",
        name: "Andi Wijaya",
        nik: "3201010101010003",
        phone: "081234567803",
        birthDate: "1978-01-27",
        createdAt: new Date().toISOString(),
      },
    ],
    appointments: [
      {
        id: 1,
        code: "A-001",
        patientId: 2,
        patientName: "Siti Aminah",
        poli: "Umum",
        date: dayOffset(0),
        time: "09:00",
        complaint: "Demam dan batuk sejak tiga hari",
        status: "Terjadwal",
      },
      {
        id: 2,
        code: "A-002",
        patientId: 3,
        patientName: "Andi Wijaya",
        poli: "Gigi",
        date: dayOffset(1),
        time: "13:30",
        complaint: "Gigi berlubang, nyeri saat mengunyah",
        status: "Terjadwal",
      },
    ],
    medicines: [
      { id: 1, code: "OBT-001", name: "Paracetamol 500mg", stock: 4, unit: "tablet" },
      { id: 2, code: "OBT-002", name: "Amoxicillin 500mg", stock: 28, unit: "kapsul" },
      { id: 3, code: "OBT-003", name: "Sirup OBH", stock: 12, unit: "botol" },
      { id: 4, code: "OBT-004", name: "Vitamin C 500mg", stock: 60, unit: "tablet" },
    ],
    movements: [],
    patientSeq: 3,
    appointmentSeq: 2,
    queueSeq: 2,
    movementSeq: 0,
  };
}

export function db(): Database {
  if (!globalStore.__legacyClinicDb) globalStore.__legacyClinicDb = seed();
  return globalStore.__legacyClinicDb;
}

export function resetDb() {
  globalStore.__legacyClinicDb = seed();
}

export function getData() {
  return structuredClone(db());
}

export type RegisterInput = {
  name?: string;
  nik?: string;
  phone?: string;
  birthDate?: string;
  poli?: string;
  date?: string;
  time?: string;
  complaint?: string;
};

export type RegisterResult =
  | { ok: true; patient: Patient; appointment: Appointment }
  | { ok: false; field: string; message: string };

export function registerPatient(input: RegisterInput): RegisterResult {
  const name = (input.name ?? "").trim();
  const nik = (input.nik ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const birthDate = (input.birthDate ?? "").trim();
  const poli = (input.poli ?? "").trim() as Poli;
  const date = (input.date ?? "").trim();
  const time = (input.time ?? "").trim();
  const complaint = (input.complaint ?? "").trim();

  if (!name) return { ok: false, field: "name", message: "Nama lengkap wajib diisi." };
  if (!/^\d{16}$/.test(nik)) return { ok: false, field: "nik", message: "NIK harus 16 digit angka." };
  if (!phone) return { ok: false, field: "phone", message: "Nomor telepon wajib diisi." };
  if (!POLI_LIST.includes(poli)) return { ok: false, field: "poli", message: "Poli tidak valid." };
  if (!date) return { ok: false, field: "date", message: "Tanggal kunjungan wajib diisi." };
  if (!time) return { ok: false, field: "time", message: "Jam kunjungan wajib diisi." };
  if (date < dayOffset(0)) return { ok: false, field: "date", message: "Tanggal kunjungan tidak boleh di masa lalu." };

  const existing = db().patients.find((p) => p.nik === nik);
  if (existing) {
    return {
      ok: false,
      field: "nik",
      message: `NIK sudah terdaftar atas nama ${existing.name} (${existing.medicalRecordNo}). Buka menu Pasien untuk melihat data.`,
    };
  }

  const data = db();
  data.patientSeq += 1;
  data.appointmentSeq += 1;
  data.queueSeq += 1;

  const patient: Patient = {
    id: data.patientSeq,
    medicalRecordNo: `RM-${String(data.patientSeq).padStart(4, "0")}`,
    name,
    nik,
    phone,
    birthDate,
    createdAt: new Date().toISOString(),
  };

  const appointment: Appointment = {
    id: data.appointmentSeq,
    code: `A-${String(data.queueSeq).padStart(3, "0")}`,
    patientId: patient.id,
    patientName: patient.name,
    poli,
    date,
    time,
    complaint,
    status: "Terjadwal",
  };

  data.patients.push(patient);
  data.appointments.push(appointment);
  return { ok: true, patient, appointment };
}

export type StockResult =
  | { ok: true; medicine: Medicine; movement: StockMovement }
  | { ok: false; message: string };

export function addStock(medicineId: number, qty: number, reason: string): StockResult {
  const data = db();
  const medicine = data.medicines.find((m) => m.id === medicineId);
  if (!medicine) return { ok: false, message: "Obat tidak ditemukan." };
  if (!Number.isFinite(qty) || qty <= 0) return { ok: false, message: "Jumlah harus lebih dari 0." };
  if (qty > 1000) return { ok: false, message: "Jumlah maksimal 1000 per transaksi." };

  medicine.stock += qty;
  data.movementSeq += 1;
  const movement: StockMovement = {
    id: data.movementSeq,
    medicineId: medicine.id,
    medicineName: medicine.name,
    qty,
    reason: reason.trim() || "Penambahan stok",
    at: new Date().toISOString(),
  };
  data.movements.unshift(movement);
  return { ok: true, medicine, movement };
}

export type DeleteResult = { ok: true; appointment: Appointment } | { ok: false; message: string };

export function deleteAppointment(id: number): DeleteResult {
  const data = db();
  const index = data.appointments.findIndex((a) => a.id === id);
  if (index === -1) return { ok: false, message: "Jadwal tidak ditemukan." };
  const [appointment] = data.appointments.splice(index, 1);
  return { ok: true, appointment };
}
