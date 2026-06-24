import { defaultRouter } from "./routes/default.js";
import Express from "express";
import Nunjucks from "nunjucks";

const hostname = "127.0.0.1";
const port = 3000;

const app = Express();

const options: Nunjucks.ConfigureOptions = {
    autoescape: true,
    throwOnUndefined: true,
    trimBlocks: false,
    lstripBlocks: true,
    watch: false,
    noCache: true,
    express: app,
};

Nunjucks.configure(import.meta.dirname + "/../views", options);

app.use("/", defaultRouter);

app.listen(port, hostname);
console.log(`Server listening on ${hostname}:${port}`);
