import type { MediaType } from "../../../../types/Show"
import { filterSection, mediaFitOptions, mediaFitOptionsNoBlur, splitIntoRows, type BoxContent2, type EditBoxSection } from "./boxes"

export const filterSections: { [key: string]: EditBoxSection } = {
    default: { inputs: filterSection }
}

function getCroppingRows() {
    return splitIntoRows([
        { id: "cropping.top", type: "number", value: 0, values: { label: "screen.top", max: 10000, showSlider: true, sliderValues: { max: 500 } } },
        { id: "cropping.right", type: "number", value: 0, values: { label: "screen.right", max: 10000, showSlider: true, sliderValues: { max: 500 } } },
        { id: "cropping.bottom", type: "number", value: 0, values: { label: "screen.bottom", max: 10000, showSlider: true, sliderValues: { max: 500 } } },
        { id: "cropping.left", type: "number", value: 0, values: { label: "screen.left", max: 10000, showSlider: true, sliderValues: { max: 500 } } }
    ])
}

function getPlacementRows() {
    return splitIntoRows([
        { id: "placement.scale", type: "number", value: 100, values: { label: "Escala %", min: 1, max: 1000, defaultValue: 100, showSlider: true, sliderValues: { min: 10, max: 300 } } },
        { id: "placement.width", type: "number", value: 100, values: { label: "Ancho %", min: 1, max: 1000, defaultValue: 100, showSlider: true, sliderValues: { min: 10, max: 300 } } },
        { id: "placement.height", type: "number", value: 100, values: { label: "Alto %", min: 1, max: 1000, defaultValue: 100, showSlider: true, sliderValues: { min: 10, max: 300 } } },
        { id: "placement.x", type: "number", value: 0, values: { label: "Posición X %", min: -200, max: 200, defaultValue: 0, showSlider: true, sliderValues: { min: -100, max: 100 } } },
        { id: "placement.y", type: "number", value: 0, values: { label: "Posición Y %", min: -200, max: 200, defaultValue: 0, showSlider: true, sliderValues: { min: -100, max: 100 } } },
        { id: "placement.rotation", type: "number", value: 0, values: { label: "Rotación °", min: -360, max: 360, defaultValue: 0, showSlider: true, sliderValues: { min: -180, max: 180 } } }
    ])
}

const defaultMedia = splitIntoRows([
    {
        id: "videoType", // can be image as well
        type: "dropdown",
        value: "",
        values: {
            label: "clock.type",
            defaultValue: "",
            options: [
                { value: "", label: "example.default" },
                { value: "background", label: "preview.background" }, // muted, looping
                { value: "foreground", label: "preview.foreground" } // unmuted, not looping, will display even when the "Background" layer is turned off.
            ]
        }
    },
    { id: "fit", type: "dropdown", value: "", values: { label: "media.fit", defaultValue: "", options: [{ value: "", label: "themes.default" }, ...mediaFitOptions] } },
    { id: "flipped", type: "checkbox", value: false, values: { label: "media.flip_horizontally" } },
    { id: "flippedY", type: "checkbox", value: false, values: { label: "media.flip_vertically" } }
])

export const mediaBoxes: { [key in MediaType]?: BoxContent2 } = {
    video: {
        icon: "video",
        sections: {
            default: {
                inputs: defaultMedia
            },
            placement: {
                name: "Escalado y posición",
                inputs: getPlacementRows()
            },
            video: {
                alwaysOpen: true,
                inputs: splitIntoRows([
                    { id: "volume", type: "number", value: 1, multiplier: 100, values: { label: "media.volume", min: 0, max: 125, defaultValue: 100, showSlider: true } },
                    { id: "pitch", type: "number", value: 0, values: { label: "media.pitch", min: -12, max: 12, step: 1, defaultValue: 0, showSlider: true, sliderValues: { min: -12, max: 12, step: 1 } } },
                    // audio.tempo vs media.speed
                    { id: "speed", type: "number", value: 1, values: { label: "media.speed", min: 0.2, max: 10, step: 0.1, defaultValue: 1, showSlider: true, sliderValues: { min: 0.5, max: 5, step: 0.05 } } },
                    { id: "fromTime", type: "number", value: 0, values: { label: "inputs.start", max: 100000, showSlider: true } },
                    { id: "toTime", type: "number", value: 0, values: { label: "inputs.end", max: 100000, showSlider: true } },
                    { id: "softLoop", type: "number", value: 0, values: { label: "media.soft_loop (s)", max: 50, step: 1, showSlider: true, sliderValues: { max: 10, step: 0.5 } } }
                ])
            }
        }
    },
    image: {
        icon: "image",
        sections: {
            default: {
                inputs: defaultMedia
            },
            placement: {
                name: "Escalado y posición",
                inputs: getPlacementRows()
            },
            cropping: {
                inputs: getCroppingRows()
            }
        }
    },
    camera: {
        icon: "music",
        sections: {
            default: {
                inputs: splitIntoRows([
                    { id: "fit", type: "dropdown", value: "", values: { label: "media.fit", defaultValue: "", options: [{ value: "", label: "themes.default" }, ...mediaFitOptionsNoBlur] } },
                    { id: "flipped", type: "checkbox", value: false, values: { label: "media.flip_horizontally" } },
                    { id: "flippedY", type: "checkbox", value: false, values: { label: "media.flip_vertically" } }
                ])
            },
            placement: {
                name: "Escalado y posición",
                inputs: getPlacementRows()
            },
            cropping: {
                inputs: getCroppingRows()
            }
        }
    }
}

// AUDIO //

export const audioSections: { [key: string]: EditBoxSection } = {
    default: {
        inputs: splitIntoRows([
            {
                id: "audioType",
                type: "dropdown",
                value: "",
                values: {
                    label: "clock.type",
                    defaultValue: "",
                    options: [
                        { value: "", label: "example.default" },
                        { value: "music", label: "audio.type_music" }, // normal playback
                        { value: "effect", label: "audio.type_effect" } // can be stacked
                    ]
                }
            },
            { id: "volume", type: "number", value: 1, multiplier: 100, values: { label: "media.volume", min: 0, max: 125, defaultValue: 100, showSlider: true } },
            { id: "pitch", type: "number", value: 0, values: { label: "media.pitch", min: -12, max: 12, step: 1, defaultValue: 0, showSlider: true, sliderValues: { min: -12, max: 12, step: 1 } } },
            { id: "tempo", type: "number", value: 1, values: { label: "audio.tempo", min: 0.5, max: 10, step: 0.1, defaultValue: 1, showSlider: true, sliderValues: { min: 0.5, max: 5, step: 0.05 } } },
            { id: "fromTime", type: "number", value: 0, values: { label: "inputs.start", max: 100000, showSlider: true } },
            { id: "toTime", type: "number", value: 0, values: { label: "inputs.end", max: 100000, showSlider: true } }
        ])
    }
}
