const mongoose = require('mongoose');
const crypto = require('crypto');

const MinMaxSchema = new mongoose.Schema(
    {
        min: { type: Number },
        max: { type: Number }
    },
    { _id: false }
);

const deviceSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    name: { type: String, required: true },
    type: { type: String, required: true },
    location: { type: String },

    permanentToken: {
        type: String,
        required: true,
        unique: true
    },

    createdAt: { type: Date, default: Date.now },

    // ✅ SPRÁVNÉ THRESHOLDY
    threshold: {
        temperature: MinMaxSchema,
        humidity: MinMaxSchema,

        // dveře – jen maximální čas otevření
        doorOpenMaxSeconds: { type: Number }
    }
});

// Vygeneruje permanentní token, pokud ještě neexistuje
deviceSchema.pre('validate', function (next) {
    if (!this.permanentToken) {
        this.permanentToken = crypto.randomBytes(32).toString('hex');
    }
    next();
});

module.exports = mongoose.model('Device', deviceSchema);
