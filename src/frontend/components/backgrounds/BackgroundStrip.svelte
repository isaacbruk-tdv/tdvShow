<script lang="ts">
    // Franja de fondos fija debajo de las diapositivas (estilo ProPresenter).
    // Muestra las carpetas de Multimedia y las camaras, siempre visibles.
    import { onDestroy } from "svelte"
    import { Main } from "../../../types/IPC/Main"
    import { requestMain } from "../../IPC/main"
    import { mediaFolders, outLocked, outputs } from "../../stores"
    import { startResizing, stopResizing } from "../../utils/cursor"
    import { proLayout } from "../layout/proLayout"
    import { getFolderName, stripActiveTab } from "./stripState"
    import Cameras from "../drawer/live/Cameras.svelte"
    import MediaCard from "../drawer/media/MediaCard.svelte"
    import { keysToID, sortFilenames } from "../helpers/array"
    import Icon from "../helpers/Icon.svelte"
    import { getExtension, getMediaType, isMediaExtension } from "../helpers/media"
    import { getAllNormalOutputs, setOutput } from "../helpers/output"
    import { clearBackground } from "../output/clear"

    const STORAGE_KEY = "freeshow_background_strip"
    const MIN_HEIGHT = 110
    const CAMERAS = "cameras"

    function loadSaved() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
        } catch (err) {
            return {}
        }
    }
    const saved = loadSaved()

    let height: number = saved.height || 190
    let collapsed: boolean = saved.collapsed || false
    let thumbSize: number = saved.thumbSize || 150
    let target: string[] = Array.isArray(saved.target) ? saved.target : []

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ height, collapsed, tab: $stripActiveTab, thumbSize, target }))
        } catch (err) {
            // sin almacenamiento disponible, no pasa nada
        }
    }

    // carpetas de Multimedia
    $: folders = keysToID($mediaFolders).filter((a) => a.path)
    $: if (Object.keys($mediaFolders).length && $stripActiveTab !== CAMERAS && !$mediaFolders[$stripActiveTab]) $stripActiveTab = folders[0]?.id || CAMERAS

    const folderName = getFolderName

    function selectTab(id: string) {
        $stripActiveTab = id
        if (collapsed) collapsed = false
        persist()
    }

    // archivos de la carpeta activa
    let files: any[] = []
    let requesting = 0
    $: currentPath = $stripActiveTab !== CAMERAS ? $mediaFolders[$stripActiveTab]?.path || "" : ""
    $: loadFiles(currentPath)
    async function loadFiles(path: string) {
        const current = ++requesting
        if (!path) {
            files = []
            return
        }

        const data = await requestMain(Main.READ_FOLDER, { path, depth: 1 })
        if (!data || current !== requesting) return

        const list = Object.values(data).filter((a: any) => !a.isFolder && isMediaExtension(getExtension(a.name)))
        files = sortFilenames(list as any[])
    }

    $: shiftRange = files.map((a) => ({ ...a, type: getMediaType(getExtension(a.name)) }))

    // salidas disponibles (se actualiza cuando cambian las salidas)
    $: normalOutputs = $outputs ? getAllNormalOutputs() : []
    // destino elegido; vacio = las salidas activas (comportamiento normal de FreeShow)
    $: targetIds = target.filter((id) => normalOutputs.some((a) => a.id === id))
    $: destinationOutputs = targetIds.length ? normalOutputs.filter((a) => targetIds.includes(a.id)) : normalOutputs.filter((a) => a.active)

    function toggleTarget(id: string) {
        target = targetIds.includes(id) ? targetIds.filter((a) => a !== id) : [...targetIds, id]
        persist()
    }
    function useActiveOutputs() {
        target = []
        persist()
    }

    // camaras: un clic las manda de fondo, otro clic las quita
    function clickCamera(e: any, cam: any) {
        if ($outLocked || e?.ctrlKey || e?.metaKey) return
        const outs = destinationOutputs.length ? destinationOutputs : normalOutputs.slice(0, 1)
        const isActive = outs.some((a) => a.out?.background?.id === cam.id)
        outs.forEach((output) => {
            if (isActive) clearBackground(output.id)
            else setOutput("background", { name: cam.name, id: cam.id, cameraGroup: cam.group || cam.cameraGroup, type: "camera" }, false, output.id)
        })
    }

    function clearDestination() {
        if (!targetIds.length) return clearBackground()
        targetIds.forEach((id) => clearBackground(id))
    }

    function toggleCollapsed() {
        collapsed = !collapsed
        persist()
    }

    function changeThumbSize(e: any) {
        thumbSize = Number(e.target.value)
        persist()
    }

    // cambiar el alto arrastrando el borde superior
    let resizing: { startY: number; startHeight: number } | null = null
    function startResize(e: MouseEvent) {
        if (collapsed) return
        resizing = { startY: e.clientY, startHeight: height }
        startResizing("ns-resize")
    }
    function mousemove(e: MouseEvent) {
        if (!resizing) return
        const max = Math.round(window.innerHeight * 0.6)
        height = Math.min(max, Math.max(MIN_HEIGHT, resizing.startHeight + (resizing.startY - e.clientY)))
    }
    function mouseup() {
        if (!resizing) return
        resizing = null
        stopResizing()
        persist()
    }
    onDestroy(() => {
        if (resizing) stopResizing()
    })
</script>

<svelte:window on:mousemove={mousemove} on:mouseup={mouseup} />

