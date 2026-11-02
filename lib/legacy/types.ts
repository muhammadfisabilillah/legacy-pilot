export const POLI_LIST = ["Umum", "Gigi", "Anak", "Kandungan"] as const;
export type Poli = (typeof POLI_LIST)[number];

export type Patient = {
  id: number;
  medicalRecordNo: string;
  name: string;
  nik: string;
  phone: string;
  birthDate: string;
  createdAt: string;
};

export type Appointment = {
  id: number;
  code: string;
  patientId: number;
  patientName: string;
  poli: Poli;
  date: string;
  time: string;
  complaint: string;
  status: "Terjadwal" | "Selesai" | "Dibatalkan";
};

export type Medicine = {
  id: number;
  code: string;
  name: string;
  stock: number;
  unit: string;
};

export type StockMovement = {
  id: number;
  medicineId: number;
  medicineName: string;
  qty: number;
  reason: string;
  at: string;
};

export type ClinicData = {
  patients: Patient[];
  appointments: Appointment[];
  medicines: Medicine[];
  movements: StockMovement[];
};
