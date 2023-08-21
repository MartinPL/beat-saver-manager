import { defineConfig } from "astro/config"
import tailwind from "@astrojs/tailwind"
function alpine() {
    return {
        name: "alpinejs",
        hooks: {
            "astro:config:setup": ({ injectScript }) => {
                injectScript(
                    "page",
                    `
                    import Alpine from 'alpinejs'; 
                    import persist from '@alpinejs/persist'
                    Alpine.plugin(persist)
                    Alpine.$dispatch = function (name, detail = '') {
                        window.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: true }))
                    }
                    window.Alpine = Alpine; 
                    Alpine.start();
                `
                )
            },
        },
    }
}

// https://astro.build/config
export default defineConfig({
    integrations: [alpine(), tailwind()],
})
