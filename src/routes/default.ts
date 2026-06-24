import Express from "express";

const router = Express.Router();

router.get("/", (_req, res) => {
    res.render("home.njk");
});

export const defaultRouter = router;
