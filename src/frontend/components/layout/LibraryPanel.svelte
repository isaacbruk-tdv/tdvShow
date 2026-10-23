<script lang="ts">
    // Biblioteca de presentaciones debajo de Proyectos (modo estilo ProPresenter)
    import { onDestroy } from "svelte"
    import { activePopup, drawerTabsData, popupData } from "../../stores"
    import { startResizing, stopResizing } from "../../utils/cursor"
    import Navigation from "../drawer/Navigation.svelte"
    import Shows from "../drawer/pages/Shows.svelte"
    import Icon from "../helpers/Icon.svelte"

    const STORAGE_KEY = "freeshow_pro_library_height"
    let height = 55
    try {
        height = Number(localStorage.getItem(STORAGE_KEY)) || 55
    } catch (err) {
        // sin almacenamiento
    }

    // ocupar todo el espacio libre (cuando Proyectos esta minimizado)
    export let fill = false

    let searchValue = ""
    let firstMatch: any = null
    $: active = $drawerTabsData.shows?.activeSubTab || "all"

    // cambiar el alto arrastrando el borde superior (en % de la columna)
    let panel: HTMLElement | undefined
    let resizing: { startY: number; startHeight: number; total: number } | null = null
    function startResize(e: MouseEvent) {
        const total = panel?.parentElement?.offsetHeight || window.innerHeight
        resizing = { startY: e.clientY, startHeight: height, total }
        startResizing("ns-resize")
    }
    function mousemove(e: MouseEvent) {
        if (!resizing) return
        const delta = ((resizing.startY - e.clientY) / resizing.total) * 100
        height = Math.min(80, Math.max(15, resizing.startHeight + delta))
    }
    function mouseup() {
        if (!resizing) return
        resizing = null
        stopResizing()
        try {
            localStorage.setItem(STORAGE_KEY, String(Math.round(height)))
        } catch (err) {
            // sin almacenamiento
        }
    }
    onDestroy(() => {
        if (resizing) stopResizing()
    })
</script>

<svelte:window on:mousemove={mousemove} on:mouseup={mouseup} />

<section class="library" class:fill style={fill ? "" : `height: ${height}%;`} bind:this={panel}>
    {#if !fill}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="resize" on:mousedown={startResize}></div>
    {/if}

    <div class="title">
        <Icon id="slide" size={1} white />
        Biblioteca
        <button
            class="manage"
            title="Administrar presentaciones (seleccionar varias, eliminar, mover de categoría)"
            on:click={() => {
                popupData.set({ popupTitle: "Administrar presentaciones" })
                activePopup.set("show_manager")
            }}
        >
            <Icon id="options" size={0.9} white />
            Administrar
        </button>
    </div>

    <div class="categories">
        <Navigation id="shows" />
    </div>

    <div class="searchBar">
        <Icon id="search" size={1} white />
        <input class="edit drawer_search" type="text" placeholder="Buscar presentación" bind:value={searchValue} />
        {#if searchValue}
            <button on:click={() => (searchValue = "")} aria-label="Limpiar búsqueda"><Icon id="clear" size={0.9} white /></button>
        {/if}
    </div>

    <div class="list">
        <Shows {active} {searchValue} bind:firstMatch alwaysActive />
    </div>
</section>

<style>
    .library {
        position: relative;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        min-height: 120px;
        border-top: 2px solid var(--primary-lighter);
        background-color: var(--primary);
        overflow: hidden;
    }
    .library.fill {
        flex: 1;
    }
    .resize {
        position: absolute;
        top: -3px;
        left: 0;
        width: 100%;
        height: 7px;
        cursor: ns-resize;
        z-index: 2;
    }
    .title {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        font-size: 0.8em;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        opacity: 0.8;
        background-color: var(--primary-darkest);
    }
    .manage {
        margin-inline-start: auto;
        display: flex;
        align-items: center;
        gap: 4px;
        height: 24px;
        padding: 0 8px;
        border: 1px solid var(--primary-lighter);
        border-radius: 12px;
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: 0.95em;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
        cursor: pointer;
    }
    .manage:hover {
        background-color: var(--hover);
    }
    .categories {
        display: flex;
        flex-direction: column;
        max-height: 22%;
        min-height: 40px;
        overflow-y: auto;
        border-bottom: 1px solid var(--primary-lighter);
    }
    .searchBar {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-bottom: 1px solid var(--primary-lighter);
    }
    .searchBar input {
        flex: 1;
        min-width: 0;
        height: 28px;
        padding: 0 8px;
        border: none;
        border-radius: 5px;
        background-color: rgb(0 0 0 / 0.25);
        color: var(--text);
        font-family: inherit;
        font-size: 0.9em;
    }
    .searchBar input:focus {
        outline: 2px solid var(--secondary);
        outline-offset: -2px;
    }
    .searchBar button {
        display: flex;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 2px;
    }
    .list {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        background-color: var(--primary-darker);
    }
</style>
