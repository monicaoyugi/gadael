'use strict';

/**
 * Retrive list of types
 */  
exports.getList = function (req, res) {
	
	req.ensureAdmin(req, res, function(req, res) {
		
		var query = function() {
			var find = req.app.db.models.Type.find();
			if (req.param('name'))
			{
				find.where({ name: new RegExp('^'+req.param('name'), 'i') });
			}
			return find;
		};
		
		var paginate = require('../../modules/paginate');

		query().count(function(err, total) {
				
			var p = paginate(req, res, total, 50);
			
			if (!p) {
				res.json([]);
				return;
			}
			
			query()
			.select('name')
			.sort('name')
			.limit(p.limit)
			.skip(p.skip)
			.exec(function (err, docs) {
				if (err) {
					return console.error(err);
				}
				
				res.json(docs);
			});
		});
	});
};




exports.save = function(req, res) {
	req.ensureAdmin(req, res, function() {
		var gt = req.app.utility.gettext;
		var workflow = req.app.utility.workflow(req, res);
		var Type = req.app.db.models.Type;
		
		workflow.on('validate', function() {

			if (workflow.needRequiredFields(['name'])) {
			  return workflow.emit('response');
			}

			workflow.emit('save');
		});
		
		workflow.on('save', function() {

			var fieldsToSet = { 
				name: req.body.name
			};

			if (req.params.id)
			{
				Type.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, type) {
					if (err) {
						return workflow.emit('exception', err.err);
					}
					
					workflow.outcome.alert.push({
						type: 'success',
						message: gt.gettext('The right type has been modified')
					});
					
					workflow.emit('response');
				});
			} else {
				Type.create(fieldsToSet, function(err, type) {
					
					if (err) {
						return workflow.emit('exception', err.err);
					}
					
					workflow.outcome.alert.push({
						type: 'success',
						message: gt.gettext('The right type has been created')
					});
					
					workflow.emit('response');
				});
			}
			
			
		});
		
		workflow.emit('validate');
	});
};


exports.getItem = function(req, res) {
	req.ensureAdmin(req, res, function() {
		// var gt = req.app.utility.gettext;
		var workflow = req.app.utility.workflow(req, res);
		
		req.app.db.models.Type.findOne({ '_id' : req.params.id}, 'name', function(err, type) {
			if (err)
			{
				return workflow.emit('exception', err.message);
			}
			
			res.json(type);
		});
	});
};	
