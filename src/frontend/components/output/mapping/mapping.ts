// Calculo del "corner pin": deforma un rectangulo para que sus 4 esquinas
// queden donde el usuario las coloco (transformacion proyectiva / homografia).

export type MappingPoint = { x: number; y: number }

// orden: superior izquierda, superior derecha, inferior derecha, inferior izquierda
export const DEFAULT_CORNERS: MappingPoint[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
]

export function getCorners(corners: MappingPoint[] | undefined): MappingPoint[] {
    if (!Array.isArray(corners) || corners.length !== 4) return DEFAULT_CORNERS.map((a) => ({ ...a }))
    return corners.map((a, i) => ({ x: Number.isFinite(a?.x) ? a.x : DEFAULT_CORNERS[i].x, y: Number.isFinite(a?.y) ? a.y : DEFAULT_CORNERS[i].y }))
}

export function isDefaultCorners(corners: MappingPoint[] | undefined) {
    const c = getCorners(corners)
    return c.every((p, i) => Math.abs(p.x - DEFAULT_CORNERS[i].x) < 0.0001 && Math.abs(p.y - DEFAULT_CORNERS[i].y) < 0.0001)
}

// Matriz 3x3 que lleva el cuadrado unitario (u, v en 0-1) a las 4 esquinas dadas
export function getProjectiveMatrix(corners: MappingPoint[]) {
    const [p0, p1, p2, p3] = getCorners(corners)
    const dx1 = p1.x - p2.x
    const dx2 = p3.x - p2.x
    const dx3 = p0.x - p1.x + p2.x - p3.x
    const dy1 = p1.y - p2.y
    const dy2 = p3.y - p2.y
    const dy3 = p0.y - p1.y + p2.y - p3.y

    let g = 0
    let h = 0
    if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
        const det = dx1 * dy2 - dx2 * dy1
        if (Math.abs(det) > 1e-12) {
            g = (dx3 * dy2 - dx2 * dy3) / det
            h = (dx1 * dy3 - dx3 * dy1) / det
        }
    }

    const a = p1.x - p0.x + g * p1.x
    const b = p3.x - p0.x + h * p3.x
    const c = p0.x
    const d = p1.y - p0.y + g * p1.y
    const e = p3.y - p0.y + h * p3.y
    const f = p0.y

    return { a, b, c, d, e, f, g, h }
}

// Punto (u, v) del cuadrado unitario -> posicion deformada (normalizada)
export function mapPoint(corners: MappingPoint[], u: number, v: number): MappingPoint {
    const m = getProjectiveMatrix(corners)
    const w = m.g * u + m.h * v + 1
    return { x: (m.a * u + m.b * v + m.c) / w, y: (m.d * u + m.e * v + m.f) / w }
}

// CSS transform (matrix3d) para un elemento de width x height px, con transform-origin: 0 0
export function getCornerPinTransform(corners: MappingPoint[] | undefined, width: number, height: number): string {
    if (!width || !height || isDefaultCorners(corners)) return ""
    const m = getProjectiveMatrix(getCorners(corners))

    // de pixeles del elemento (x, y) a pixeles destino:
    // X = (A x + B y + C) / (G x + H y + 1)
    const A = (m.a * width) / width
    const B = (m.b * width) / height
    const C = m.c * width
    const D = (m.d * height) / width
    const E = (m.e * height) / height
    const F = m.f * height
    const G = m.g / width
    const H = m.h / height

    const values = [A, D, 0, G, B, E, 0, H, 0, 0, 1, 0, C, F, 0, 1].map((n) => (Number.isFinite(n) ? Number(n.toFixed(10)) : 0))
    return `matrix3d(${values.join(",")})`
}
