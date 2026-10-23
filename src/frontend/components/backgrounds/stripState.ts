// Carpeta activa de la franja de fondos, compartida con la lista "Media" de la izquierda
import { writable } from "svelte/store"
import { translateText } from "../../utils/language"

const STORAGE_KEY = "freeshow_background_strip"
export const STRIP_CAMERAS = "cameras"

function loadTab() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").tab || ""
    } catch (err) {
        return ""
    }
}

export const stripActiveTab = writable<string>(loadTab())

// las carpetas por defecto guardan su nombre como clave de traduccion (ej. "category.pictures")
export function getFolderName(name: string) {
    if (/^[a-z_]+\.[a-z_]+$/.test(name || "")) return translateText(name) || name
    return name
}

// guardar la carpeta elegida (tambien cuando se cambia desde la lista de la izquierda)
stripActiveTab.subscribe((tab) => {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
        data.tab = tab
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
        // sin almacenamiento
    }
})
