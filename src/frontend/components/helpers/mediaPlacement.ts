// Escalado y posicion de medios (estilo Resolume Arena):
// posicion X/Y, escala uniforme, ancho, alto y rotacion, todo en % de la salida.
import type { MediaStyle } from "../../../types/Main"

export type MediaPlacement = {
    x?: number // % del ancho de la salida
    y?: number // % del alto de la salida
    scale?: number // % uniforme
    width?: number // % horizontal
    height?: number // % vertical
    rotation?: number // grados
}

const num = (value: any, fallback: number) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

export function hasPlacement(placement: MediaPlacement | undefined | null) {
    if (!placement) return false
    return num(placement.x, 0) !== 0 || num(placement.y, 0) !== 0 || num(placement.scale, 100) !== 100 || num(placement.width, 100) !== 100 || num(placement.height, 100) !== 100 || num(placement.rotation, 0) !== 0
}

// transform CSS para el elemento de video/imagen (incluye volteo horizontal/vertical)
export function getMediaTransform(mediaStyle: MediaStyle | undefined) {
    const flipX = mediaStyle?.flipped ? -1 : 1
    const flipY = mediaStyle?.flippedY ? -1 : 1
    const p: MediaPlacement = (mediaStyle as any)?.placement || {}

    if (!hasPlacement(p)) return `scale(${flipX}, ${flipY})`

    const scale = num(p.scale, 100) / 100
    const sx = (scale * num(p.width, 100)) / 100
    const sy = (scale * num(p.height, 100)) / 100

    return `translate(${num(p.x, 0)}%, ${num(p.y, 0)}%) rotate(${num(p.rotation, 0)}deg) scale(${flipX * sx}, ${flipY * sy})`
}
