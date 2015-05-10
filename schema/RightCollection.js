'use strict';

exports = module.exports = function(params) {
    var collectionSchema = new params.mongoose.Schema({
        name: { type: String, required: true, unique: true  },
        timeCreated: { type: Date, default: Date.now }
    });
  
    collectionSchema.set('autoIndex', params.autoIndex);
  
    collectionSchema.index({ name: 1 });
    
    
    /**
     * Get the list of rights in collection
     * @return {Promise} resolve to an array
     */
    collectionSchema.methods.getRights = function() {
        
        return this.model('Beneficiary').find()
            .where('ref').is('RightCollection')
            .where('document').is(this._id)
            .populate('right')
            .exec();
    };
    
    /**
     * Get the list of users with collection
     * @param {Date}    moment  Optional date for collection association to users
     * @return {Promise} resolve to an array of users
     */
    collectionSchema.methods.getUsers = function(moment) {
        
        var deferred = require('q').defer();
        
        if (null === moment) {
            moment = new Date();
            moment.setHours(0,0,0,0);
        }
        
        this.model('AccountCollection').find()
            .where('from').lte(moment)
            .where('to').gte(moment)
            .populate('account.user.id.roles.account')
            .exec(function(err, arr) {
            
                if (err) {
                    deferred.reject(err); return;
                }
            
                var users = [];
                for(var i=0; i<arr.length; i++) {
                    users.push(arr[i].user.id);
                }

                deferred.resolve(users);
            });
        
        return deferred.promise;
    };
    
    
    
    /**
     * initialize default collections
     */  
    collectionSchema.statics.createFrenchDefaults = function(done) {
		
		
		var model = this;
        var async = require('async');
        var gt = require('gettext');
		
		async.each([
            { name: gt.gettext('General regime 100%') },
            { name: gt.gettext('Part-time 80%') },
            { name: gt.gettext('Part-time 50%') }
        ], function( type, callback) {
            
          model.create(type, function(err) {
              if (err) {
                  callback(err);
                  return;
              }
              
              callback();
          });
        }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if(err) {
                console.log(err);
                return;
            }
            
            if (done) {
                done();
            }
        });
    };
    
  
    params.db.model('RightCollection', collectionSchema);
};

