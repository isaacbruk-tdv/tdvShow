<script lang="ts">
    // Editor de mapeo por salida: arrastra las 4 esquinas y activa el patron de prueba
    import { onDestroy } from "svelte"
    import { outputs } from "../../../stores"
    import { imageExtensions } from "../../../values/extensions"
    import { keysToID } from "../../helpers/array"
    import InputRow from "../../input/InputRow.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import MaterialFilePicker from "../../inputs/MaterialFilePicker.svelte"
    import MaterialNumberInput from "../../inputs/MaterialNumberInput.svelte"
    import MaterialTextInput from "../../inputs/MaterialTextInput.svelte"
    import MaterialToggleSwitch from "../../inputs/MaterialToggleSwitch.svelte"
    import { DEFAULT_CORNERS, getCorners, mapPoint, type MappingPoint } from "./mapping"

    export let screenId: string

    $: output = $outputs[screenId] || ({} as any)
    $: mapping = output.mapping || {}
    $: corners = getCorners(mapping.corners)
    $: bw = output.bounds?.width || 1920
    $: bh = output.bounds?.height || 1080

    function update(key: string, value: any) {
        outputs.update((a) => {
            if (!a[screenId]) return a
            if (!a[screenId].mapping) a[screenId].mapping = {}
            a[screenId].mapping![key] = value
            return a
        })
    }

    function setCorners(newCorners: MappingPoint[]) {
        // valores redondeados para no guardar decimales infinitos
        update(
            "corners",
            newCorners.map((p) => ({ x: Math.round(p.x * 10000) / 10000, y: Math.round(p.y * 10000) / 10000 }))
        )
        if (!mapping.enabled) update("enabled", true)
    }

    function resetCorners() {
        setCorners(DEFAULT_CORNERS.map((a) => ({ ...a })))
    }

    // valores numericos en pixeles de la salida
    function setCornerPixel(index: number, axis: "x" | "y", value: number) {
        const c = getCorners(mapping.corners)
        c[index][axis] = axis === "x" ? value / bw : value / bh
        setCorners(c)
    }

    // ---- editor visual ----
    const PAD = 0.12 // margen alrededor de la pantalla para poder sacar esquinas
    let box: HTMLDivElement | undefined
    let dragging: number | null = null
    let selected = 0
    let frame: number | null = null
    let pending: MappingPoint[] | null = null

    function toView(p: MappingPoint) {
        return { x: (PAD + p.x) / (1 + PAD * 2), y: (PAD + p.y) / (1 + PAD * 2) }
    }

    function pointerdown(e: PointerEvent, index: number) {
        dragging = index
        selected = index
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }

    function pointermove(e: PointerEvent) {
        if (dragging === null || !box) return
        const rect = box.getBoundingClientRect()
        let x = ((e.clientX - rect.left) / rect.width) * (1 + PAD * 2) - PAD
        let y = ((e.clientY - rect.top) / rect.height) * (1 + PAD * 2) - PAD
        // fino con Shift
        if (e.shiftKey) {
            const old = corners[dragging]
            x = old.x + (x - old.x) * 0.2
            y = old.y + (y - old.y) * 0.2
        }
        x = Math.min(1 + PAD, Math.max(-PAD, x))
        y = Math.min(1 + PAD, Math.max(-PAD, y))

        const c = getCorners(pending || mapping.corners)
        c[dragging] = { x, y }
        pending = c
        if (frame) return
        frame = requestAnimationFrame(() => {
            frame = null
            if (pending) setCorners(pending)
            pending = null
        })
    }

    function pointerup() {
        dragging = null
    }

    // flechas: mover la esquina seleccionada 1 px (Shift = 10 px)
    function keydown(e: KeyboardEvent) {
        const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
        const step = map[e.key]
        if (!step) return
        e.preventDefault()
        const amount = e.shiftKey ? 10 : 1
        const c = getCorners(mapping.corners)
        c[selected] = { x: c[selected].x + (step[0] * amount) / bw, y: c[selected].y + (step[1] * amount) / bh }
        setCorners(c)
    }

    onDestroy(() => {
        if (frame) cancelAnimationFrame(frame)
    })

    // rejilla deformada para la vista previa
    function line(points: MappingPoint[]) {
        return "M" + points.map((p) => `${(toView(p).x * 100).toFixed(2)},${(toView(p).y * 100).toFixed(2)}`).join("L")
    }
    function gridPath(c: MappingPoint[]) {
        let d = ""
        const steps = 8
        for (let i = 0; i <= steps; i++) {
            const t = i / steps
            d += line(Array.from({ length: 13 }, (_, k) => mapPoint(c, t, k / 12)))
            d += line(Array.from({ length: 13 }, (_, k) => mapPoint(c, k / 12, t)))
        }
        return d
    }
    function outlinePath(c: MappingPoint[]) {
        return line([...c, c[0]]) + "Z"
    }
    $: grid = gridPath(corners)
    $: outline = outlinePath(corners)
    $: screenRect = { x: (PAD / (1 + PAD * 2)) * 100, size: (1 / (1 + PAD * 2)) * 100 }

    const cornerNames = ["Superior izquierda", "Superior derecha", "Inferior derecha", "Inferior izquierda"]

    function applyLogoToAll() {
        outputs.update((a) => {
            keysToID(a).forEach((o) => {
                if (o.stageOutput) return
                if (!a[o.id].mapping) a[o.id].mapping = {}
                a[o.id].mapping!.logo = mapping.logo || ""
                a[o.id].mapping!.label = mapping.label || ""
            })
            return a
        })
    }
