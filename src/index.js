import dotenv from "dotenv";
dotenv.config();

import express from "express";

import bodyParser from "body-parser";
import connect from "./db.js";
import mongo from "mongodb";
import auth from "./auth.js";

import cors from "cors";
import payment from "./payment.js";
import disable from "./disable.js";

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

app.get("/", [auth.verify], async (req, res) => {
  let array = [];
  let db = await connect();

  let username = req.jwt.username;
  // console.log(username);
  let data = await db.collection("blagajnici").aggregate([
    {
      $match: { username: username },
    },
    {
      $lookup: {
        from: "naplata",
        localField: "username",
        foreignField: "username",
        as: "naplata",
      },
    },
    {
      $unwind: { path: "$naplata", preserveNullAndEmptyArrays: true },
    },
    {
      $group: {
        _id: {
          name: "$name",
          surname: "$surname",
          username: "$username",
        },
        sumChairs: {
          $sum: {
            $add: [
              { $ifNull: ["$naplata.chairs", 0] },
              { $ifNull: ["$naplata.extraChairs", 0] },
            ],
          },
        },
        total: {
          $sum: { $ifNull: ["$naplata.total", 0] },
        },
        days: {
          $sum: { $ifNull: ["$naplata.days", 0] },
        },
        one: {
          $sum: { $ifNull: ["$naplata.one", 0] },
        },
        three: {
          $sum: { $ifNull: ["$naplata.three", 0] },
        },
        seven: {
          $sum: { $ifNull: ["$naplata.seven", 0] },
        },
      },
    },
  ]);
  await data.forEach((doc) => {
    array.push(doc);
  });

  res.json(array);
});

app.get("/maro", disable.getDisabeledParasols);

app.get("/reverolbeach", disable.getDisabeledParasols);

app.get("/sunsetbeach", disable.getDisabeledParasols);

app.get("/surfmaniabeach", disable.getDisabeledParasols);

app.get("/marinabeach", disable.getDisabeledParasols);

app.post("/payment", [auth.verify], async (req, res) => {
  let data = req.body;

  let id; /// Blagajnik registracija

  try {
    id = await payment.insert(data);

    res.json({ id: id });
  } catch (e) {
    res.status(406).json({ error: e.message });
  }
});

app.get("/invoice/:id", [auth.verify], async (req, res) => {
  let id = req.params.id;

  let db = await connect();

  let doc = await db.collection("naplata").findOne({ _id: mongo.ObjectId(id) });

  res.json(doc);
});

app.get("/admin", [auth.verify], async (req, res) => {
  let array = [];

  let db = await connect();

  let data = await db.collection("blagajnici").aggregate([
    {
      $lookup: {
        from: "naplata",
        let: { username: "$username" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$username", "$$username"] },
            },
          },
          {
            $group: {
              _id: { name: "$cashier", username: "$username" },
              sumChairs: { $sum: { $add: ["$chairs", "$extraChairs"] } },
              total: { $sum: "$total" },
              days: { $sum: "$days" },
              one: { $sum: "$one" },
              three: { $sum: "$three" },
              seven: { $sum: "$seven" },
            },
          },
        ],
        as: "naplata",
      },
    },
    {
      $unwind: { path: "$naplata", preserveNullAndEmptyArrays: true },
    },
    {
      $group: {
        _id: {
          name: "$name",
          surname: "$surname",
          username: "$username",
        },
        sumChairs: {
          $sum: {
            $add: [
              { $ifNull: ["$naplata.sumChairs", 0] },
              { $ifNull: ["$extraChairs", 0] },
            ],
          },
        },
        total: {
          $sum: { $ifNull: ["$naplata.total", 0] },
        },
        days: {
          $sum: { $ifNull: ["$naplata.days", 0] },
        },
        one: {
          $sum: { $ifNull: ["$naplata.one", 0] },
        },
        three: {
          $sum: { $ifNull: ["$naplata.three", 0] },
        },
        seven: {
          $sum: { $ifNull: ["$naplata.seven", 0] },
        },
        id: { $first: "$_id" },
      },
    },
    {
      $sort: {
        id: -1,
      },
    },
  ]);

  await data.forEach((doc) => {
    array.push(doc);
  });

  res.json(array);
});

app.post("/admin", [auth.verify], async (req, res) => {
  let data = req.body;
  let id;
  try {
    id = await auth.registerUserB(data);
    res.json({ id: id });
  } catch (e) {
    console.error(e);
    res.status(406).json({ error: e.message });
  }
});

app.patch("/admin", [auth.verify], async (req, res) => {
  let changes = req.body;

  try {
    if (changes.new_password && changes.new_password.length >= 3) {
      let result = await auth.changeUserPassword(
        changes.id,
        changes.new_password
      );
      if (result) {
        res.status(201).send();
      } else {
        res.status(500).json({ error: "Cannot change password" });
      }
    }
    if (changes.new_username && changes.new_username.length >= 3) {
      let result = await auth.changeUserUsername(
        changes.id,
        changes.new_username,
        changes.old_username
      );
      if (result) {
        res.status(201).send();
      } else {
        res.status(500).json({ error: "Cannot change username" });
      }
    } else {
      res.status(400).json({ error: "Krivi upit" });
    }
  } catch (e) {
    if (e.name == "MongoServerError" && e.code == 11000) {
      throw new Error("Username already exists");
    }
  }
});

app.delete("/admin/:id", [auth.verify], async (req, res) => {
  let id = req.params;
  let db = await connect();

  if (id) {
    await db.collection("blagajnici").deleteOne({ _id: mongo.ObjectId(id) });
    res.status(201).send();
  } else res.status(400).json({ error: "Id ne postoji" });
});

app.listen(port, () => console.log(`Slušam na portu ${port}!`));
