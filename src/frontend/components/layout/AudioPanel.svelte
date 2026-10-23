<script lang="ts">
    // Listas de audio a la derecha, debajo de la vista previa (modo estilo ProPresenter)
    import { drawerTabsData } from "../../stores"
    import Audio from "../drawer/audio/Audio.svelte"
    import Navigation from "../drawer/Navigation.svelte"
    import Icon from "../helpers/Icon.svelte"

    $: active = $drawerTabsData.audio?.activeSubTab || "all"
</script>

<section class="audioPanel">
    <div class="title">
        <Icon id="music" size={1} white />
        Audio
    </div>
    <div class="nav">
        <Navigation id="audio" />
    </div>
    <div class="list">
        <Audio {active} searchValue="" />
    </div>
</section>

<style>
    .audioPanel {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 220px;
        border-top: 2px solid var(--primary-lighter);
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
    .nav {
        display: flex;
        flex-direction: column;
        max-height: 35%;
        min-height: 60px;
        overflow-y: auto;
        border-bottom: 1px solid var(--primary-lighter);
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
