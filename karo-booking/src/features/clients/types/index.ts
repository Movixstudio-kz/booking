export type ClientGender = "female" | "male" | "other" | "unspecified";
export type ClientSource = "admin" | "booking";

export type ClientItem = {
  id: string;
  fullName: string;
  phone: string;
  normalizedPhone: string;
  whatsappPhone: string | null;
  email: string | null;
  birthDate: string | null;
  gender: ClientGender;
  notes: string;
  allergies: string;
  source: ClientSource;
  photoUrl: string | null;
  marketingConsent: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