</script>

<svelte:window on:pointermove={pointermove} on:pointerup={pointerup} />

<div class="mapping">
    <MaterialToggleSwitch label="Mostrar patrón de prueba" checked={!!mapping.testPattern} defaultValue={false} on:change={(e) => update("testPattern", e.detail)} />
    <MaterialToggleSwitch label="Activar mapeo de esquinas" checked={!!mapping.enabled} defaultValue={false} on:change={(e) => update("enabled", e.detail)} />

    <p class="hint">Arrastra las esquinas hasta que la imagen encaje en la pantalla o superficie. Con <b>Shift</b> el movimiento es más fino. Las flechas del teclado mueven la esquina seleccionada 1 px (Shift: 10 px).</p>

    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="editor" class:disabled={!mapping.enabled} style="aspect-ratio: {bw} / {bh};" bind:this={box} tabindex="0" role="application" aria-label="Editor de esquinas" on:keydown={keydown}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect x={screenRect.x} y={screenRect.x} width={screenRect.size} height={screenRect.size} class="screen" />
            <path d={outline} class="fillShape" />
            <path d={grid} class="grid" />
            <path d={outline} class="outline" />
        </svg>
        {#each corners as corner, i}
            <button
                class="handle"
                class:selected={selected === i}
                style="left: {toView(corner).x * 100}%;top: {toView(corner).y * 100}%;"
                on:pointerdown={(e) => pointerdown(e, i)}
                on:click={() => (selected = i)}
                aria-label="Esquina {cornerNames[i]}"
                title={cornerNames[i]}
            >
                {i + 1}
            </button>
        {/each}
    </div>

    <div class="cornerInputs">
        {#each corners as corner, i}
            <div class="corner" class:selected={selected === i}>
                <p><span class="num">{i + 1}</span>{cornerNames[i]}</p>
                <InputRow>
                    <MaterialNumberInput label="X" value={Math.round(corner.x * bw)} min={null} max={null} on:change={(e) => setCornerPixel(i, "x", e.detail)} />
                    <MaterialNumberInput label="Y" value={Math.round(corner.y * bh)} min={null} max={null} on:change={(e) => setCornerPixel(i, "y", e.detail)} />
                </InputRow>
            </div>
        {/each}
    </div>

    <MaterialButton variant="outlined" icon="reset" style="width: 100%;" on:click={resetCorners}>
        <p>Restablecer esquinas</p>
    </MaterialButton>

    <h3>Logo del patrón de prueba</h3>
    <MaterialFilePicker label="Logo (PNG o SVG)" value={mapping.logo || ""} filter={{ name: "Imagen", extensions: imageExtensions }} on:change={(e) => update("logo", e.detail)} allowEmpty />
    <MaterialTextInput label="Nombre de la iglesia" value={mapping.label || ""} on:change={(e) => update("label", e.detail)} />
    <InputRow>
        <MaterialButton variant="outlined" style="flex: 1;" icon="delete" disabled={!mapping.logo} on:click={() => update("logo", "")}>
            <p>Quitar logo</p>
        </MaterialButton>
        <MaterialButton variant="outlined" style="flex: 1;" icon="copy" on:click={applyLogoToAll}>
            <p>Usar en todas las salidas</p>
        </MaterialButton>
    </InputRow>
</div>

<style>
    .mapping {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .hint {
        font-size: 0.85em;
        opacity: 0.65;
        margin: 6px 0;
    }
    h3 {
        font-size: 0.9em;
        margin: 14px 0 4px;
        opacity: 0.8;
    }

    .editor {
        position: relative;
        width: 100%;
        background-color: var(--primary-darkest);
        border-radius: 6px;
        outline: none;
        touch-action: none;
        user-select: none;
    }
    .editor:focus-visible {
        outline: 2px solid var(--secondary);
    }
    .editor.disabled {
        opacity: 0.5;
    }
    .editor svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }
    .screen {
        fill: #101218;
        stroke: #5b6170;
        stroke-width: 0.3;
        stroke-dasharray: 1 0.8;
    }
    .fillShape {
        fill: #2c2c2c;
    }
    .grid {
        fill: none;
        stroke: #ffffff;
        stroke-opacity: 0.35;
        stroke-width: 0.15;
    }
    .outline {
        fill: none;
        stroke: var(--secondary);
        stroke-width: 0.5;
    }

    .handle {
        position: absolute;
        width: 26px;
        height: 26px;
        margin: -13px 0 0 -13px;
        border-radius: 50%;
        border: 2px solid #0b0c0f;
        background-color: var(--secondary);
        color: var(--secondary-text);
        font-weight: 700;
        font-size: 0.8em;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    }
    .handle:active {
        cursor: grabbing;
    }
    .handle.selected {
        box-shadow: 0 0 0 3px rgb(255 255 255 / 0.8);
    }

    .cornerInputs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin: 8px 0;
    }
    .corner p {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85em;
        opacity: 0.8;
        margin-bottom: 4px;
    }
    .corner.selected p {
        opacity: 1;
        color: var(--secondary);
    }
    .num {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: var(--primary-lighter);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8em;
        font-weight: 700;
    }
</style>
