<script lang="ts">
    // Administrador de presentaciones: buscar, filtrar, seleccionar varias y
    // eliminarlas o moverlas de categoria de una sola vez.
    import { activePopup, activeShow, categories, popupData, selected, shows } from "../../../stores"
    import { translateText } from "../../../utils/language"
    import { keysToID, sortByName } from "../../helpers/array"
    import { historyAwait } from "../../helpers/history"
    import Icon from "../../helpers/Icon.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"

    let search = ""
    let category = "all"
    let sortBy: "name" | "modified" | "created" | "used" = "name"
    let checked: { [id: string]: boolean } = {}
    let moveTo = ""

    const catName = (id: string | null | undefined) => {
        if (!id || !$categories[id]) return "Sin categoría"
        return translateText($categories[id].name || "") || $categories[id].name || "Sin categoría"
    }

    $: categoryList = sortByName(keysToID($categories).map((a) => ({ ...a, name: catName(a.id) })))

    const normalize = (s: string) =>
        (s || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")

    $: allShows = keysToID($shows)
    $: filtered = allShows
        .filter((s) => {
            if (category === "unlabeled" && s.category && $categories[s.category]) return false
            if (category !== "all" && category !== "unlabeled" && s.category !== category) return false
            if (search.trim() && !normalize(s.name).includes(normalize(search.trim()))) return false
            return true
        })
        .sort((a, b) => {
            if (sortBy === "name") return (a.name || "").localeCompare(b.name || "", undefined, { numeric: true })
            const ta = (a.timestamps as any)?.[sortBy] || 0
            const tb = (b.timestamps as any)?.[sortBy] || 0
            return tb - ta
        })

    $: selectedIds = Object.keys(checked).filter((id) => checked[id] && $shows[id])
    $: visibleSelected = filtered.filter((s) => checked[s.id]).length
    $: allVisibleChecked = filtered.length > 0 && visibleSelected === filtered.length
    $: lockedSelected = selectedIds.filter((id) => $shows[id]?.locked).length

    function toggleAllVisible() {
        const value = !allVisibleChecked
        filtered.forEach((s) => (checked[s.id] = value))
        checked = checked
    }
    function clearSelection() {
        checked = {}
    }

    // seleccionar con Shift para rangos
    let lastIndex: number | null = null
    function clickRow(e: MouseEvent, index: number, id: string) {
        if (e.shiftKey && lastIndex !== null) {
            const [from, to] = [Math.min(lastIndex, index), Math.max(lastIndex, index)]
            const value = !checked[id]
            for (let i = from; i <= to; i++) checked[filtered[i].id] = value
        } else {
            checked[id] = !checked[id]
        }
        checked = checked
        lastIndex = index
    }

    function formatDate(time: number | null | undefined) {
        if (!time) return "—"
        return new Date(time).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    }

    function deleteSelected() {
        if (!selectedIds.length) return
        // usa la confirmacion normal de FreeShow (muestra la lista antes de borrar)
        selected.set({ id: "show_drawer", data: selectedIds.map((id) => ({ id })) })
        popupData.set({})
        activePopup.set("delete_show")
    }

    function moveSelected() {
        if (!selectedIds.length || !moveTo) return
        const data = moveTo === "unlabeled" ? null : moveTo
        const h: any = { id: "SHOWS", newData: { replace: true, data: selectedIds.map((id) => ({ show: { category: data }, id })) }, location: { page: "drawer" } }
        historyAwait(selectedIds, h)
        moveTo = ""
    }

    function openShow(id: string) {
        activeShow.set({ id, type: "show" })
        activePopup.set(null)
    }
</script>

<div class="manager">
    <div class="toolbar">
        <div class="search">
            <Icon id="search" size={1} white />
            <input type="text" placeholder="Buscar por nombre" bind:value={search} aria-label="Buscar presentación" />
        </div>
        <label>
            Categoría
            <select bind:value={category}>
                <option value="all">Todas</option>
                <option value="unlabeled">Sin categoría</option>
                {#each categoryList as cat (cat.id)}
                    <option value={cat.id}>{cat.name}</option>
                {/each}
            </select>
        </label>
        <label>
            Ordenar
            <select bind:value={sortBy}>
                <option value="name">Nombre</option>
                <option value="modified">Modificado</option>
                <option value="created">Creado</option>
                <option value="used">Usado</option>
            </select>
        </label>
    </div>

    <div class="summary">
        <span>{filtered.length} de {allShows.length} presentaciones</span>
        <span class="sel">{selectedIds.length} seleccionadas</span>
        {#if selectedIds.length}
            <button class="link" on:click={clearSelection}>Quitar selección</button>
        {/if}
        <span class="tip">Tip: Shift + clic selecciona un rango</span>
    </div>

    <div class="table" role="table" aria-label="Presentaciones">
        <div class="row head" role="row">
            <span class="check" role="columnheader">
                <input type="checkbox" checked={allVisibleChecked} indeterminate={visibleSelected > 0 && !allVisibleChecked} on:change={toggleAllVisible} aria-label="Seleccionar todas las visibles" />
            </span>
            <span class="name" role="columnheader">Nombre</span>
            <span class="cat" role="columnheader">Categoría</span>
            <span class="date" role="columnheader">Modificado</span>
            <span class="date" role="columnheader">Usado</span>
            <span class="open" role="columnheader"></span>
        </div>
        <div class="body">
            {#each filtered as show, i (show.id)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="row" class:checked={checked[show.id]} role="row" on:click={(e) => clickRow(e, i, show.id)}>
                    <span class="check" role="cell">
                        <input type="checkbox" checked={!!checked[show.id]} on:click|stopPropagation={(e) => clickRow(e, i, show.id)} aria-label="Seleccionar {show.name}" />
                    </span>
                    <span class="name" role="cell" title={show.name}>
                        {#if show.locked}<Icon id="locked" size={0.8} white />{/if}
                        {show.name || "Sin nombre"}
                    </span>
                    <span class="cat" role="cell">{catName(show.category)}</span>
                    <span class="date" role="cell">{formatDate(show.timestamps?.modified)}</span>
                    <span class="date" role="cell">{formatDate(show.timestamps?.used)}</span>
                    <span class="open" role="cell">
                        <button class="link" on:click|stopPropagation={() => openShow(show.id)}>Abrir</button>
                    </span>
                </div>
            {:else}
                <p class="empty">No hay presentaciones con ese filtro.</p>
            {/each}
        </div>
    </div>

    <div class="actions">
        <div class="move">
            <select bind:value={moveTo} disabled={!selectedIds.length} aria-label="Categoría destino">
                <option value="">Mover a categoría…</option>
                <option value="unlabeled">Sin categoría</option>
                {#each categoryList as cat (cat.id)}
                    <option value={cat.id}>{cat.name}</option>
                {/each}
            </select>
            <MaterialButton variant="outlined" icon="check" disabled={!selectedIds.length || !moveTo} on:click={moveSelected}>
                <p>Mover</p>
            </MaterialButton>
        </div>
        <MaterialButton variant="contained" icon="delete" disabled={!selectedIds.length} red on:click={deleteSelected}>
            <p>Eliminar {selectedIds.length || ""}</p>
        </MaterialButton>
    </div>
    {#if lockedSelected}
        <p class="note">{lockedSelected} de las seleccionadas están bloqueadas y no se eliminarán.</p>
    {/if}
    <p class="note warn">Antes de borrar verás la lista para confirmar. Al guardarse, los archivos se eliminan <b>definitivamente</b>: si vas a borrar muchas, haz antes un respaldo en Ajustes → Archivos.</p>
</div>

<style>
    .manager {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: min(900px, 85vw);
    }
    .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: flex-end;
    }
    .search {
        flex: 1 1 260px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 10px;
        height: 36px;
        border-radius: 6px;
        background-color: var(--primary-darker);
    }
    .search input {
        flex: 1;
        border: none;
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: 1em;
        outline: none;
    }
    label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 0.75em;
        opacity: 0.85;
    }
    select {
        height: 36px;
        padding: 0 8px;
        border-radius: 6px;
        border: 1px solid var(--primary-lighter);
        background-color: var(--primary-darker);
        color: var(--text);
        font-family: inherit;
        font-size: 1.15em;
    }
    .summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        font-size: 0.85em;
        opacity: 0.85;
    }
    .summary .sel {
        color: var(--secondary);
        font-weight: 600;
    }
    .summary .tip {
        margin-inline-start: auto;
        opacity: 0.6;
    }
    .link {
        border: none;
        background: transparent;
        color: var(--secondary);
        font-family: inherit;
        font-size: 1em;
        cursor: pointer;
        padding: 2px 4px;
        text-decoration: underline;
    }

    .table {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--primary-lighter);
        border-radius: 6px;
        overflow: hidden;
    }
    .body {
        max-height: 50vh;
        overflow-y: auto;
    }
    .row {
        display: grid;
        grid-template-columns: 36px minmax(0, 3fr) minmax(0, 1.4fr) 110px 110px 60px;
        align-items: center;
        min-height: 34px;
        padding: 0 6px;
        font-size: 0.9em;
        border-bottom: 1px solid var(--primary-darker);
        cursor: pointer;
    }
    .row:hover {
        background-color: var(--hover);
    }
    .row.checked {
        background-color: rgb(255 255 255 / 0.06);
        box-shadow: inset 3px 0 0 var(--secondary);
    }
    .row.head {
        cursor: default;
        font-size: 0.75em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.75;
        background-color: var(--primary-darkest);
    }
    .row span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .name {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .cat,
    .date {
        opacity: 0.7;
    }
    .check input {
        width: 16px;
        height: 16px;
        accent-color: var(--secondary);
        cursor: pointer;
    }
    .empty {
        padding: 20px;
        text-align: center;
        opacity: 0.6;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }
    .move {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .note {
        font-size: 0.8em;
        opacity: 0.6;
    }
    .note.warn {
        opacity: 0.85;
        color: #ffb4a8;
    }
</style>
