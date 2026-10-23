<script lang="ts">
    // Carpetas de fondos al fondo de la columna izquierda (como "MEDIA" en ProPresenter).
    // Elegir una carpeta cambia lo que muestra la franja de Fondos.
    import { mediaFolders } from "../../stores"
    import { getFolderName, STRIP_CAMERAS, stripActiveTab } from "../backgrounds/stripState"
    import { keysToID } from "../helpers/array"
    import Icon from "../helpers/Icon.svelte"

    $: folders = keysToID($mediaFolders).filter((a) => a.path)
</script>

<section class="mediaFolders">
    <div class="title">
        <Icon id="media" size={1} white />
        Media
    </div>
    <div class="list" role="listbox" aria-label="Carpetas de fondos">
        {#each folders as folder (folder.id)}
            <button role="option" aria-selected={$stripActiveTab === folder.id} class:active={$stripActiveTab === folder.id} title={folder.path} on:click={() => stripActiveTab.set(folder.id)}>
                <Icon id="folder" size={0.95} white={$stripActiveTab !== folder.id} />
                <span>{getFolderName(folder.name)}</span>
            </button>
        {/each}
        <button role="option" aria-selected={$stripActiveTab === STRIP_CAMERAS} class:active={$stripActiveTab === STRIP_CAMERAS} on:click={() => stripActiveTab.set(STRIP_CAMERAS)}>
            <Icon id="camera" size={0.95} white={$stripActiveTab !== STRIP_CAMERAS} />
            <span>Cámaras</span>
        </button>
    </div>
</section>

<style>
    .mediaFolders {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        max-height: 25%;
        min-height: 90px;
        border-top: 2px solid var(--primary-lighter);
        background-color: var(--primary);
        overflow: hidden;
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
    .list {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        padding: 4px;
    }
    button {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 30px;
        padding: 0 10px;
        border: none;
        border-radius: 5px;
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: 0.9em;
        text-align: left;
        cursor: pointer;
        opacity: 0.8;
    }
    button span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    button:hover {
        background-color: var(--hover);
        opacity: 1;
    }
    button.active {
        background-color: var(--primary-lighter);
        box-shadow: inset 3px 0 0 var(--secondary);
        opacity: 1;
        font-weight: 600;
    }
</style>
