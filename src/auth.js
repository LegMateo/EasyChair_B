import mongo from "mongodb";
import connect from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

(async () => {
  let db = await connect();
  db.collection("users").createIndex({ username: 1 }, { unique: true });
})();

export default {
  //Register za admina ali to ne treba jer je vec ugradeno

  async registerUser(userData) {
    let db = await connect();
    let doc = {
      username: userData.username,
      password: await bcrypt.hash(userData.password, 8),
    };
    try {
      result = await db.collection("users").insertOne(doc);
      if (result && result.insertedId) {
        return result.insertedId;
      }
    } catch (e) {
      if (e.name == "MongoError" && e.code == 11000) {
        throw new Error("Username already exists");
      }
    }
    //   if (result && result.insertedCount == 1) {
    //     return result.insertedId;
    //   } else {
    //     throw new Error("Cannot register user");
    //   }
    //
  },
  async autenticateUser(username, password) {
    let db = await connect();
    let user = await db.collection("users").findOne({ username: username });
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      let token = jwt.sign(user, process.env.JWT_SECRET, {
        algorithm: "HS512",
        expiresIn: "1 week",
      });
      return {
        token,
        username: user.username,
      };
    } else {
      throw new Error("Cannot authenticate");
    }
  },
  verify(req, res, next) {
    try {
      let authorization = req.headers.authorization.split(" ");
      let type = authorization[0];
      let token = authorization[1];

      if (type !== "Bearer") {
        res.status(401).send();
        return false;
      } else {
        req.jwt = jwt.verify(token, process.env.JWT_SECRET);
        return next();
      }
    } catch (e) {
      return res.status(401).send();
    }
  },

  /// BLAGAJNIK

  async registerUserB(userData) {
    let db = await connect();
    let doc = {
      username: userData.username,
      name: userData.name,
      surname: userData.surname,
      password: await bcrypt.hash(userData.password, 8),
    };
    try {
      result = await db.collection("blagajnici").insertOne(doc);
      if (result && result.insertedId) {
        return result.insertedId;
      } else throw new Error("Cannot authenticate");
    } catch (e) {
      if (e.name == "MongoError" && e.code == 11000) {
        throw new Error("Username already exists");
      }
    }
    //   if (result && result.insertedCount == 1) {
    //     return result.insertedId;
    //   } else {
    //     throw new Error("Cannot register user");
    //   }
    //
  },

  async autenticateUserB(username, password) {
    let db = await connect();
    let user = await db
      .collection("blagajnici")
      .findOne({ username: username });
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      let token = jwt.sign(user, process.env.JWT_SECRET, {
        algorithm: "HS512",
        expiresIn: "1 week",
      });
      return {
        token,
        username: user.username,
        name: user.name,
        surname: user.surname,
      };
    } else {
      throw new Error("Cannot authenticate");
    }
  },
  verifyB(req, res, next) {
    try {
      let authorization = req.headers.authorization.split(" ");
      let type = authorization[0];
      let token = authorization[1];

      if (type !== "Bearer") {
        res.status(401).send();
        return false;
      } else {
        req.jwt = jwt.verify(token, process.env.JWT_SECRET);
        return next();
      }
    } catch (e) {
      return res.status(401).send();
    }
  },
};
