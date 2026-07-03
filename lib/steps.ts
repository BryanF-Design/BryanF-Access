export type StepType = "video" | "images";

export interface StepImage {
  src: string;
  alt: string;
}

export interface TutorialStep {
  slug: string;
  title: string;
  description: string;
  order: number;
  icon: string;
  type: StepType;
  videoFolder?: string;
  images?: StepImage[];
  instructions?: string[];
}

export const tutorialSteps: TutorialStep[] = [
  {
    slug: "host",
    title: "Configuración del Host",
    description:
      "Aquí encontrarás todo sobre el servidor donde vive tu página web. Te enseñamos a ingresar al panel de control cPanel, cómo funciona el DNS de tu dominio y cuáles son las configuraciones esenciales que debes conocer para administrar tu hosting sin complicaciones.",
    order: 1,
    icon: "server",
    type: "video",
    videoFolder: "host",
  },
  {
    slug: "accesos",
    title: "Accesos y Credenciales",
    description:
      "Centraliza todas las contraseñas y accesos de tu proyecto en un solo lugar. Te explicamos dónde encontrar las credenciales de cPanel, tu base de datos, FTP y correos electrónicos, y cómo organizarlas de forma segura para que siempre tengas el control.",
    order: 2,
    icon: "key",
    type: "video",
    videoFolder: "accesos",
  },
  {
    slug: "carpeta-pagina-web",
    title: "Carpeta de tu Página Web",
    description:
      "Descubre cómo está organizado tu sitio web por dentro. Aprenderás a identificar la carpeta raíz, dónde están tus imágenes y documentos, cómo navegar por el gestor de archivos de cPanel y qué archivos son clave para el funcionamiento de tu página.",
    order: 3,
    icon: "folder",
    type: "video",
    videoFolder: "carpeta-pagina-web",
  },
  {
    slug: "crear-correo-titan",
    title: "Crear un Correo en Titan",
    description:
      "Crea tu correo profesional con tu dominio personalizado en Titan Mail a través del panel de HostGator.",
    order: 4,
    icon: "mail-plus",
    type: "images",
    images: [
      { src: "/pasos/crear-correo-titan/administrar-cuentas.png", alt: "Administrar cuentas de correo en HostGator" },
      { src: "/pasos/crear-correo-titan/crear-nueva-cuenta.png", alt: "Crear nueva cuenta de correo" },
      { src: "/pasos/crear-correo-titan/interface-administrativa.png", alt: "Interfaz administrativa de Titan Mail" },
      { src: "/pasos/crear-correo-titan/creacion-cuenta.png", alt: "Creación de cuenta de correo en HostGator" },
    ],
    instructions: [
      "En tu panel de HostGator, haz clic en Correos electrónicos.",
      "En el dominio donde deseas crear la cuenta, haz clic en Administrar correos electrónicos.",
      "En la pantalla de gestión, haz clic en la opción Cuentas de correo.",
      "Haz clic en Crear nueva cuenta de correo electrónico.",
      "Completa los datos: correo (ej: contacto@tudominio.com), contraseña y dirección de recuperación.",
      "Haz clic en Crear nueva cuenta para finalizar.",
    ],
  },
  {
    slug: "entrar-correo-titan",
    title: "Entrar al Correo de Titan",
    description:
      "Aprende a acceder a tu correo Titan desde el navegador usando el webmail de HostGator.",
    order: 5,
    icon: "inbox",
    type: "images",
    images: [
      { src: "/pasos/entrar-correo-titan/url-titan.png", alt: "URL de Titan Mail en español" },
      { src: "/pasos/entrar-correo-titan/url-correo.png", alt: "Pantalla de inicio de sesión de Titan" },
      { src: "/pasos/entrar-correo-titan/contrasena.png", alt: "Campo de contraseña de Titan Mail" },
    ],
    instructions: [
      "Abre tu navegador y ve a: titan.hostgator.mx/login/",
      "Ingresa tu correo electrónico y contraseña, luego haz clic en Iniciar sesión.",
      "Completa tu contraseña nuevamente si se solicita y presiona Enter.",
    ],
  },
];
