import sharp from "sharp";
import type { AvifOptions, PngOptions, WebpOptions, Sharp } from "sharp";
import Fs from "node:fs/promises";
import Path from "node:path";
import type { Dirent } from "node:fs";

const projectDirectory = Path.normalize(import.meta.dirname + "/..");
const imagesDirectory = projectDirectory + "/assets/images";
const distDirectory = projectDirectory + "/public/dist/assets/images";

const directory = await Fs.readdir(imagesDirectory, {
    encoding: "utf8",
    withFileTypes: true,
    recursive: false,
});

const filenames = directory
    .filter((entry: Dirent): boolean => entry.isFile())
    .map((entry: Dirent): string => entry.parentPath + "/" + entry.name);

console.log(filenames);

const sharpOptions: Parameters<typeof sharp>[1] = {
    failOn: "error",
    limitInputPixels: 268402689,
    limitInputChannels: 5,
    unlimited: false,
    sequentialRead: true,
    density: 72,
    ignoreIcc: true,
    pages: 1,
    page: 0,
    animated: false,
    raw: undefined,
    create: undefined,
    text: undefined,
    join: undefined,
    tiff: undefined,
    svg: undefined,
    pdf: undefined,
    openSlide: undefined,
    jp2: undefined,
};

try {
    if (
        (await Fs.stat(distDirectory, { throwIfNoEntry: false })) === undefined
    ) {
        await Fs.mkdir(distDirectory, { recursive: true, mode: 0o775 });
    }

    // type Format = {
    //     id: string;
    //     options:
    // };
    //

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

    const widths: number[] = [320, 640, 960, 1280, 1600, 1920];

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

    for (const filename of filenames) {
        for (const width of widths) {
            for (const [format, value] of Object.entries(formats)) {
                const extension = value.extension;
                const basename = Path.basename(
                    filename,
                    Path.extname(filename),
                );

                const fileOut = `${distDirectory}/${basename}-${width}w${extension}`;

                const instance = sharp(filename, sharpOptions);
                const meta = await instance.metadata();
                if (meta.width < width) {
                    console.warn(
                        `Skipping ${filename} for width "${width}" and format "${format}" because this image need to be upscaled.`,
                    );
                    continue;
                }

                const info = await value
                    .format(instance)
                    .resize(width)
                    .toFile(fileOut);

                console.log(
                    `Optimized ${fileOut} (width: ${info.width}, height: ${info.height}, format: ${info.format}, size: ${info.size})`,
                );

                const { size } = await Fs.stat(filename);
                const savingInPercent = (100 - (info.size / size) * 100) * -1;
                console.log(
                    `Old size : ${size}. New size : ${info.size} (${Math.floor(savingInPercent)}%)`,
                );
            }
        }
    }
} catch (error) {
    console.error(error);
}
