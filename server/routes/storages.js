const auth = require("../middleware/auth");
const { Storage, validate } = require("../models/storage");
const { TankClosure } = require("../models/tankClosure");
const { Batch } = require("../models/batch");

const express = require("express");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { body } = req;

  const { error } = validate(body);
  if (error) return res.status(400).send(error.details[0].message);

  const newStorage = { ...body };

  await Storage.calcTotals(newStorage);

  const storage = new Storage({ ...newStorage });

  await storage.save();

  // Actualizo el flag de ultimo status en el lote
  const { _batch: _id } = body;
  await Batch.findByIdAndUpdate({ _id }, { lastStatus: "storage" });

  return res.status(200).send(storage);
});

router.put("/", auth, async (req, res) => {
  console.log("put triggered storages update");
  const { body } = req;
  const { _id } = req.body;

  body.validationDate = new Date();
  const sample = await Storage.findOneAndUpdate(
    { _id },
    { ...body },
    { new: true }
  );

  return res.status(200).send(sample);
});

router.get("/tank/:tank_id", async (req, res) => {
  console.log("/api/storages/tank/:tank_id");
  const { params } = req;
  const { tank_id } = params;

  const lastTankClosure = await TankClosure.findOne({ _tank: tank_id }, null, {
    sort: { timestamp: -1 },
  });
  console.log(lastTankClosure);

  if (lastTankClosure === null) {
    res.status(400).send("No existen registros para este tanque");
    return;
  }

  const { timestamp } = lastTankClosure;
  const batches = await Storage.find({
    _tank: tank_id,
    timestamp: {
      $gt: timestamp,
    },
  });

  res.status(200).send(batches);
});

router.get("/batch/:id", auth, async (req, res) => {
  const { id: _batch } = req.params;
  const doc = await Storage.findOne({ _batch });
  res.status(200).send(doc);
});

module.exports = router;
