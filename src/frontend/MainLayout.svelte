<script lang="ts">
    import AiFloating from "./ai/components/floating/AiFloating.svelte"
    import { customActionActivation } from "./components/actions/actions"
    import DrawTabs from "./components/draw/DrawTabs.svelte"
    import Navigation from "./components/edit/Navigation.svelte"
    import LazyLoad from "./components/helpers/LazyLoad.svelte"
    import ProfileChangerMenu from "./components/main/ProfileChangerMenu.svelte"
    import Tipbar from "./components/main/Tipbar.svelte"
    import Top from "./components/main/Top.svelte"
    import Preview from "./components/output/preview/Preview.svelte"
    import SettingsTabs from "./components/settings/SettingsTabs.svelte"
    import Projects from "./components/show/Projects.svelte"
    import Show from "./components/show/Show.svelte"
    import ShowTools from "./components/show/ShowTools.svelte"
    import StageLayouts from "./components/stage/StageLayouts.svelte"
    import Resizeable from "./components/system/Resizeable.svelte"
    import Timeline from "./components/timeline/Timeline.svelte"
    import BackgroundStrip from "./components/backgrounds/BackgroundStrip.svelte"
    import AudioPanel from "./components/layout/AudioPanel.svelte"
    import CenterTabs from "./components/layout/CenterTabs.svelte"
    import LibraryPanel from "./components/layout/LibraryPanel.svelte"
    import MediaFoldersPanel from "./components/layout/MediaFoldersPanel.svelte"
    import ScripturePanel from "./components/layout/ScripturePanel.svelte"
    import { proCenterTab, proLayout, proProjectsCollapsed } from "./components/layout/proLayout"
    import Icon from "./components/helpers/Icon.svelte"
    import { activeEdit, activePage, activeProfile, activeProject, activeShow, activeStage, ai, currentWindow, editMode, focusMode, loaded, os, projectView, resized, showChangeProfileMenu, showsCache, special } from "./stores"
    import { DEFAULT_WIDTH } from "./utils/common"

    $: page = $activePage
    $: isWindows = !$currentWindow && $os.platform === "win32"

    let previousId = ""
    $: if ($activeShow?.id !== previousId) showOpened()
    function showOpened() {
        if (!$activeShow?.id || $activeShow?.type !== "show") return

        // allow show to actually open before triggering
        setTimeout(() => customActionActivation("show_opened"), 50)
        previousId = $activeShow?.id
    }
</script>

