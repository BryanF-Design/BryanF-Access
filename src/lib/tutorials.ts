export type TutorialAsset =
  | { type: "video"; src: string }
  | { type: "image"; src: string; alt: string };

export interface TutorialStep {
  slug: string;
  title: string;
  description: string;
  assets: TutorialAsset[];
  instructions?: string[];
}

function protectedAsset(path: string) {
  return `/api/tutorial-assets/${path}`;
}

export const tutorialSteps: TutorialStep[] = [
  {
    slug: "host",
    title: "Configuracion del host",
    description:
      "Acceso al panel donde vive tu sitio, DNS basico y configuraciones esenciales para administrar tu hosting.",
    assets: [{ type: "video", src: protectedAsset("host/video.mp4") }],
  },
  {
    slug: "accesos",
    title: "Accesos y credenciales",
    description:
      "Como ubicar y organizar credenciales de cPanel, base de datos, FTP y correos sin exponerlas fuera del portal.",
    assets: [{ type: "video", src: protectedAsset("accesos/video.mp4") }],
  },
  {
    slug: "carpeta-pagina-web",
    title: "Carpeta de tu pagina web",
    description:
      "Como reconocer la carpeta raiz, archivos clave, imagenes y documentos dentro del gestor de archivos.",
    assets: [{ type: "video", src: protectedAsset("carpeta-pagina-web/video.mp4") }],
  },
  {
    slug: "crear-correo-titan",
    title: "Crear un correo en Titan",
    description:
      "Alta de una cuenta de correo profesional desde HostGator y Titan Mail.",
    assets: [
      {
        type: "image",
        src: protectedAsset("crear-correo-titan/administrar-cuentas.png"),
        alt: "Administrar cuentas de correo en HostGator",
      },
      {
        type: "image",
        src: protectedAsset("crear-correo-titan/crear-nueva-cuenta.png"),
        alt: "Crear nueva cuenta de correo",
      },
      {
        type: "image",
        src: protectedAsset("crear-correo-titan/interface-administrativa.png"),
        alt: "Interfaz administrativa de Titan Mail",
      },
      {
        type: "image",
        src: protectedAsset("crear-correo-titan/creacion-cuenta.png"),
        alt: "Creacion de cuenta de correo en HostGator",
      },
    ],
    instructions: [
      "En HostGator, abre Correos electronicos.",
      "En el dominio correcto, entra a Administrar correos electronicos.",
      "Abre Cuentas de correo y selecciona Crear nueva cuenta.",
      "Completa correo, contrasena y recuperacion, y confirma la creacion.",
    ],
  },
  {
    slug: "entrar-correo-titan",
    title: "Entrar al correo de Titan",
    description:
      "Ingreso al webmail de Titan desde el navegador usando tu correo y contrasena.",
    assets: [
      {
        type: "image",
        src: protectedAsset("entrar-correo-titan/url-titan.png"),
        alt: "URL de Titan Mail en espanol",
      },
      {
        type: "image",
        src: protectedAsset("entrar-correo-titan/url-correo.png"),
        alt: "Pantalla de inicio de sesion de Titan",
      },
      {
        type: "image",
        src: protectedAsset("entrar-correo-titan/contrasena.png"),
        alt: "Campo de contrasena de Titan Mail",
      },
    ],
    instructions: [
      "Abre titan.hostgator.mx/login/.",
      "Ingresa tu correo y contrasena.",
      "Si el navegador vuelve a pedir la contrasena, completala y presiona Enter.",
    ],
  },
];
