<script lang="ts">
    // Sesiones guardadas: cargar, actualizar, renombrar, eliminar, exportar e importar
    import { special } from "../../../stores"
    import { keysToID } from "../../helpers/array"
    import Icon from "../../helpers/Icon.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import { applySession, DEFAULT_INCLUDES, deleteSession, exportSession, importSessionFile, renameSession, saveNewSession, updateSession, type SessionIncludes } from "../../sessions/sessions"

    $: sessions = keysToID($special.sessions || {}).sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""))
    $: currentId = $special.currentSession || ""

    // nueva sesion
    let newName = ""
    let newNotes = ""
    let includes: SessionIncludes = { ...DEFAULT_INCLUDES }
    function createSession() {
        if (!newName.trim()) return
        saveNewSession(newName, includes, newNotes)
        newName = ""
        newNotes = ""
        includes = { ...DEFAULT_INCLUDES }
    }

    // confirmaciones simples dentro de la ventana
    let confirm: { id: string; action: "load" | "update" | "delete" } | null = null
    function ask(id: string, action: "load" | "update" | "delete") {
        confirm = { id, action }
    }
    function doConfirm() {
        if (!confirm) return
        if (confirm.action === "load") applySession(confirm.id)
        else if (confirm.action === "update") updateSession(confirm.id)
        else if (confirm.action === "delete") deleteSession(confirm.id)
        confirm = null
    }

    let renaming = ""
    let renameValue = ""
    function startRename(session: any) {
        renaming = session.id
        renameValue = session.name
    }
    function finishRename() {
        if (renaming) renameSession(renaming, renameValue)
        renaming = ""
    }

    function summary(session: any) {
        const parts: string[] = []
        const outs = Object.values(session.data?.outputs || {}) as any[]
        if (session.includes?.outputs) {
            const normal = outs.filter((o) => !o.stageOutput && o.enabled).length
            const stage = outs.filter((o) => o.stageOutput && o.enabled).length
            parts.push(`${normal} salida${normal === 1 ? "" : "s"}${stage ? ` + ${stage} escenario` : ""}`)
            const extras: string[] = []
            if (outs.some((o) => o.ndi)) extras.push("NDI")
            if (outs.some((o) => o.rtmp)) extras.push("RTMP")
            if (outs.some((o) => o.mapping?.enabled)) extras.push("mapeo")
            if (outs.some((o) => o.blending?.left || o.blending?.right)) extras.push("mezcla de bordes")
            if (extras.length) parts.push(extras.join(", "))
        }
        if (session.includes?.styles) parts.push(`${Object.keys(session.data?.styles || {}).length} estilos`)
        if (session.includes?.mediaFolders) parts.push(`${Object.keys(session.data?.mediaFolders || {}).length} carpetas`)
        if (session.includes?.layout) parts.push(session.data?.layout?.pro ? "diseño ProPresenter" : "diseño clásico")
        return parts.join(" · ")
    }

    const formatDate = (t: number) => (t ? new Date(t).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "")

    let fileInput: HTMLInputElement | undefined
    async function onImport(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) await importSessionFile(file)
        if (fileInput) fileInput.value = ""
    }

    const confirmText = {
        load: "Se cerrarán las ventanas de salida y se aplicará esta configuración. Lo que esté en pantalla se limpiará. ¿Cargar?",
        update: "Se reemplazará lo guardado en esta sesión por la configuración actual. ¿Actualizar?",
        delete: "Se eliminará esta sesión guardada (tu configuración actual no cambia). ¿Eliminar?"
    }
</script>