<section class="backgroundStrip" style="{collapsed ? '' : `height: ${height}px;`}--thumb-size: {thumbSize}px;">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize" class:disabled={collapsed} on:mousedown={startResize}></div>

    <div class="bar">
        <span class="title">
            <Icon id="media" size={1.1} white />
            Fondos
        </span>

        {#if $proLayout}
            <span class="current">{$stripActiveTab === CAMERAS ? "Cámaras" : folderName($mediaFolders[$stripActiveTab]?.name || "")}</span>
        {/if}
        <div class="tabs" class:hidden={$proLayout}>
            {#each folders as folder (folder.id)}
                <button class:active={$stripActiveTab === folder.id} on:click={() => selectTab(folder.id)} title={folder.path}>
                    {folderName(folder.name)}
                </button>
            {/each}
            <button class:active={$stripActiveTab === CAMERAS} on:click={() => selectTab(CAMERAS)}>
                <Icon id="camera" size={0.95} white />
                Cámaras
            </button>
        </div>

        {#if normalOutputs.length}
            <div class="outputs" role="group" aria-label="Enviar a">
                <span class="label">Enviar a</span>
                <button class="chip" class:active={!targetIds.length} on:click={useActiveOutputs} title="Mandar a las salidas que estén activas arriba en la vista previa">Activas</button>
                {#each normalOutputs as output (output.id)}
                    <button class="chip" class:active={targetIds.includes(output.id)} aria-pressed={targetIds.includes(output.id)} on:click={() => toggleTarget(output.id)} title="Mandar a {output.name}">
                        <span class="dot" style="background-color: {output.color || 'var(--secondary)'};"></span>
                        {output.name}
                    </button>
                {/each}
            </div>
        {/if}

        <div class="actions">
            {#if !collapsed}
                <input type="range" min="90" max="300" step="10" value={thumbSize} on:input={changeThumbSize} title="Tamaño de miniaturas" aria-label="Tamaño de miniaturas" />
            {/if}
            <button on:click={clearDestination} title="Quitar el fondo de las salidas elegidas">
                <Icon id="clear" size={0.95} white />
                Limpiar fondo
            </button>
            <button on:click={toggleCollapsed} title={collapsed ? "Mostrar fondos" : "Ocultar fondos"} aria-label={collapsed ? "Mostrar fondos" : "Ocultar fondos"}>
                <Icon id={collapsed ? "arrow_up" : "arrow_down"} size={1.1} white />
            </button>
        </div>
    </div>

    {#if !collapsed}
        <div class="items">
            {#if $stripActiveTab === CAMERAS}
                <Cameras on:click={({ detail }) => clickCamera(detail.event, detail.cam)} />
            {:else if files.length}
                {#each files as file (file.path)}
                    <div class="item">
                        <MediaCard name={file.name} path={file.path} thumbnailPath={file.thumbnailPath || ""} type={getMediaType(getExtension(file.name))} active={$stripActiveTab} {shiftRange} targetOutputIds={targetIds} />
                    </div>
                {/each}
            {:else if !folders.length}
                <p class="empty">Agrega tus carpetas de fondos en la pestaña Multimedia de abajo y aparecerán aquí.</p>
            {:else}
                <p class="empty">Esta carpeta no tiene imágenes ni videos.</p>
            {/if}
        </div>
    {/if}
</section>

<style>
    .backgroundStrip {
        position: relative;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        background-color: var(--primary);
        border-top: 2px solid var(--primary-lighter);
        overflow: hidden;
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
    .resize.disabled {
        cursor: default;
    }

    .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 8px;
        min-height: 36px;
        padding: 4px 8px;
        background-color: var(--primary-darkest);
    }

    .title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 0.85em;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.8;
        white-space: nowrap;
    }

    .tabs {
        display: flex;
        gap: 2px;
        flex: 1 1 220px;
        min-width: 220px;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
    }

    button {
        display: flex;
        align-items: center;
        gap: 5px;
        height: 28px;
        padding: 0 10px;
        border: none;
        border-radius: 5px;
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: 0.85em;
        white-space: nowrap;
        cursor: pointer;
        opacity: 0.75;
    }
    button:hover {
        background-color: var(--hover);
        opacity: 1;
    }
    .tabs.hidden {
        display: none;
    }
    .current {
        flex: 1;
        font-size: 0.85em;
        font-weight: 600;
        color: var(--secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .tabs button.active {
        background-color: var(--primary-lighter);
        box-shadow: inset 0 -2px 0 var(--secondary);
        opacity: 1;
    }

    .outputs {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px;
    }
    .outputs .label {
        font-size: 0.75em;
        opacity: 0.55;
        margin-inline-end: 4px;
        white-space: nowrap;
    }
    .chip {
        height: 24px;
        padding: 0 8px;
        border: 1px solid var(--primary-lighter);
        border-radius: 12px;
        font-size: 0.8em;
    }
    .chip.active {
        border-color: var(--secondary);
        background-color: var(--primary-lighter);
        opacity: 1;
    }
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .actions {
        margin-inline-start: auto;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .actions input[type="range"] {
        width: 90px;
        accent-color: var(--secondary);
    }

    .items {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--thumb-size), 1fr));
        align-content: start;
        gap: 4px;
        padding: 6px;
        overflow-y: auto;
        background-color: var(--primary-darker);
    }

    /* las tarjetas de Multimedia y Camaras llenan su celda */
    .items :global(.main) {
        width: 100% !important;
    }

    .empty {
        grid-column: 1 / -1;
        padding: 16px;
        opacity: 0.5;
        text-align: center;
    }
</style>
