import mongo from "mongodb";
import connect from "./db.js";

export default {
  async getDisabeledParasols(req, res) {
    try {
      let db = await connect();

      // Fetch all parasols from the database
      let parasols = await db.collection("disabled").find().toArray();

      let currentTime = new Date().getTime(); // Current time in milliseconds

      // currentTime = currentTime + 86400000;

      let disabledParasols = [];
      for (let parasol of parasols) {
        if (parasol.daysMili && currentTime > parasol.daysMili) {
          await db
            .collection("disabled")
            .deleteOne({ _id: mongo.ObjectId(parasol._id) });
          //console.log("Deleted parasol:", parasol._id);
        } else {
          disabledParasols.push([
            parasol.daysMili,
            parasol.parasol,
            parasol.dateBegin,
            parasol.dateEnd,
            parasol.gname,
            parasol.gsurname,
            parasol.roomnb,
            parasol.beach,
          ]);
        }
      }

      //console.log(disabledParasols);
      // Get an array of disabled parasol IDs
      //   const disabledParasolIds = disabledParasols.map(
      //     (parasol) => parasol.parasol
      //   );
      let obj = {};
      for (let subarray of disabledParasols) {
        let beachName = subarray[7];

        if (beachName in obj) {
          beachName = beachName.replace(/\s+/g, "");
          obj[beachName].push({
            timestamp: subarray[0],
            parasol: subarray[1],
            startDate: subarray[2],
            endDate: subarray[3],
            gname: subarray[4],
            gsurname: subarray[5],
            roomnb: subarray[6],
            // beach: subarray[7],
          });
        } else {
          beachName = beachName.replace(/\s+/g, "");
          obj[beachName] = [
            {
              timestamp: subarray[0],
              parasol: subarray[1],
              startDate: subarray[2],
              endDate: subarray[3],
              gname: subarray[4],
              gsurname: subarray[5],
              roomnb: subarray[6],
              // beach: subarray[7],
            },
          ];
        }
      }

      res.json({ disabledParasols: obj });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  },
};
