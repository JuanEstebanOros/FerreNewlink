import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next start resuelve /public en un set de rutas servibles al arrancar el
  // proceso, no como un directorio leido en vivo — archivos escritos en el
  // volume de Railway despues del boot (ej. subidas admin) 404ean via el
  // servido estatico normal de Next aunque existan en disco. Este rewrite
  // manda /uploads/runtime/* a una API route que lee el archivo con fs en
  // cada request, evitando ese cacheo. /uploads/products/* (imagenes del
  // catalogo, bakeadas en el build) no lo necesita y sigue sirviendose normal.
  async rewrites() {
    return [
      {
        source: "/uploads/runtime/:path*",
        destination: "/api/uploads/runtime/:path*",
      },
    ];
  },
};

export default nextConfig;
