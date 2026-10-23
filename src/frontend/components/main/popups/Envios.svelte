<script lang="ts">
    // Panel de envios: muestra en un solo lugar a donde va cada salida
    // (pantalla, NDI, OMT, Blackmagic, transmision RTMP/WebRTC y navegador en la red local)
    import qrcode from "qrcode-generator"
    import { onMount } from "svelte"
    import { Main } from "../../../../types/IPC/Main"
    import { requestMain, sendMain } from "../../../IPC/main"
    import { activePage, activePopup, currentOutputSettings, disabledServers, maxConnections, outputs, ports, rtmpStatus, serverData, settingsTab, styles } from "../../../stores"
    import { toggleRemoteStream } from "../../../utils/common"
    import { keysToID, sortByName } from "../../helpers/array"
    import Icon from "../../helpers/Icon.svelte"
    import { checkWindowCapture, startRtmpStreaming, startStreaming, stopRtmpStreaming, stopStreaming } from "../../helpers/output"
    import { hasStreamableDestination } from "../../helpers/rtmpDestinations"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import MaterialDropdown from "../../inputs/MaterialDropdown.svelte"
    import MaterialToggleSwitch from "../../inputs/MaterialToggleSwitch.svelte"

    let ip = "localhost"
    onMount(async () => {
        ip = ((await requestMain(Main.IP)) || ["localhost"])[0]
    })

    $: outputList = sortByName(keysToID($outputs)).filter((a: any) => !a.isKeyOutput) as any[]

    // ---- navegador en la red local (OutputShow) ----
    $: browserEnabled = $disabledServers.output_stream === false
    $: browserOutputId = $serverData?.output_stream?.outputId && $outputs[$serverData.output_stream.outputId] ? $serverData.output_stream.outputId : outputList.find((a) => a.enabled && !a.stageOutput)?.id || ""
    $: browserPort = $ports.output_stream || 5513
    $: browserUrl = `http://${ip}:${browserPort}`

    function restartServers() {
        sendMain(Main.START, { ports: $ports, max: $maxConnections, disabled: $disabledServers, data: $serverData })
    }

    function toggleBrowser(value: boolean) {
        disabledServers.update((a) => {
            a.output_stream = !value
            return a
        })
        if (value) checkWindowCapture()
        restartServers()
        toggleRemoteStream()
    }

    function setBrowserOutput(id: string) {
        serverData.update((a) => {
            if (!a.output_stream) a.output_stream = {}
            a.output_stream.outputId = id
            return a
        })
        restartServers()
        toggleRemoteStream()
    }

    let qrImg = ""
    $: if (browserEnabled && ip !== "localhost") {
        const qr = qrcode(0, "L")
        qr.addData(browserUrl)
        qr.make()
        qrImg = qr.createImgTag(4, 4)
    }

    let copied = false
    function copyUrl() {
        navigator.clipboard?.writeText(browserUrl)
        copied = true
        setTimeout(() => (copied = false), 1500)
    }

    // ---- destinos de cada salida ----
    function getSends(output: any) {
        const list: { icon: string; label: string; detail?: string; live?: boolean }[] = []
        if (output.stageOutput) list.push({ icon: "stage", label: "Pantalla de escenario" })
        else if (!output.invisible) list.push({ icon: "screen", label: "Pantalla", detail: `${output.bounds?.width || 1920}×${output.bounds?.height || 1080}` })
        if (output.ndi) list.push({ icon: "ndi", label: "NDI", detail: (output.ndiData?.name || `FreeShow NDI - ${output.name}`) + (output.transparent ? " · transparente" : "") })
        if (output.omt) list.push({ icon: "omt", label: "OMT" })
        if (output.blackmagic) list.push({ icon: "blackmagic", label: "Blackmagic", detail: output.blackmagicData?.displayMode || "" })
        if (output.webrtc) list.push({ icon: "web", label: "WebRTC", detail: output.webrtcData?.url ? "configurado" : "sin URL", live: !!output.webrtcData?.streaming })
        if (output.rtmp) {
            const destinations = (output.rtmpData?.destinations || []).filter((d) => d.enabled && d.url)
            list.push({ icon: "record", label: "Transmisión RTMP", detail: destinations.length ? `${destinations.length} destino${destinations.length > 1 ? "s" : ""}` : "sin destino", live: !!output.rtmpData?.streaming })
        }
        if (browserEnabled && browserOutputId === output.id) list.push({ icon: "connection", label: "Navegador en la red", detail: browserUrl })
        return list
    }

    function rtmpState(outputId: string) {
        const states = Object.values($rtmpStatus[outputId] || {}) as any[]
        if (!states.length) return ""
        const live = states.filter((s) => s?.state === "live").length
        const errors = states.filter((s) => s?.state === "error").length
        if (errors) return `${live} en vivo · ${errors} con error`
        return `${live}/${states.length} en vivo`
    }

    function openSettings(id: string) {
        currentOutputSettings.set(id)
        settingsTab.set("display_settings")
        activePage.set("settings")
        activePopup.set(null)
    }

    $: liveCount = outputList.filter((o) => o.enabled && (o.rtmpData?.streaming || o.webrtcData?.streaming)).length

    function stopAllStreams() {
        outputList.forEach((o) => {
            if (o.rtmpData?.streaming) stopRtmpStreaming(o.id)
            if (o.webrtcData?.streaming) stopStreaming(o.id)
        })
    }
</script>

