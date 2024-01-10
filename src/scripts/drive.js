import Alpine from "alpinejs"
import { get, set } from "idb-keyval"
import * as zip from "@zip.js/zip.js"

Alpine.store("drive", {
    dirHandle: false,
    async setDownloadFolder() {
        this.dirHandle = await window.showDirectoryPicker({ mode: "readwrite" })
        await set("dirHandle", this.dirHandle)
    },
    async verifyPermission(fileHandle) {
        this.dirHandle = await get("dirHandle")
        if (!this.dirHandle) {
            await this.setDownloadFolder()
            return
        }

        const options = { mode: "readwrite" }
        // Check if permission was already granted. If so, return true.
        if ((await this.dirHandle.queryPermission(options)) === "granted") {
            return true
        }
        // Request permission. If the user grants permission, return true.
        if ((await this.dirHandle.requestPermission(options)) === "granted") {
            return true
        }
        // The user didn't grant permission, so return false.
        await this.setDownloadFolder()
    },
    async downloadPlaylist(maps) {
        await this.verifyPermission()
        let index = 0
        for (const map of maps) {
            Alpine.$dispatch("notify", `Download ${index + 1} / ${maps.length}`)
            await this.downloadMap(map.id, map.versions[0].downloadURL)
            index++
        }

        Alpine.$dispatch("notify", "Download done")
    },
    async downloadMap(name, downloadURL) {
        const entries = await new zip.ZipReader(new zip.BlobReader(await this.fetchMapFile(name, downloadURL))).getEntries()
        await entries.forEach((entry) => this.unpackMapFile(name, entry))
    },
    async fetchMapFile(name, downloadURL) {
        const response = await fetch(downloadURL)
        return new File([await response.blob()], `${name}.zip`, {
            type: "application/zip",
        })
    },
    async unpackMapFile(name, entry) {
        const subDirHandle = await this.dirHandle.getDirectoryHandle(name, {
            create: true,
        })
        const blobURL = await entry.getData(new zip.BlobWriter())
        this.saveMapFile(entry.filename, blobURL, subDirHandle)
    },
    async saveMapFile(fileName, blob, subDirHandle) {
        const newFileHandle = await subDirHandle.getFileHandle(fileName, {
            create: true,
        })
        const writable = await newFileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
    },
})
