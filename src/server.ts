import { defaultRouter } from "./routes/default.js";
import Express from "express";
import Nunjucks from "nunjucks";
import Path from "node:path";

const hostname = "127.0.0.1";
const port = 3000;
const projectDirectory = Path.normalize(import.meta.dirname + "/../");
const templateDirectory = projectDirectory + "/views";
const publicDistDirectory = projectDirectory + "/public/dist";

const app = Express();

const nunjucksOptions: Parameters<typeof Nunjucks.configure>[1] = {
    autoescape: true,
    throwOnUndefined: true,
    trimBlocks: false,
    lstripBlocks: true,
    watch: false,
    noCache: true,
    express: app,
};

const staticOptions: Parameters<typeof Express.static>[1] = {
    dotfiles: "ignore",
    etag: true,
    extensions: [],
    fallthrough: false,
    immutable: true,
    index: false,
    lastModified: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    redirect: true,
    setHeaders: () => {},
    acceptRanges: true,
    cacheControl: true,
};

Nunjucks.configure(templateDirectory, nunjucksOptions);

app.use("/", defaultRouter);
app.use("/assets", Express.static(publicDistDirectory, staticOptions));

app.listen(port, hostname);
console.log(`Server listening on ${hostname}:${port}`);
