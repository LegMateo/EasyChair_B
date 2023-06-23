import mongo from "mongodb";
import connect from "./db.js";

export default {
  async convert(doc) {
    let start;
    let end;
    let time;
    let difference;
    for (let i in doc.date) {
      let stringDate = new Date(doc.date[i]);

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

    let daysMili = new Date(doc.date[1]).getTime() + 86400000;

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
    if (doc.chairs > 2) {
      additionalChairs = doc.chairs - 2;
      chairs = doc.chairs - additionalChairs;
    } else {
      chairs = 2;
      additionalChairs = 0;
    }

    let total =
      numb.key1 * 10 + numb.key3 * 20 + numb.key7 * 35 + additionalChairs * 5;

    return {
      beach: doc.beach,
      cashier: doc.cashier,
      username: doc.username,
      chairs: chairs,
      parasol: doc.parasol,
      days: daysCount,
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
      daysMili: daysMili,
    };
  },

  async insert(userData) {
    let id_;
    let db = await connect();

    let doc = {
      beach: userData.beach,
      cashier: userData.cashier,
      username: userData.username,
      chairs: userData.chairs,
      parasol: userData.parasol,
      date: userData.date,
      gname: userData.gname,
      gsurname: userData.gsurname,
      roomnb: userData.roomnb,
      cash: userData.cash,
    };

    // console.log(doc);

    try {
      if (doc.cash == true && doc.chairs >= 2 && doc.date != "") {
        let convert = await this.convert(doc);
        let result = await db.collection("naplata").insertMany([
          {
            beach: convert.beach,
            cashier: convert.cashier,
            username: convert.username,
            chairs: convert.chairs,
            parasol: convert.parasol,
            days: convert.days,
            one: convert.one,
            three: convert.three,
            seven: convert.seven,
            extraChairs: convert.extraChairs,
            dateBegin: convert.dateBegin,
            dateEnd: convert.dateEnd,
            time: convert.time,
            cash: convert.cash,
            total: convert.total,
          },
        ]);

        id_ = result.insertedIds[0].toString();

        await db.collection("disabled").insertMany([
          {
            daysMili: convert.daysMili,
            parasol: convert.parasol,
            dateBegin: convert.dateBegin,
            dateEnd: convert.dateEnd,
            beach: convert.beach.replace(/\s+/g, ""),
          },
        ]);

        return {
          id_: id_,
        };
      }

      if (
        doc.cash == false &&
        doc.chairs >= 2 &&
        doc.date != "" &&
        /\d/.test(doc.gname) == false &&
        doc.gname != "" &&
        doc.gname.length >= 2 &&
        /\d/.test(doc.gsurname) == false &&
        doc.gsurname != "" &&
        doc.gsurname.length >= 2 &&
        doc.roomnb != ""
      ) {
        let convert = await this.convert(doc);
        let result = await db.collection("naplata").insertOne(convert);

        id_ = result.insertedId.toString();

        await db.collection("disabled").insertMany([
          {
            daysMili: convert.daysMili,
            parasol: convert.parasol,
            dateBegin: convert.dateBegin,
            dateEnd: convert.dateEnd,
            gname: convert.gname,
            gsurname: convert.gsurname,
            roomnb: convert.roomnb,
            beach: convert.beach.replace(/\s+/g, ""),
          },
        ]);
        return {
          id_: id_,
        };
      } else throw new Error("Some fields are empty!");
    } catch (e) {
      throw Error("Some fields are empty!");
    }
  },
};
