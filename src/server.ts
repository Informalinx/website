import defaultRouter from "./routes/default.js";
import Express from "express";

const hostname = "127.0.0.1";
const port = 3000;

const app = Express();

app.use("/", defaultRouter);

app.listen(port, hostname);
console.log(`Server listening on ${hostname}:${port}`);
