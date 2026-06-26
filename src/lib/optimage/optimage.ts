import sharp from "sharp";
import type { Sharp } from "sharp";
import Fs from "node:fs/promises";
import Path from "node:path";

type Format = { format: (sharp: Sharp) => Sharp; extension: string };
type Formats = Record<string, Format>;

export const sharpOptions: Parameters<typeof sharp>[1] = {
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

type OptimizeDirectoryDeps = {
    fs: {
        readdir: typeof Fs.readdir;
        stat: typeof Fs.stat;
        mkdir: typeof Fs.mkdir;
    };
    console: {
        log: typeof console.log;
        error: typeof console.error;
        warn: typeof console.warn;
    };
    sharp: typeof sharp;
};

const optimizeDirectoryDeps: OptimizeDirectoryDeps = {
    fs: {
        readdir: Fs.readdir,
        stat: Fs.stat,
        mkdir: Fs.mkdir,
    },
    console: {
        log: console.log,
        error: console.error,
        warn: console.warn,
    },
    sharp: sharp,
};

type OptimizeImageDeps = {
    fs: {
        stat: typeof Fs.stat;
    };
    console: {
        log: typeof console.log;
        warn: typeof console.warn;
        error: typeof console.error;
    };
    sharp: typeof sharp;
};

const optimizeImageDeps: OptimizeImageDeps = {
    fs: {
        stat: Fs.stat,
    },
    console: {
        log: console.log,
        warn: console.warn,
        error: console.error,
    },
    sharp: sharp,
};

export async function optimizeDirectory(
    filenames: string[],
    outputDir: string,
    formats: Formats,
    widths: number[],
    deps: OptimizeDirectoryDeps = optimizeDirectoryDeps,
) {
    try {
        if (
            (await deps.fs.stat(outputDir, { throwIfNoEntry: false })) ===
            undefined
        ) {
            await deps.fs.mkdir(outputDir, { recursive: true, mode: 0o775 });
        }

        for (const filename of filenames) {
            await optimizeImage(filename, outputDir, formats, widths, deps);
        }
    } catch (error) {
        deps.console.error(error);
    }
}

export async function optimizeImage(
    filename: string,
    outputDir: string,
    formats: Formats,
    widths: number[],
    deps: OptimizeImageDeps = optimizeImageDeps,
) {
    const instance = deps.sharp(filename, sharpOptions);
    try {
        // Checks if the file is an image and can be processed by sharp
        // See : https://github.com/lovell/sharp/issues/1298
        await instance.stats();
    } catch (error) {
        deps.console.error(
            `File "${filename}" cannot be processed by the "Sharp" library : ${error}`,
        );
        return;
    }

    for (const width of widths) {
        for (const [name, format] of Object.entries(formats)) {
            const basenameOut = outputBasename(
                filename,
                width,
                format.extension,
            );
            const fileOut = `${outputDir}/${basenameOut}`;
            const meta = await instance.metadata();

            if (meta.width < width) {
                deps.console.warn(
                    `Skipping ${filename} for width "${width}" and format "${name}" because this image need to be upscaled.`,
                );
                continue;
            }

            const info = await format
                .format(instance.clone())
                .resize(width)
                .toFile(fileOut);

            deps.console.log(
                `Optimized ${fileOut} (width: ${info.width}, height: ${info.height}, format: ${info.format}, size: ${info.size})`,
            );

            const { size } = await deps.fs.stat(filename);
            const savingInPercent = (100 - (info.size / size) * 100) * -1;
            deps.console.log(
                `Old size : ${size}. New size : ${info.size} (${Math.floor(savingInPercent)}%)`,
            );
        }
    }
}

export function outputBasename(
    filename: string,
    width: number,
    extension: string,
): string {
    const basename = Path.basename(filename, Path.extname(filename));

    return `${basename}-${width}w${extension}`;
}

export default {
    optimizeDirectory,
    optimizeImage,
    outputBasename,
};
