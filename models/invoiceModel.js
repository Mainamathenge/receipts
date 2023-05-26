const mongoose = require("mongoose");

const coachSchema = new mongoose.Schema({
        item: {
          type: String,
          required: true,
        },
        price: {
          type: String,
          required: true,
        },
});

const Couch = mongoose.model("items", coachSchema);

module.exports = items;
