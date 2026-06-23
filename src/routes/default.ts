import Express from "express";

const router = Express.Router();

router.get("/", (_req, res) => {
    res.send("Hello, World !");
});

export default router;
