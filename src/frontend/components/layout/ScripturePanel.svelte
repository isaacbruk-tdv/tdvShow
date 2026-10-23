<script lang="ts">
    // La Biblia dentro del area central (modo estilo ProPresenter)
    import { drawerTabsData } from "../../stores"
    import Scripture from "../drawer/bible/Scripture.svelte"
    import Info from "../drawer/info/Info.svelte"
    import Navigation from "../drawer/Navigation.svelte"
    import Icon from "../helpers/Icon.svelte"

    let searchValue = ""
    $: active = $drawerTabsData.scripture?.activeSubTab || null
</script>

<div class="scripturePanel">
    <div class="searchBar">
        <Icon id="search" size={1.1} white />
        <input class="search edit" type="text" placeholder="Buscar cita o texto (ej. Juan 3:16)" bind:value={searchValue} />
        {#if searchValue}
            <button on:click={() => (searchValue = "")} aria-label="Limpiar búsqueda"><Icon id="clear" size={1} white /></button>
        {/if}
    </div>
    <div class="row">
        <div class="nav">
            <Navigation id="scripture" />
        </div>
        <div class="content">
            <Scripture {active} bind:searchValue />
        </div>
        <div class="info">
            <Info id="scripture" />
        </div>
    </div>
</div>

<style>
    .scripturePanel {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
    }
    .searchBar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background-color: var(--primary);
        border-bottom: 1px solid var(--primary-lighter);
    }
    .searchBar input {
        flex: 1;
        height: 32px;
        padding: 0 10px;
        border: none;
        border-radius: 6px;
        background-color: rgb(0 0 0 / 0.25);
        color: var(--text);
        font-family: inherit;
        font-size: 1em;
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
        padding: 4px;
    }
    .row {
        flex: 1;
        display: flex;
        min-height: 0;
    }
    .nav {
        width: 200px;
        min-width: 160px;
        display: flex;
        flex-direction: column;
        background-color: var(--primary);
        border-right: 1px solid var(--primary-lighter);
        overflow: hidden;
    }
    .content {
        position: relative;
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        background-color: var(--primary-darker);
    }
    .info {
        width: 280px;
        min-width: 220px;
        display: flex;
        flex-direction: column;
        background-color: var(--primary);
        border-left: 1px solid var(--primary-lighter);
        overflow: hidden;
    }
    @media screen and (max-width: 1200px) {
        .info {
            display: none;
        }
    }
</style>
