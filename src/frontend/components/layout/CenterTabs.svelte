<script lang="ts">
    import Icon from "../helpers/Icon.svelte"
    import { proCenterTab } from "./proLayout"
</script>

<div class="centerTabs" role="tablist" aria-label="Contenido">
    <button role="tab" aria-selected={$proCenterTab === "show"} class:active={$proCenterTab === "show"} on:click={() => proCenterTab.set("show")}>
        <Icon id="slide" size={1} white />
        Presentación
    </button>
    <button role="tab" aria-selected={$proCenterTab === "scripture"} class:active={$proCenterTab === "scripture"} on:click={() => proCenterTab.set("scripture")}>
        <Icon id="scripture" size={1} white />
        Biblia
    </button>
</div>

<style>
    .centerTabs {
        display: flex;
        gap: 2px;
        padding: 4px 8px;
        background-color: var(--primary-darkest);
        border-bottom: 1px solid var(--primary-lighter);
        flex-shrink: 0;
    }
    button {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 30px;
        padding: 0 14px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: 0.9em;
        cursor: pointer;
        opacity: 0.7;
    }
    button:hover {
        background-color: var(--hover);
        opacity: 1;
    }
    button.active {
        background-color: var(--primary-lighter);
        box-shadow: inset 0 -2px 0 var(--secondary);
        opacity: 1;
        font-weight: 600;
    }
</style>