<div class="sessions">
    <p class="intro">Guarda tu configuración de salidas, estilos, carpetas de fondos y diseño como una sesión (por ejemplo, <b>TDV · 3 pantallas</b>) y cárgala cuando estés en ese lugar.</p>

    {#if confirm}
        <div class="confirm" role="alertdialog" aria-label="Confirmar">
            <p><b>{$special.sessions?.[confirm.id]?.name}</b>: {confirmText[confirm.action]}</p>
            <div class="row">
                <MaterialButton variant="outlined" on:click={() => (confirm = null)}><p>Cancelar</p></MaterialButton>
                <MaterialButton variant="contained" red={confirm.action === "delete"} on:click={doConfirm}>
                    <p>{confirm.action === "load" ? "Cargar" : confirm.action === "update" ? "Actualizar" : "Eliminar"}</p>
                </MaterialButton>
            </div>
        </div>
    {/if}

    <div class="list">
        {#each sessions as session (session.id)}
            <article class="card" class:current={currentId === session.id}>
                <div class="info">
                    {#if renaming === session.id}
                        <input class="rename" type="text" bind:value={renameValue} on:keydown={(e) => e.key === "Enter" && finishRename()} on:blur={finishRename} aria-label="Nuevo nombre" />
                    {:else}
                        <h3>
                            {session.name}
                            {#if currentId === session.id}<span class="badge">En uso</span>{/if}
                        </h3>
                    {/if}
                    <p class="meta">{summary(session)}</p>
                    {#if session.notes}<p class="notes">{session.notes}</p>{/if}
                    <p class="date">Actualizada: {formatDate(session.updatedAt)}</p>
                </div>
                <div class="buttons">
                    <MaterialButton variant="contained" icon="play" on:click={() => ask(session.id, "load")}><p>Cargar</p></MaterialButton>
                    <MaterialButton variant="outlined" icon="save" title="Guardar la configuración actual en esta sesión" on:click={() => ask(session.id, "update")}><p>Actualizar</p></MaterialButton>
                    <MaterialButton icon="rename" title="Renombrar" on:click={() => startRename(session)} />
                    <MaterialButton icon="export" title="Exportar a archivo" on:click={() => exportSession(session.id)} />
                    <MaterialButton icon="delete" title="Eliminar sesión" on:click={() => ask(session.id, "delete")} />
                </div>
            </article>
        {:else}
            <p class="empty">Aún no tienes sesiones guardadas. Configura tus salidas como las usas en un lugar y guárdalas abajo.</p>
        {/each}
    </div>

    <section class="new">
        <h3><Icon id="add" size={1} white /> Guardar la configuración actual como sesión nueva</h3>
        <div class="row wrap">
            <input type="text" placeholder="Nombre (ej. TDV · 3 pantallas)" bind:value={newName} on:keydown={(e) => e.key === "Enter" && createSession()} aria-label="Nombre de la sesión" />
            <input type="text" placeholder="Notas (opcional)" bind:value={newNotes} aria-label="Notas" />
        </div>
        <div class="row wrap checks">
            <label><input type="checkbox" bind:checked={includes.outputs} /> Salidas y pantallas</label>
            <label><input type="checkbox" bind:checked={includes.styles} /> Estilos</label>
            <label><input type="checkbox" bind:checked={includes.mediaFolders} /> Carpetas de fondos</label>
            <label><input type="checkbox" bind:checked={includes.layout} /> Diseño de la interfaz</label>
        </div>
        <div class="row">
            <MaterialButton variant="contained" icon="save" disabled={!newName.trim() || !Object.values(includes).some(Boolean)} on:click={createSession}><p>Guardar sesión</p></MaterialButton>
            <MaterialButton variant="outlined" icon="import" on:click={() => fileInput?.click()}><p>Importar sesión…</p></MaterialButton>
            <input bind:this={fileInput} type="file" accept=".json,application/json" style="display: none;" on:change={onImport} />
        </div>
        <p class="note">"Salidas y pantallas" incluye posición de cada pantalla, estilo por salida, mapeo y patrón de prueba con logo, recorte, mezcla de bordes, NDI y destinos de transmisión. Las rutas de carpetas y logos deben existir en esta computadora.</p>
    </section>
</div>

<style>
    .sessions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: min(760px, 85vw);
    }
    .intro,
    .note {
        font-size: 0.85em;
        opacity: 0.7;
    }
    .confirm {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--secondary);
        background-color: var(--primary-darker);
    }
    .list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 45vh;
        overflow-y: auto;
    }
    .card {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 10px;
        padding: 12px;
        border-radius: 8px;
        background-color: var(--primary-darker);
        border: 1px solid var(--primary-lighter);
    }
    .card.current {
        border-color: var(--secondary);
    }
    .info {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 220px;
        flex: 1;
    }
    h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.05em;
    }
    .badge {
        font-size: 0.65em;
        padding: 2px 8px;
        border-radius: 10px;
        background-color: var(--secondary);
        color: var(--secondary-text);
    }
    .meta {
        font-size: 0.85em;
        opacity: 0.8;
    }
    .notes {
        font-size: 0.85em;
        font-style: italic;
        opacity: 0.7;
    }
    .date {
        font-size: 0.75em;
        opacity: 0.5;
    }
    .buttons {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
    }
    .empty {
        padding: 16px;
        text-align: center;
        opacity: 0.6;
    }
    .new {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--primary-lighter);
    }
    .new h3 {
        font-size: 0.95em;
    }
    .row {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .row.wrap {
        flex-wrap: wrap;
    }
    .new input[type="text"],
    .rename {
        flex: 1 1 220px;
        height: 36px;
        padding: 0 10px;
        border-radius: 6px;
        border: 1px solid var(--primary-lighter);
        background-color: var(--primary-darker);
        color: var(--text);
        font-family: inherit;
        font-size: 1em;
    }
    .checks label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9em;
        cursor: pointer;
    }
    .checks input {
        width: 16px;
        height: 16px;
        accent-color: var(--secondary);
    }
</style>
