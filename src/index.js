import dotenv from "dotenv";
dotenv.config();

import express from "express";

import bodyParser from "body-parser";
import connect from "./db.js";
import mongo from "mongodb";
import auth from "./auth.js";

import cors from "cors";
import payment from "./payment.js";

const app = express(); // instanciranje aplikacije
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/tajna", [auth.verify], (req, res) => {
  res.json({ message: "Ovo je tajna " + req.jwt.username });
});

app.post("/users", async (req, res) => {
  let user = req.body;
  let id; /// Admin registracija
  try {
    id = await auth.registerUser(user);
    //res.status(201).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
  res.json({ id: id });
});

app.post("/loginadmin", async (req, res) => {
  let user = req.body;

  try {
    let result = await auth.autenticateUser(user.username, user.password);
    res.json(result); // Admin prijava
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
});

app.post("/login", async (req, res) => {
  let user = req.body;

  try {
    let result = await auth.autenticateUserB(user.username, user.password);
    res.json(result); // Blagajnik prijava
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
});

app.post("/reg", async (req, res) => {
  let user = req.body;
  let id; /// Blagajnik registracija
  try {
    id = await auth.registerUserB(user);
    //res.status(201).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
  res.json({ id: id });
});

app.post("/payment", async (req, res) => {
  let data = req.body;

  let id; /// Blagajnik registracija

  try {
    id = await payment.insert(data);

    res.json({ id: id });
  } catch (e) {
    res.status(406).json({ error: e.message });
  }
});

app.get("/invoice/:id", async (req, res) => {
  let id = req.params.id;

  let db = await connect();

  let doc = await db.collection("naplata").findOne({ _id: mongo.ObjectId(id) });

  res.json(doc);
});

app.listen(port, () => console.log(`Slušam na portu ${port}!`));
