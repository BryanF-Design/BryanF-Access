const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "521234567890";

export const WHATSAPP_LINK = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Hola, necesito ayuda con mi proyecto de BryanF Design.",
)}`;
