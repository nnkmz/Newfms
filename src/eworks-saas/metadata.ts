/**
 * Metadata awal berasaskan penerokaan portal FMS/e-Aduan UiTM.
 * Boleh dipindahkan ke DB/config service pada fasa seterusnya.
 */

export interface CampusHelpdesk {
  campus: string;
  phone: string;
  note?: string;
}

export const UITM_CAMPUS_HELPDESKS: CampusHelpdesk[] = [
  { campus: "UiTM Shah Alam", phone: "03-55444444" },
  { campus: "UiTM Puncak Perdana (Fasiliti)", phone: "03-79622255" },
  { campus: "UiTM Puncak Perdana (ICT)", phone: "03-79622061" },
  { campus: "UiTM Kuala Pilah", phone: "06-4832323" },
  { campus: "UiTM Segamat", phone: "07-9352240/2245/2249" },
  { campus: "UiTM Merbok", phone: "04-4562002" },
  { campus: "UiTM Machang", phone: "09-9762054/2111" },
  { campus: "UiTM Arau", phone: "04-9882333" },
  { campus: "UiTM Seri Iskandar", phone: "05-3742626" },
];

export const UITM_TENANT_ID = "uitm";
