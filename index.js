import express from "express";
import session from "express-session";
import path from "path"
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax"
    }
}));

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

function requreLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/signin");
    }
    next();
}

app.get("/", async (req, res) => {
   try {
    const result = await pool.query(
        "SELECT * FROM blogs ORDER BY date_created DESC"
    );
    res.render("index", {
        blogs: result.rows,
        error: null
    });
   } catch (err) {
        console.error(err);
        res.status(500).send("Unable to load blog posts.");
   }
});

app.get("/signup", (req, res) => {
    res.render("signup", { error: null });
})

app.post("/signup", async (req, res) => {
    const {user_id, password, name} = req.body;

    try {
        const existing = await pool.query(
            "SELECT user_id FROM users WHERE user_id = $1",
            [user_id]
        );

        if (existing.rows.length > 0) {
            return res.status(409).render("signup", {
                error : "That user ID is already taken."
            });
        }

        await pool.query(
            `INSERT INTO users (user_id, password, name)
            VALUES ($1, $2, $3)`,
            [user_id, password, name]
        );

        res.redirect("/signin");
    } catch (err) {
        console.error(err);
        res.status(500).render("signup", {
            error: "Unable to create your account."
        });
    }
});

app.get("/signin", (req, res) => {
    res.render("signin", {error: null});
});

app.post("/signin", async (req, res) => {
    const {user_id, password} = req.body;

    try {
        const result = await pool.query(
            `SELECT user_id, name FROM users
            WHERE user_id = $1 AND password = $2`,
            [user_id, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).render("signin", {
                error: "Incorrect user ID or password."
            });
        }

        req.session.regenerate((err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Unable to sign in.");
            }

            req.session.user = result.rows[0];
            res.redirect("/");
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("signin", {
            error: "Unable to sign in."
        });
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.post("/blogs", requreLogin, async (req, res) => {
    const {title, body} = req.body;
    const user = req.session.user;

    try {
        await pool.query(
            `INSERT INTO blogs (creator_name, creator_user_id, title, body)
            VALUES ($1, $2, $3, $4)`,
            [user.name, user.user_id, title, body]
        );

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Unable to create blog post.");
    }
});

app.get("/blogs/:id/edit", requreLogin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM blogs
            WHERE blog_id = $1 AND creator_user_id = $2`,
            [req.params.id, req.session.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send(
                "Post not found or you do not own this post."
            );
        } 

        res.render("edit", {
            blog: result.rows[0],
            error: null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Unable to load the post");
    }
});

app.post("/blogs/:id/edit", requreLogin, async (req, res) => {
    const {title, body} = req.body;

    try {
        const result = await pool.query(
            `UPDATE blogs
            SET title = $1, body = $2
            WHERE blog_id = $3 AND creator_user_id = $4
            RETURNING *`,
            [title, body, req.params.id, req.session.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Post not found or you don't own this post.");
        }

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Unable to update the post.");
    }
});

app.post("/blogs/:id/delete", requreLogin, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM blogs
            WHERE blog_id = $1 AND creator_user_id = $2
            RETURNING blog_id`,
            [req.params.id, req.session.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send(
                "Post not found or you do not own this post."
            );
        }

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Unable to delete post.");
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});