<div class="column">
    {#if !$focusMode}
        <Top {isWindows} />
    {/if}
    <div class="row">
        <Resizeable id="leftPanel">
            <div class="left">
                {#if page === "show"}
                    {#if $proLayout && !$focusMode}
                        <div class="projectsWrap" class:collapsed={$proProjectsCollapsed}>
                            <button class="collapseProjects" title={$proProjectsCollapsed ? "Mostrar proyectos" : "Minimizar proyectos"} aria-label={$proProjectsCollapsed ? "Mostrar proyectos" : "Minimizar proyectos"} aria-expanded={!$proProjectsCollapsed} on:click={() => proProjectsCollapsed.set(!$proProjectsCollapsed)}>
                                <Icon id={$proProjectsCollapsed ? "arrow_down" : "arrow_up"} size={1.1} white />
                            </button>
                            {#key $activeProfile}
                                <Projects />
                            {/key}
                        </div>
                        <LibraryPanel fill={$proProjectsCollapsed} />
                        <MediaFoldersPanel />
                    {:else}
                        {#key $activeProfile}
                            <Projects />
                        {/key}
                    {/if}
                {:else if page === "edit"}
                    <Navigation />
                {:else if page === "stage"}
                    <StageLayouts />
                {:else if page === "draw"}
                    <DrawTabs />
                {:else if page === "settings"}
                    <SettingsTabs />
                {/if}
            </div>
        </Resizeable>

        <div class="centerColumn">
        {#if $proLayout && page === "show" && !$focusMode}
            <CenterTabs />
        {/if}
        <div class="center">
            {#if page === "show"}
                {#if $focusMode}
                    <LazyLoad component={() => import("./components/show/focus/FocusMode.svelte")} show={$focusMode} />
                {:else if $proLayout && $proCenterTab === "scripture"}
                    <ScripturePanel />
                {:else}
                    <Show />
                {/if}
            {:else if page === "edit"}
                <LazyLoad component={() => import("./components/edit/Editor.svelte")} show={page === "edit"} />
            {:else if page === "draw"}
                <LazyLoad component={() => import("./components/draw/Slide.svelte")} show={page === "draw"} />
            {:else if page === "settings"}
                <LazyLoad component={() => import("./components/settings/Settings.svelte")} show={page === "settings"} />
            {:else if page === "stage"}
                <LazyLoad component={() => import("./components/stage/StageLayout.svelte")} show={page === "stage"} />
            {/if}
        </div>

        <!-- franja de fondos fija (estilo ProPresenter) -->
        {#if page === "show" && !$focusMode && $loaded}
            <BackgroundStrip />
        {/if}
        </div>

        <Resizeable id="rightPanel" let:width side="right">
            <div class="right" class:row={width > DEFAULT_WIDTH * 1.8}>
                <Preview />
                {#if page === "show"}
                    {#if $activeShow && ($activeShow.type === "show" || $activeShow.type === undefined) && !$focusMode}
                        <ShowTools />
                    {/if}
                    {#if $proLayout && !$focusMode}
                        <AudioPanel />
                    {/if}
                {:else if page === "edit"}
                    {#if $activeEdit.type === "media" || $activeEdit.type === "camera"}
                        <LazyLoad component={() => import("./components/edit/MediaTools.svelte")} show={$activeEdit.type === "media" || $activeEdit.type === "camera"} />
                    {:else if $activeEdit.type === "audio"}
                        <LazyLoad component={() => import("./components/edit/AudioTools.svelte")} show={$activeEdit.type === "audio"} />
                    {:else if $activeEdit.type === "effect"}
                        <LazyLoad component={() => import("./components/edit/EffectTools.svelte")} show={$activeEdit.type === "effect"} />
                    {:else if $activeEdit.type === "scene"}
                        <LazyLoad component={() => import("./components/edit/SceneTools.svelte")} show={$activeEdit.type === "scene"} />
                    {:else if $activeEdit.type === "overlay" || $activeEdit.type === "template" || $showsCache[$activeShow?.id || ""]}
                        {#if $focusMode || (($activeEdit.type || "show") === "show" && $editMode !== "default")}
                            <!-- show nothing -->
                        {:else}
                            <LazyLoad component={() => import("./components/edit/EditTools.svelte")} show={!$focusMode} />
                        {/if}
                    {/if}
                {:else if page === "draw"}
                    <LazyLoad component={() => import("./components/draw/DrawSettings.svelte")} show={page === "draw"} />
                {:else if page === "stage" && $activeStage.id}
                    <LazyLoad component={() => import("./components/stage/StageTools.svelte")} show={page === "stage" && !!$activeStage.id} />
                {:else if page === "settings"}
                    <LazyLoad component={() => import("./components/settings/SettingsTools.svelte")} show={page === "settings"} />
                {/if}
            </div>
        </Resizeable>
    </div>

    {#if page === "show" && $special.projectTimelineActive && $activeProject && !$projectView}
        <Resizeable id="project_timeline" side="bottom" maxWidth={DEFAULT_WIDTH} minWidth={40}>
            {#key $activeProject}
                <Timeline type="project" isClosed={$resized.project_timeline <= 40} />
            {/key}
        </Resizeable>
    {/if}

    {#if $loaded && (page === "show" || page === "edit")}
        <LazyLoad component={() => import("./components/drawer/Drawer.svelte")} show={$loaded && (page === "show" || page === "edit")} />
    {/if}

    {#if $showChangeProfileMenu && $activeProfile !== null}
        <ProfileChangerMenu />
    {/if}

    {#if $ai.enabled}
        <AiFloating />
    {/if}

    <Tipbar />
</div>

<style>
    .column,
    .row {
        display: flex;
        justify-content: space-between;
        /* background: var(--primary-darker); */
    }

    .column {
        flex-direction: column;
        height: 100%;
    }

    .row {
        flex: 1;
        overflow: hidden;
    }

    .projectsWrap {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
    }
    .projectsWrap.collapsed {
        flex: 0 0 38px;
    }
    .collapseProjects {
        position: absolute;
        top: 6px;
        right: 34px;
        z-index: 300;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: none;
        border-radius: 5px;
        background-color: var(--primary-darkest);
        cursor: pointer;
        opacity: 0.85;
    }
    .collapseProjects:hover {
        background-color: var(--hover);
        opacity: 1;
    }

    .centerColumn {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        overflow: hidden;
    }

    .center {
        position: relative;

        flex: 1;
        min-height: 0;
        background-color: var(--primary-darker);
        overflow: auto;

        scroll-behavior: smooth;
    }

    .left,
    .right {
        position: relative;

        display: flex;
        flex-direction: column;
        flex: 1;
        justify-content: space-between;
        overflow: hidden;
    }
    .right.row {
        flex-direction: row-reverse;
    }

    .right :global(.border) {
        border-top: 2px solid var(--primary-lighter);
    }
    .right.row :global(.border) {
        border: none;
        border-inline-end: 2px solid var(--primary-lighter);
        min-width: 50%;
    }

    .right.row :global(.textfield .picker) {
        left: unset !important;
        right: 0;
    }
</style>
