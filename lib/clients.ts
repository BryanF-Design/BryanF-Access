export interface Client {
  id: string;
  displayName: string;
  keywords: string[];
  driveLink: string;
}

// Clientes estáticos (respaldo si Supabase no está configurado)
export const staticClients: Client[] = [
  {
    id: "KD0626A",
    displayName: "Koi Arquitectura",
    keywords: ["koiarquitectura.com", "koi arquitectura"],
    driveLink: "https://drive.google.com/drive/folders/PENDIENTE",
  },
];

export function findClientById(id: string): Client | undefined {
  return staticClients.find(
    (c) => c.id.toUpperCase() === id.trim().toUpperCase()
  );
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function validateAccess(client: Client, input: string): boolean {
  const normalizedInput = normalize(input);
  return client.keywords.some(
    (keyword) => normalizedInput === normalize(keyword)
  );
}

const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "521234567890";

export const WHATSAPP_LINK = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Hola, necesito ayuda para acceder a mis tutoriales de BryanF Design."
)}`;
