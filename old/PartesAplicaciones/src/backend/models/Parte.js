const mongoose = require('mongoose');

const ParteSchema = new mongoose.Schema({
    numeroParte: { type: String, required: true, unique: true },
    infocentro: { type: String },
    estado: { type: String, enum: ['ABIERTO', 'CERRADO', 'TRASLADADO'], default: 'ABIERTO' },
    usuario: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    hora: { type: String }, // Could be derived from date, but keeping separate if needed
    hora: { type: String },
    actuaciones: [{
        descripcion: { type: String },
        tiempo: { type: Number }
    }],
    parte: { type: String },
    tiempo: { type: Number }, // Total time calculated from actuations
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Parte', ParteSchema);
