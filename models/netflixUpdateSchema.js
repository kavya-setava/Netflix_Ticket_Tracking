const mongoose = require('mongoose');
const { Schema } = mongoose;

// Counter for auto-incrementing IDs
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', CounterSchema);

// Main Schema
const NetflixTicketsSchema = new Schema({
  ticketID: {
    type: String,
    unique: true
  },
  ticketKey: String, // Non-unique field
  created: Date,
  updated: Date,
  CM_name: {
    type: String,
    
  },
  CM_email: {
    type: String,
   
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  cm_region: {
    type: String,
    enum: ['', 'NA', 'EMEA', 'APAC', 'LATAM','UCAN'],
    default: ''
  },
  // QM_name: {
  //   type: String,
  //   default: ''
  // },
  // QM_email: {
  //   type: String,
  //   default: '',
  //   match: [/.+\@.+\..+/, 'Please fill a valid email address']
  // },
  AM_name: {
    type: String,
    default: ''
  },
  SLA: Date,
  lastBreachCheck: Date,
  latest_created_date: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate ticketID before saving
NetflixTicketsSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'ticketId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.ticketID = `NTT-${String(counter.seq).padStart(6, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

// Auto-update timestamps
NetflixTicketsSchema.pre('save', function(next) {
  this.updated = new Date();
  this.SLA = new Date(this.updated.getTime() + 2 * 60 * 60 * 1000);
  if (this.isNew) this.created = this.updated;
  next();
});

module.exports = mongoose.model('NetflixTicket', NetflixTicketsSchema);