<div class="envios">
    <p class="intro">Cada salida usa su propio estilo y la puedes mandar a varios lugares a la vez, sin cambiar lo que se ve en el proyector.</p>

    <div class="summary">
        <span>{outputList.filter((o) => o.enabled).length} salidas activas</span>
        <span class:live={liveCount > 0}>{liveCount ? `● ${liveCount} transmitiendo` : "Sin transmisiones"}</span>
        {#if liveCount}
            <MaterialButton variant="outlined" icon="stop" on:click={stopAllStreams} red>
                <p>Detener transmisiones</p>
            </MaterialButton>
        {/if}
    </div>

    <div class="cards">
        {#each outputList as output (output.id)}
            {@const sends = getSends(output)}
            <article class="card" class:disabled={!output.enabled}>
                <header>
                    <span class="dot" style="background-color: {output.color || 'var(--secondary)'};"></span>
                    <h3>{output.name || "Salida"}</h3>
                    <span class="state">{output.enabled ? "Activa" : "Apagada"}</span>
                </header>

                {#if !output.stageOutput}
                    <p class="style">Estilo: {$styles[output.style || ""]?.name || "Ninguno"}</p>
                {/if}

                <ul>
                    {#each sends as item}
                        <li>
                            <Icon id={item.icon} size={1} white />
                            <span class="label">{item.label}</span>
                            {#if item.detail}<span class="detail">{item.detail}</span>{/if}
                            {#if item.live}<span class="badge">EN VIVO</span>{/if}
                        </li>
                    {/each}
                    {#if !sends.length}
                        <li class="empty">Sin destinos</li>
                    {/if}
                </ul>

                {#if output.rtmp && output.rtmpData?.streaming && rtmpState(output.id)}
                    <p class="style">{rtmpState(output.id)}</p>
                {/if}

                <div class="actions">
                    {#if output.enabled && output.rtmp && hasStreamableDestination(output.rtmpData)}
                        <MaterialButton variant="outlined" icon={output.rtmpData?.streaming ? "stop" : "record"} red={!!output.rtmpData?.streaming} on:click={() => (output.rtmpData?.streaming ? stopRtmpStreaming(output.id, true) : startRtmpStreaming(output.id))}>
                            <p>{output.rtmpData?.streaming ? "Detener RTMP" : "Iniciar RTMP"}</p>
                        </MaterialButton>
                    {/if}
                    {#if output.enabled && output.webrtc && output.webrtcData?.url}
                        <MaterialButton variant="outlined" icon={output.webrtcData?.streaming ? "stop" : "record"} red={!!output.webrtcData?.streaming} on:click={() => (output.webrtcData?.streaming ? stopStreaming(output.id, true) : startStreaming(output.id))}>
                            <p>{output.webrtcData?.streaming ? "Detener WebRTC" : "Iniciar WebRTC"}</p>
                        </MaterialButton>
                    {/if}
                    <MaterialButton variant="outlined" icon="options" on:click={() => openSettings(output.id)}>
                        <p>Configurar</p>
                    </MaterialButton>
                </div>
            </article>
        {/each}
    </div>

    <section class="browser">
        <h3><Icon id="connection" size={1.1} white /> Salida por navegador (TV, tableta o computadora en la misma red)</h3>
        <MaterialToggleSwitch label="Activar salida por navegador" checked={browserEnabled} defaultValue={false} on:change={(e) => toggleBrowser(e.detail)} />
        {#if browserEnabled}
            <MaterialDropdown label="Salida que se muestra" value={browserOutputId} options={outputList.filter((a) => !a.stageOutput).map((a) => ({ value: a.id, label: a.name }))} on:change={(e) => setBrowserOutput(e.detail)} />
            <div class="url">
                {#if qrImg}<div class="qr">{@html qrImg}</div>{/if}
                <div class="urlText">
                    <p>Abre esta dirección en cualquier navegador conectado a la misma red:</p>
                    <code>{browserUrl}</code>
                    <MaterialButton variant="outlined" icon="copy" on:click={copyUrl}>
                        <p>{copied ? "¡Copiado!" : "Copiar enlace"}</p>
                    </MaterialButton>
                </div>
            </div>
        {/if}
    </section>

    <p class="foot">Para agregar NDI, transmisión a YouTube/Facebook (RTMP) u otra pantalla a una salida, entra a <b>Configurar</b>. Para crear otra salida, usa el <b>+</b> en Ajustes → Salidas.</p>
</div>

<style>
    .envios {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: min(820px, 80vw);
    }
    .intro,
    .foot {
        opacity: 0.7;
        font-size: 0.9em;
    }

    .summary {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        font-size: 0.9em;
    }
    .summary .live {
        color: #ff5a5a;
        font-weight: 600;
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 10px;
    }
    .card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        border-radius: 8px;
        background-color: var(--primary-darker);
        border: 1px solid var(--primary-lighter);
    }
    .card.disabled {
        opacity: 0.55;
    }
    header {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    h3 {
        font-size: 1em;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .state {
        font-size: 0.75em;
        opacity: 0.6;
    }
    .style {
        font-size: 0.8em;
        opacity: 0.6;
    }

    ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0;
        margin: 0;
    }
    li {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85em;
        flex-wrap: wrap;
    }
    li .label {
        font-weight: 600;
    }
    li .detail {
        opacity: 0.6;
        font-size: 0.9em;
        word-break: break-all;
    }
    li.empty {
        opacity: 0.5;
    }
    .badge {
        background-color: #d93636;
        color: #ffffff;
        font-size: 0.7em;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: auto;
    }

    .browser {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: 10px;
        border-top: 1px solid var(--primary-lighter);
    }
    .url {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
    }
    .qr :global(img) {
        display: block;
        border-radius: 6px;
        background: white;
        padding: 6px;
    }
    .urlText {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.85em;
    }
    code {
        font-size: 1.1em;
        user-select: all;
        color: var(--secondary);
    }
</style>
