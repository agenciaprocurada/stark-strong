/* Imagens — versão webp local.
   Todas as imagens em /public foram convertidas para .webp (scripts/images-webp.mjs).
   webpSrc deriva o caminho .webp a partir do caminho local png/jpg/jpeg.
   Para URLs externas (http) ou formatos sem webp, retorna null. */
export function webpSrc(path?: string | null): string | null {
  if (!path || !/^\/.+\.(png|jpe?g)$/i.test(path)) return null;
  return path.replace(/\.(png|jpe?g)$/i, '.webp');
}

/* Caminho preferindo webp; cai no original quando não há versão webp. */
export function preferWebp(path: string): string {
  return webpSrc(path) ?? path;
}
