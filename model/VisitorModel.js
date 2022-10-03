const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const visitorPayloadSchema = new mongoose.Schema({
    visitor_info: {
        type: {
          member: {
            _id: { type: String, required: true },
            name: { type: String, required: true },
            // mobile: { type: String, required: true },
            membership_id: { type: String, required: true },
            visitor_type: { type: String, required: true },
            is_member_ref: { type: Boolean, default: false },
            visit_place: { type: String, default: null},
            date: { type: Date, default: new Date()},
            time_in: { type: Date, default: new Date()},
            time_out: { type: Date, default: new Date()},
            meeting_status: { type: Number, default: 'checkedin'},
            remarks: { type: String, default: null},
            image: { type: String, default: null},
            guests: [{
                _id: false,
                name: { type: String, required: true },
                address: { type: String, required: true },
                mobile: { type: String, required: true }
            }]
          }
        },
        default : null
      },

}, {
    timestamps: true
})

module.exports = mongoose.model('VisitorPayload', visitorPayloadSchema)