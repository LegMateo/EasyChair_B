import mongo from "mongodb";
import connect from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

(async () => {
  let db = await connect();
  db.collection("blagajnici").createIndex({ username: 1 }, { unique: true });
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
      result = await db.collection("admins").insertOne(doc);
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
    let user = await db.collection("admins").findOne({ username: username });
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
    let result;
    let doc = {
      username: userData.username,
      name: userData.name.charAt(0).toUpperCase() + userData.name.slice(1),
      surname:
        userData.surname.charAt(0).toUpperCase() + userData.surname.slice(1),
      password: await bcrypt.hash(userData.password, 8),
    };
    try {
      if (
        userData.username == "" ||
        userData.name == "" ||
        userData.surname == "" ||
        userData.password == "" ||
        userData.password.length < 4 ||
        userData.username.length < 3 ||
        userData.name.length < 2 ||
        userData.surname.length < 2
      ) {
        throw new Error("CannotAuthenticate");
      } else {
        result = await db.collection("blagajnici").insertOne(doc);
      }
    } catch (e) {
      if (e.name == "MongoServerError" && e.code == 11000) {
        throw new Error("Username already exists");
      }
      if ((e = "CannotAuthenticate")) {
        throw new Error("Cannot Authenticate");
      }
    }
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

  async changeUserPassword(id, new_password) {
    let db = await connect();
    let user = await db
      .collection("blagajnici")
      .findOne({ _id: mongo.ObjectId(id) });

    if (user) {
      let new_password_hashed = await bcrypt.hash(new_password, 8);

      let result = await db.collection("blagajnici").updateOne(
        { _id: user._id },
        {
          $set: {
            password: new_password_hashed,
          },
        }
      );

      return result.modifiedCount == 1;
    }
  },

  async changeUserUsername(id, new_username, old_username) {
    let db = await connect();
    let user = await db
      .collection("blagajnici")
      .findOne({ _id: mongo.ObjectId(id) });

    let naplata = await db
      .collection("blagajnici")
      .find({ username: old_username });
    try {
      if (user && !naplata) {
        let result = await db.collection("blagajnici").updateOne(
          { _id: user._id },
          {
            $set: {
              username: new_username,
            },
          }
        );

        return result.modifiedCount == 1;
      }

      if (naplata && user) {
        let result = await db.collection("blagajnici").updateOne(
          { _id: user._id },
          {
            $set: {
              username: new_username,
            },
          }
        );
        await db.collection("naplata").updateMany(
          { username: old_username },
          {
            $set: {
              username: new_username,
            },
          }
        );
        return result.modifiedCount == 1;
      }
    } catch (e) {
      if (e.name == "MongoServerError" && e.code == 11000) {
        throw new Error("Username already exists");
      }
    }
  },
};
