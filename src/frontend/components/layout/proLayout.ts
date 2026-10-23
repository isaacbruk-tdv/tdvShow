// Modo de diseño "estilo ProPresenter": Biblia en el centro, audio a la derecha
// y el cajón inferior plegado. Se guarda solo en esta computadora.
import { get, writable } from "svelte/store"
import { activeDrawerTab, drawer } from "../../stores"

const STORAGE_KEY = "freeshow_pro_layout"

function load() {
    try {
        return localStorage.getItem(STORAGE_KEY) === "true"
    } catch (err) {
        return false
    }
}

export const proLayout = writable<boolean>(load())
// pestaña del centro: "show" (presentación) o "scripture" (Biblia)
export const proCenterTab = writable<"show" | "scripture">("show")

// pestañas del cajón que en este modo viven en otro lugar
export const PRO_HIDDEN_DRAWER_TABS = ["shows", "scripture", "audio"]

proLayout.subscribe((value) => {
    try {
        localStorage.setItem(STORAGE_KEY, String(value))
    } catch (err) {
        // sin almacenamiento, no pasa nada
    }

    if (!value) return
    // evitar que la Biblia o el audio esten abiertos dos veces
    if (PRO_HIDDEN_DRAWER_TABS.includes(get(activeDrawerTab) as string)) activeDrawerTab.set("media")
})

export function toggleProLayout() {
    const enabling = !get(proLayout)
    proLayout.set(enabling)

    // plegar el cajón inferior al activar (se puede volver a abrir)
    const current = get(drawer)
    if (enabling && current.height > 40) drawer.set({ height: 40, stored: current.height })
    if (!enabling && current.height <= 40) drawer.set({ height: current.stored || 300, stored: null })
}

// Proyectos minimizado (solo en el modo estilo ProPresenter)
const PROJECTS_KEY = "freeshow_pro_projects_collapsed"
function loadCollapsed() {
    try {
        return localStorage.getItem(PROJECTS_KEY) === "true"
    } catch (err) {
        return false
    }
}
export const proProjectsCollapsed = writable<boolean>(loadCollapsed())
proProjectsCollapsed.subscribe((value) => {
    try {
        localStorage.setItem(PROJECTS_KEY, String(value))
    } catch (err) {
        // sin almacenamiento
    }
})
