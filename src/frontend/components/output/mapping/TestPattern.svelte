<script lang="ts">
    // Patron de prueba para alinear proyectores (estilo Resolume), con logo/nombre de la iglesia
    import { onDestroy, onMount } from "svelte"
    import { encodeFilePath } from "../../helpers/media"

    export let name = ""
    export let color = "#4fb3ff"
    export let index = 1
    export let width = 1920
    export let height = 1080
    export let logo = ""
    export let label = ""

    $: w = Math.max(16, Math.round(width || 1920))
    $: h = Math.max(9, Math.round(height || 1080))
    $: unit = Math.min(w, h)
    $: cell = Math.max(20, Math.round(unit / 9))
    $: radius = Math.round(unit * 0.44)
    $: badge = Math.round(unit * 0.045)
    $: font = Math.round(unit * 0.032)

    const bars = ["#ffffff", "#ffff00", "#00ffff", "#00ff00", "#ff00ff", "#ff0000", "#0000ff", "#000000"]
    const grays = Array.from({ length: 11 }, (_, i) => {
        const v = Math.round(255 - i * 25.5)
        return `rgb(${v}, ${v}, ${v})`
    })

    // reloj en vivo
    let time = ""
    let timer: NodeJS.Timeout | null = null
    function tick() {
        const d = new Date()
        const p = (n: number) => String(n).padStart(2, "0")
        time = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    }
    onMount(() => {
        tick()
        timer = setInterval(tick, 1000)
    })
    onDestroy(() => {
        if (timer) clearInterval(timer)
    })

    $: cornerLabels = [
        { n: 1, x: badge * 1.4, y: badge * 1.4, text: "0, 0", anchor: "start" },
        { n: 2, x: w - badge * 1.4, y: badge * 1.4, text: `${w}, 0`, anchor: "end" },
        { n: 3, x: w - badge * 1.4, y: h - badge * 1.4, text: `${w}, ${h}`, anchor: "end" },
        { n: 4, x: badge * 1.4, y: h - badge * 1.4, text: `0, ${h}`, anchor: "start" }
    ]

    // bloque central
    $: boxW = Math.round(unit * 0.62)
    $: boxH = Math.round(unit * 0.5)
    $: boxX = Math.round((w - boxW) / 2)
    $: boxY = Math.round(h / 2 - boxH * 0.62)
    $: logoH = Math.round(boxH * 0.3)
    $: barsW = Math.round(unit * 0.62)
    $: barsX = Math.round((w - barsW) / 2)
    $: barsY = Math.round(h / 2 + unit * 0.22)
    $: sideW = Math.round(unit * 0.07)
    $: sideH = Math.round(unit * 0.55)
    $: sideY = Math.round((h - sideH) / 2)
</script>

