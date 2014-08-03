'use strict';

exports = module.exports = function(params) {
	var mongoose = params.mongoose;
	var acSchema = new mongoose.Schema({
		account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
		rightCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'RightCollection' , required: true },
		from: { type: Date, required: true },		// Do not modify if in the past
		to: { type: Date },							// Do not modify if in the past
		timeCreated: { type: Date, default: Date.now }
	});
  
	acSchema.set('autoIndex', params.autoIndex);
  
	acSchema.index({ account: 1 });
	acSchema.index({account: 1, rightCollection: 1, from: 1}, {unique: true});
  
	params.db.model('AccountCollection', acSchema);
};

