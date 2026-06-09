const mongoose = require('mongoose');

const policyDataSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  createdByRole: {
    type: String,
    required: false,
  },
  policyNo: { type: String },
  insuredName: { type: String },
  vehicleNo: { type: String },
  insCompany: { type: String },
  make: { type: String },
  model: { type: String },
  type: { type: String },
  engine: { type: String },
  chassis: { type: String },
  fuelType: { type: String },
  gcv: { type: String },
  coverage: { type: String },
  issueAndPaymentDate: { type: Date },
  idv: { type: Number },
  od: { type: Number },
  tp: { type: Number },
  netPrm: { type: Number },
  sTex: { type: Number },
  total: { type: Number },
  paymentBy: { type: String },
  broker: { type: String },
  irdaiPosp: { type: String },
  agentName: { type: String },
  isApprovedByAdmin: { type: Boolean, default: false },
  isApprovedByTeamLeader: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PolicyData', policyDataSchema);
