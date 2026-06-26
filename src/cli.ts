import Path from "node:path";
import Optimage from "./lib/optimage/optimage.js";
import type { AvifOptions, PngOptions, Sharp, WebpOptions } from "sharp";
import Fs from "node:fs/promises";
import type { Dirent } from "node:fs";

const projectDirectory = Path.normalize(import.meta.dirname + "/..");
const imagesDirectory = projectDirectory + "/assets/images";
const distDirectory = projectDirectory + "/public/dist/assets/images";

const pngOptions: PngOptions = {
    progressive: false,
    compressionLevel: 9,
    adaptiveFiltering: false,
    palette: false,
    quality: 100,
    effort: 7,
    colours: 256,
    colors: 256,
    dither: 1.0,
    force: true,
};

const avifOptions: AvifOptions = {
    quality: 50,
    lossless: false,
    effort: 4,
    chromaSubsampling: "4:4:4",
    bitdepth: 8,
    tune: "auto",
};

const webpOptions: WebpOptions = {
    quality: 50,
    alphaQuality: 100,
    lossless: false,
    nearLossless: false,
    smartSubsample: false,
    smartDeblock: false,
    preset: "default",
    effort: 4,
    loop: 0,
    delay: 0,
    minSize: true,
    mixed: false,
    exact: false,
    force: true,
};

const formats: Record<
    string,
    { format: (sharp: Sharp) => Sharp; extension: string }
> = {
    png: {
        format: (sharp: Sharp) => sharp.png(pngOptions),
        extension: ".png",
    },
    heif: {
        format: (sharp: Sharp) => sharp.avif(avifOptions),
        extension: ".avif",
    },
    webp: {
        format: (sharp: Sharp) => sharp.webp(webpOptions),
        extension: ".webp",
    },
};

const widths: number[] = [320, 640, 960, 1280, 1600, 1920];

const directory = await Fs.readdir(imagesDirectory, {
    encoding: "utf8",
    withFileTypes: true,
    recursive: false,
});

const filenames = directory
    .filter((entry: Dirent): boolean => entry.isFile())
    .map((entry: Dirent): string => entry.parentPath + "/" + entry.name);

await Optimage.optimizeDirectory(filenames, distDirectory, formats, widths);
