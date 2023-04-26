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

  async payment(userData) {
    let db = await connect();

    let doc = {
      beach: userData.beach,
      cashier: userData.cashier,
      chairs: userData.chairs,
      parasol: userData.parasol,
      date: userData.date,
      gname: userData.gname,
      gsurname: userData.gsurname,
      roomnb: userData.roomnb,
      cash: userData.cash,
    };

    let id_;

    let start;
    let end;
    let time;
    let difference;
    for (let i in userData.date) {
      let stringDate = new Date(userData.date[i]);

      time = stringDate.toLocaleTimeString("hr-HR");

      let year = stringDate.getFullYear();
      let month = stringDate.getMonth() + 1;
      let dt = stringDate.getDate();

      if (dt < 10) {
        dt = "0" + dt;
      }
      if (month < 10) {
        month = "0" + month;
      }
      if (i == 0) {
        start = dt + "-" + month + "-" + year;
        difference = stringDate.getTime();
      } else {
        end = dt + "-" + month + "-" + year;
        difference = stringDate.getTime() - difference;
      }
    }
    let daysCount = difference / (1000 * 3600 * 24) + 1;

    // 1 set = 2 chairs & 1 unbrela
    // 1 set 1 day = 10euro
    // 1 set 3 days = 20euro
    // 1 set 7 days = 35euro
    // 1 chair only = 5euro

    let numb = {
      key7: 0,
      key3: 0,
      key1: 0,
    };

    let daysTemp = daysCount;

    while (daysTemp != 0) {
      if (daysTemp % 7 != 0) {
        numb.key7 = Math.floor(daysTemp / 7);
        daysTemp = daysTemp - numb.key7 * 7;
      } else {
        numb.key7 = Math.floor(daysTemp / 7);
        daysTemp = 0;
      }
      if (daysTemp % 3 != 0) {
        numb.key3 = Math.floor(daysTemp / 3);
        daysTemp = daysTemp - numb.key3 * 3;
      } else {
        numb.key3 = Math.floor(daysTemp / 3);
        daysTemp = 0;
      }

      if (daysTemp % 1 != 0) {
        numb.key1 = Math.floor(daysTemp / 1);
        daysTemp = daysTemp - numb.key1 * 1;
      } else {
        numb.key1 = Math.floor(daysTemp / 1);
        daysTemp = 0;
      }
    }

    let additionalChairs;
    let chairs;
    if (userData.chairs > 2) {
      additionalChairs = userData.chairs - 2;
      chairs = userData.chairs - additionalChairs;
    } else {
      chairs = 2;
      additionalChairs = 0;
    }

    let total =
      numb.key1 * 10 + numb.key3 * 20 + numb.key7 * 35 + additionalChairs * 5;

    if (
      doc.cash == true &&
      doc.chairs != "" &&
      doc.chairs != "" &&
      doc.date != ""
    ) {
      let result = await db.collection("naplata").insertMany([
        {
          beach: doc.beach,
          cashier: doc.cashier,
          chairs: chairs,
          parasol: doc.parasol,
          days: daysCount,
          one: numb.key1,
          three: numb.key3,
          seven: numb.key7,
          extraChairs: additionalChairs,
          dateBegin: start,
          dateEnd: end,
          time: time,
          cash: doc.cash,
          total: total,
        },
      ]);

      id_ = result.insertedIds[0].toString();
      return id_;
    }
    if (
      doc.cash == false &&
      doc.chairs != "" &&
      doc.chairs != 1 &&
      doc.date != "" &&
      doc.gname != "" &&
      doc.gsurname != "" &&
      doc.roomnb != ""
    ) {
      let result = await db.collection("naplata").insertMany([
        {
          beach: doc.beach,
          cashier: doc.cashier,
          chairs: chairs,
          parasol: doc.parasol,
          days: daysCount,
          days: doc.date,
          one: numb.key1,
          three: numb.key3,
          seven: numb.key7,
          extraChairs: additionalChairs,
          gname: doc.gname,
          gsurname: doc.gsurname,
          roomnb: doc.roomnb,
          dateBegin: start,
          dateEnd: end,
          time: time,
          cash: doc.cash,
          total: total,
        },
      ]);
      //  console.log(result.insertedId);
      id_ = result.insertedIds[0].toString();
      return id_;
    } else throw new Error("Some fields are empty!");
  },
};