<div class="testPattern">
    <svg viewBox="0 0 {w} {h}" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
        <defs>
            <pattern id="tp-checker" width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse">
                <rect width={cell * 2} height={cell * 2} fill="#2c2c2c" />
                <rect width={cell} height={cell} fill="#3d3d3d" />
                <rect x={cell} y={cell} width={cell} height={cell} fill="#3d3d3d" />
            </pattern>
            <linearGradient id="tp-hue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stop-color="#ff0000" />
                <stop offset="0.17" stop-color="#ffff00" />
                <stop offset="0.33" stop-color="#00ff00" />
                <stop offset="0.5" stop-color="#00ffff" />
                <stop offset="0.67" stop-color="#0000ff" />
                <stop offset="0.83" stop-color="#ff00ff" />
                <stop offset="1" stop-color="#ff0000" />
            </linearGradient>
            <linearGradient id="tp-ramp" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stop-color="#000000" />
                <stop offset="1" stop-color="#ffffff" />
            </linearGradient>
        </defs>

        <!-- cuadricula -->
        <rect width={w} height={h} fill="url(#tp-checker)" />

        <!-- diagonales, cruz central y circulo -->
        <path d="M0,0L{w},{h}M{w},0L0,{h}" stroke="#ffffff" stroke-opacity="0.45" stroke-width={Math.max(1, unit / 600)} fill="none" />
        <path d="M{w / 2},0L{w / 2},{h}M0,{h / 2}L{w},{h / 2}" stroke="#ffffff" stroke-opacity="0.65" stroke-width={Math.max(1, unit / 600)} fill="none" />
        <circle cx={w / 2} cy={h / 2} r={radius} stroke="#ffffff" stroke-opacity="0.85" stroke-width={Math.max(2, unit / 350)} fill="none" />
        <circle cx={w / 2} cy={h / 2} r={unit * 0.04} stroke="#ffffff" stroke-opacity="0.6" stroke-width={Math.max(1, unit / 600)} fill="none" />

        <!-- borde con el color de la salida -->
        <rect x={unit / 300} y={unit / 300} width={w - unit / 150} height={h - unit / 150} stroke={color || "#4fb3ff"} stroke-width={unit / 150} fill="none" />

        <!-- barras laterales: color y grises -->
        <rect x={unit * 0.06} y={sideY} width={sideW} height={sideH} fill="url(#tp-hue)" stroke="#ffffff" stroke-width="2" />
        {#each grays as gray, i}
            <rect x={w - unit * 0.06 - sideW} y={sideY + (sideH / grays.length) * i} width={sideW} height={sideH / grays.length + 0.5} fill={gray} />
        {/each}
        <rect x={w - unit * 0.06 - sideW} y={sideY} width={sideW} height={sideH} fill="none" stroke="#ffffff" stroke-width="2" />

        <!-- esquinas numeradas -->
        {#each cornerLabels as c}
            <circle cx={c.anchor === "start" ? c.x : c.x} cy={c.y} r={badge} fill={color || "#4fb3ff"} />
            <text x={c.x} y={c.y + badge * 0.36} fill="#0b0c0f" font-size={badge * 1.05} font-weight="700" text-anchor="middle" font-family="sans-serif">{c.n}</text>
            <text x={c.anchor === "start" ? c.x + badge * 1.5 : c.x - badge * 1.5} y={c.y + font * 0.35} fill="#ffffff" font-size={font * 0.8} text-anchor={c.anchor} font-family="monospace" paint-order="stroke" stroke="#000000" stroke-width={font * 0.15}>{c.text}</text>
        {/each}

        <!-- bloque central -->
        <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={unit * 0.012} fill="#000000" fill-opacity="0.62" />
        {#if logo}
            <image href={encodeFilePath(logo)} x={boxX + boxW * 0.15} y={boxY + boxH * 0.06} width={boxW * 0.7} height={logoH} preserveAspectRatio="xMidYMid meet" />
        {:else if label}
            <text x={w / 2} y={boxY + boxH * 0.06 + logoH * 0.62} fill="#ffffff" font-size={font * 1.25} font-weight="700" text-anchor="middle" font-family="sans-serif">{label}</text>
        {:else}
            <rect x={boxX + boxW * 0.2} y={boxY + boxH * 0.08} width={boxW * 0.6} height={logoH * 0.8} fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-dasharray="8 6" stroke-width="2" />
            <text x={w / 2} y={boxY + boxH * 0.08 + logoH * 0.5} fill="#ffffff" fill-opacity="0.7" font-size={font * 0.7} text-anchor="middle" font-family="sans-serif">[LOGO]</text>
        {/if}
        {#if logo && label}
            <text x={w / 2} y={boxY + boxH * 0.06 + logoH + font * 0.9} fill="#e6e6e6" font-size={font * 0.75} text-anchor="middle" font-family="sans-serif">{label}</text>
        {/if}
        <text x={w / 2} y={boxY + boxH * 0.62} fill={color || "#4fb3ff"} font-size={font * 1.45} font-weight="700" letter-spacing={font * 0.12} text-anchor="middle" font-family="sans-serif">{(name || `SALIDA ${index}`).toUpperCase()}</text>
        <text x={w / 2} y={boxY + boxH * 0.76} fill="#e6e6e6" font-size={font * 0.85} text-anchor="middle" font-family="monospace">{w} × {h}</text>
        <text x={w / 2} y={boxY + boxH * 0.94} fill="#ffffff" font-size={font * 1.55} font-weight="600" text-anchor="middle" font-family="monospace">{time}</text>

        <!-- barras de color y degradado -->
        {#each bars as bar, i}
            <rect x={barsX + (barsW / bars.length) * i} y={barsY} width={barsW / bars.length + 0.5} height={unit * 0.05} fill={bar} />
        {/each}
        <rect x={barsX} y={barsY + unit * 0.058} width={barsW} height={unit * 0.022} fill="url(#tp-ramp)" />
        <rect x={barsX} y={barsY} width={barsW} height={unit * 0.08} fill="none" stroke="#ffffff" stroke-width="2" />
    </svg>
</div>

<style>
    .testPattern {
        position: absolute;
        inset: 0;
        z-index: 50;
        pointer-events: none;
        background-color: #000000;
    }
    svg {
        display: block;
    }
</style>
