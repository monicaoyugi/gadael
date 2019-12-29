'use strict';

/**
 * @throws Error
 * @param {Object}  wrParams        Worperiod recover request parmeters from post|put request
 * @param {Boolean} workperiodRecoveryByApprover
 */
function testRequired(wrParams, workperiodRecoveryByApprover)
{
    if (undefined === wrParams.quantity || wrParams.quantity <= 0) {
        throw new Error('The quantity parameter must be positive number');
    }

    if (workperiodRecoveryByApprover) {
        if (undefined === wrParams.right) {
            throw new Error('The right parameter is mandatory');
        }

        var emptyName = (undefined === wrParams.right.name || '' === wrParams.right.name);
        if (emptyName || wrParams.right.name.length < 4) {
            throw new Error('The right.name parameter must be 3 characters at least');
        }

        if (undefined === wrParams.recoverQuantity) {
            throw new Error('The recoverQuantity parameter is mandatory');
        }
    }

    return true;
}





/**
 * Get object to set into request.workperiod_recover on save
 *
 *
 * @param {Object}      wrParams        Worperiod recover request parmeters from post|put request
 *
 *
 * @return {Promise}
 */
function getFieldsToSet(service, wrParams)
{
    const gt = service.app.utility.gettext;

    if (!service.app.config.company.workperiod_recover_request) {
        return Promise.reject(new Error(gt.gettext('Workperiod recover requests are disabled by administrator')));
    }

    try {
        testRequired(wrParams, service.app.config.company.workperiod_recovery_by_approver);
    } catch (e) {
        return Promise.reject(e);
    }

    var fieldsToSet = {
        right: {
            id: null,
            name: null
        }
    };

    // the real quantity from the list of events, must be in the quantity unit of the recover quantity
    fieldsToSet.quantity = wrParams.quantity;

    if (service.app.config.company.workperiod_recovery_by_approver) {
        // name set by creator for the new right
        fieldsToSet.right.name = wrParams.right.name;
        const RecoverQuantityModel = service.app.db.models.RecoverQuantity;
        return RecoverQuantityModel
        .findOne({ _id: wrParams.recoverQuantity._id })
        .then(function(recoverQuantity) {

            if (!recoverQuantity) {
                throw new Error('Failed to get recover quantity from '+wrParams.recoverQuantity);
            }

            fieldsToSet.recoverQuantity = recoverQuantity._id;
            // gainedQuantity is the quantity provided by the selected recover quantity
            fieldsToSet.gainedQuantity = recoverQuantity.quantity;
            fieldsToSet.waitingSettlementQuantity = recoverQuantity.quantity;
            fieldsToSet.right.quantity_unit = recoverQuantity.quantity_unit;

            return fieldsToSet;

        });
    }

    fieldsToSet.gainedQuantity = wrParams.quantity;
    fieldsToSet.right.quantity_unit = 'H';
    fieldsToSet.waitingSettlementQuantity = wrParams.quantity;
    return Promise.resolve(fieldsToSet);
}


/**
 * Create right if no approval
 *
 * @param {User}        user            Request owner
 * @param {Request}     document
 *
 * @return {Promise}    resolve to the Beneficiary document or null if right has not been created
 */
function createRight(user, document)
{
    return document.createRecoveryBeneficiary(user);
}


/**
 * create calendar events en resolve to an array of calendar event ID
 * @return {Promise}
 */
function getEventsPromise(service, param)
{
    if (!param || param.length === 0) {
        throw new Error('events parameter is mandatory');
    }

    var EventModel = service.app.db.models.CalendarEvent;
    var eventPromises = [];

    param.forEach(function(evt) {

        var event = new EventModel();
        event.dtstart = new Date(evt.dtstart);
        event.dtend = new Date(evt.dtend);
        eventPromises.push(event.save());
    });

    var eventIds = [];

    return Promise.all(eventPromises)
    .then(function(events) {
        events.forEach(function(event) {
            eventIds.push(event);
        });

        return eventIds;
    });
}



exports = module.exports = {
    getEventsPromise: getEventsPromise,
    getFieldsToSet: getFieldsToSet,
    createRight: createRight
};
