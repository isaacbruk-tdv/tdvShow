// Sesiones: guardan la configuracion de salidas, estilos, carpetas de fondos y diseño
// (por ejemplo "TDV - 3 pantallas" o "Otra iglesia") para cargarla con un clic.
import { get } from "svelte/store"
import { uid } from "uid"
import { OUTPUT } from "../../../types/Channels"
import { mediaFolders, outputDisplay, outputs, special, styles } from "../../stores"
import { newToast } from "../../utils/common"
import { send } from "../../utils/request"
import { clone } from "../helpers/array"
import { checkFFmpeg, toggleOutputs } from "../helpers/output"
import { proLayout } from "../layout/proLayout"

export type SessionIncludes = { outputs: boolean; styles: boolean; mediaFolders: boolean; layout: boolean }
export type Session = {
    id: string
    name: string
    notes?: string
    createdAt: number
    updatedAt: number
    includes: SessionIncludes
    data: { outputs?: any; styles?: any; mediaFolders?: any; layout?: { pro: boolean } }
}

export const DEFAULT_INCLUDES: SessionIncludes = { outputs: true, styles: true, mediaFolders: true, layout: true }

export function getSessions(): { [id: string]: Session } {
    return get(special).sessions || {}
}

function setSessions(updater: (sessions: { [id: string]: Session }) => void) {
    special.update((a) => {
        if (!a.sessions) a.sessions = {}
        updater(a.sessions)
        return a
    })
}

// quita lo que esta en vivo (contenido, transmisiones activas) para guardar solo la configuracion
function cleanOutputs(list: any) {
    const copy = clone(list || {})
    Object.keys(copy).forEach((id) => {
        delete copy[id].out
        delete copy[id].show
        if (copy[id].webrtcData?.streaming) copy[id].webrtcData.streaming = false
        if (copy[id].rtmpData?.streaming) copy[id].rtmpData.streaming = false
    })
    return copy
}

function captureData(includes: SessionIncludes) {
    const data: Session["data"] = {}
    if (includes.outputs) data.outputs = cleanOutputs(get(outputs))
    if (includes.styles) data.styles = clone(get(styles))
    if (includes.mediaFolders) data.mediaFolders = clone(get(mediaFolders))
    if (includes.layout) data.layout = { pro: get(proLayout) }
    return data
}

export function saveNewSession(name: string, includes: SessionIncludes, notes = "") {
    const id = uid()
    const now = Date.now()
    const session: Session = { id, name: name.trim() || "Sesión sin nombre", notes, createdAt: now, updatedAt: now, includes: { ...includes }, data: captureData(includes) }
    setSessions((s) => (s[id] = session))
    special.update((a) => ({ ...a, currentSession: id }))
    return id
}

// sobrescribir una sesion con lo que esta configurado ahora
export function updateSession(id: string) {
    const session = getSessions()[id]
    if (!session) return
    setSessions((s) => {
        s[id].data = captureData(session.includes)
        s[id].updatedAt = Date.now()
    })
}

export function renameSession(id: string, name: string) {
    if (!name.trim()) return
    setSessions((s) => {
        if (s[id]) s[id].name = name.trim()
    })
}

export function deleteSession(id: string) {
    setSessions((s) => delete s[id])
    if (get(special).currentSession === id) special.update((a) => ({ ...a, currentSession: "" }))
}

export function applySession(id: string) {
    const session = getSessions()[id]
    if (!session) return

    const data = clone(session.data)

    if (data.styles) styles.set(data.styles)
    if (data.mediaFolders) mediaFolders.set(data.mediaFolders)
    if (data.layout) proLayout.set(!!data.layout.pro)

    if (data.outputs) applyOutputs(data.outputs)

    special.update((a) => ({ ...a, currentSession: id }))
    newToast(`Sesión cargada: ${session.name}`)
}

function applyOutputs(newOutputs: any) {
    const wasShowing = get(outputDisplay)

    // cerrar las ventanas de salida actuales
    if (wasShowing) toggleOutputs(null, { state: false })
    Object.keys(get(outputs)).forEach((outputId) => send(OUTPUT, ["REMOVE"], { id: outputId }))

    const cleaned = cleanOutputs(newOutputs)
    outputs.set(cleaned)

    // crear las ventanas con la configuracion de la sesion
    setTimeout(() => {
        Object.entries(cleaned).forEach(([outputId, output]: [string, any]) => {
            if (output.enabled) send(OUTPUT, ["CREATE"], { ...output, id: outputId })
        })
        if (Object.values(cleaned).some((o: any) => o.enabled && o.rtmp)) checkFFmpeg()

        // si estaba presentando, volver a mostrar las salidas
        if (wasShowing) setTimeout(() => toggleOutputs(null, { state: true }), 800)
    }, 400)
}

// ---- exportar / importar (para pasar una sesion a otra computadora) ----

export function exportSession(id: string) {
    const session = getSessions()[id]
    if (!session) return
    const blob = new Blob([JSON.stringify({ freeshowSession: 1, session }, null, 2)], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Sesion FreeShow - ${session.name}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(link.href), 2000)
}

export async function importSessionFile(file: File) {
    try {
        const json = JSON.parse(await file.text())
        const session: Session | undefined = json?.session
        if (!json?.freeshowSession || !session?.data) throw new Error("not a session")
        const id = uid()
        setSessions((s) => (s[id] = { ...session, id, updatedAt: Date.now() }))
        newToast(`Sesión importada: ${session.name}`)
        return id
    } catch (err) {
        newToast("Ese archivo no es una sesión de FreeShow")
        return null
    }
}
