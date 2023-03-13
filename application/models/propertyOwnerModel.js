/* eslint-disable max-len */
"use strict";
const sql = require("../databaseConnection");


/**
 * A model class that contains functions
 * that interacts with the database for
 * propery owner related use cases
 */

class PropertyOwnerModel {
    // eslint-disable-next-line require-jsdoc
    constructor(propertyOwner) {
        this.firstname = propertyOwner.firstname;
        this.lastname = propertyOwner.lastname;
        this.phone = propertyOwner.phone;
        this.email = propertyOwner.email;
        this.password = propertyOwner.password;
        this.user_category = propertyOwner.user_category;
    }


    /**
   * This function will accept details about a property owner and create an entry in the database
   * @param {object} newPropertyOwner contain property owner data
   * @return {object} error the error returned if error occures
   * @return {int} insertid the insertid of a new propertyowner if database operation was
   * successful
   */
    static async createPropertyOwner(newPropertyOwner) {
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO propertyowners set ?", newPropertyOwner,
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model function user result insertId: ", res.insertId);
                        return resolve(res.insertId);
                    }
                });
        });
    }

    static async loginPropertyOwner(email) {
        // let sql = await pool();
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM propertyowners where email = ?", [email], function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("login propertyOwner result: ", res);
                    return resolve(res);
                }
            });
        });
    }

    static async createProperty(new_property) {
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO properties set ?", new_property, function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("property creation model result: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }

    static async createSpace(new_space) {
        return new Promise((resolve, reject) => {
            sql.query("Insert INTO spaces set ?", new_space, function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("space creation model result: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }

    static async getSpace(space_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM spaces where id = ?", [space_id], function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("get space details model result: ", res);
                    return resolve(res[0]);
                }
            });
        });
    }

    static async createTenant(new_tenant) {
        return new Promise((resolve, reject) => {
            sql.query("Insert INTO tenants set ?", new_tenant, function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("tenant creation model result: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }

    static async createCustomRecurringBill(new_recurring_bill) {
        return new Promise((resolve, reject) => {
            sql.query("Insert INTO custom_recurring_bills set ?", new_recurring_bill, function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("recurring bill creation model result: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }

    static async rent(new_rent) {
        return new Promise((resolve, reject) => {
            sql.query("Insert INTO rents set ?", new_rent, function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("new rent model result: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }

    static async getAllPropertyOwners() {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM propertyowners", function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("propertyOwners model result: ", res);
                    return resolve(res);
                }
            });
        });
    }

    static async checkSubscriptionModule(subscription_module_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM subscription_modules where id = ?", [subscription_module_id], function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log(res[0]);
                    return resolve(res[0]);
                }
            });
        });
    }

    static async subscribe(new_subscription) {
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO subscriptions set ?", new_subscription, function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("model function new subscription insertId: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }

    static async create_maintenance_todo(new_maintenance_todo) {
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO maintenance_todos set ?", new_maintenance_todo, function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("model function new maintenance_todo insertId: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }


    static async isSubscribed(propertyOwnerId) {
        const now = new Date();
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM subscriptions where propertyOwner_id = ? AND expired_date > ?", [propertyOwnerId, now], function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("model subscription result: ", res);
                    return resolve(res);
                }
            });
        });
    }



    static async get_custom_bills() {
    // let now = new Date()
        return new Promise((resolve, reject) => {
            sql.query("SELECT propertyowners.id, propertyowners.firstname, propertyowners.lastname, propertyowners.email, propertyowners.phone, custom_recurring_bills.bill_category, custom_recurring_bills.bill_description, custom_recurring_bills.bill_amount, custom_recurring_bills.last_bill_payment_date, custom_recurring_bills.bill_payment_interval, custom_recurring_bills.space_id, spaces.unique_space_name, spaces.property_id, properties.address FROM propertyowners LEFT JOIN custom_recurring_bills ON propertyowners.id = custom_recurring_bills.propertyowner_id LEFT JOIN spaces ON custom_recurring_bills.space_id = spaces.id LEFT JOIN properties on spaces.property_id = properties.id;",
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model get_custom_bills result: ", res);
                        return resolve(res);
                    }
                });
        });
    }

    static async get_maintenance_requests(propertyOwnerId) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT maintenance_requests.id, maintenance_requests.maintenance_request_category AS category, maintenance_requests.maintenance_request_description AS description, maintenance_requests.date_created, maintenance_requests.maintenance_request_status, maintenance_requests.date_accepted, maintenance_requests.date_declined, maintenance_requests.maintenance_decline_reason, maintenance_requests.maintenance_status, maintenance_requests.date_completed, maintenance_requests.tenant_id as tenant_id, tenants.firstname as tenant_firstname, tenants.lastname as tenant_lastname, tenants.email as tenant_email, tenants.phone as tenant_phone, maintenance_requests.space_id as space_id, spaces.unique_space_name as unique_space_name, maintenance_requests.property_id as property_id, properties.address as property_address FROM `maintenance_requests` LEFT JOIN `tenants` on maintenance_requests.tenant_id = tenants.id LEFT JOIN `spaces` on maintenance_requests.space_id = spaces.id LEFT JOIN `properties` on maintenance_requests.property_id = properties.id WHERE maintenance_requests.propertyowner_id = ?",
                propertyOwnerId,
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model get all maintenance requests result: ", res);
                        return resolve(res);
                    }
                });
        });
    }

    static async accept_maintenance_request(maintenance_request_id, date_accepted) {
        return new Promise((resolve, reject) => {
            sql.query("Update maintenance_requests SET maintenance_request_status = ?, date_accepted = ?, last_updated = ? WHERE id = ? ",
                ["Accepted", date_accepted, new Date(), maintenance_request_id],
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model accept maintenance request result: ", res);
                        return resolve(res.affectedRows);
                    }
                });
        });
    }

    static async decline_maintenance_request(maintenance_request_id, maintenance_decline_reason, date_declined) {
        return new Promise((resolve, reject) => {
            sql.query("Update maintenance_requests SET maintenance_request_status = ?, maintenance_decline_reason = ?, date_declined = ?, last_updated = ? WHERE id = ? ",
                ["Declined", maintenance_decline_reason, date_declined, new Date(), maintenance_request_id],
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model reject maintenance request result: ", res);
                        return resolve(res.affectedRows);
                    }
                });
        });
    }

    static async get_maintenance_todos(propertyOwnerId) {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line max-len
            sql.query("Select maintenance_todos.id,maintenance_todos.maintenance_category, maintenance_todos.maintenance_description, maintenance_todos.maintenance_request_id, maintenance_todos.space_id, spaces.unique_space_name, maintenance_todos.property_id, properties.address, maintenance_todos.date_created, maintenance_todos.maintenance_status, maintenance_todos.date_completed FROM `maintenance_todos` LEFT JOIN `spaces` on maintenance_todos.space_id = spaces.id LEFT JOIN `properties` on maintenance_todos.property_id = properties.id WHERE maintenance_todos.propertyowner_id = ? ORDER by maintenance_todos.date_created DESC",
                propertyOwnerId,
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model get maintenance todos result: ", res);
                        return resolve(res);
                    }
                });
        });
    }

    static async update_maintenance_todo(updated_maintenance_todo, date_completed, maintenanceId) {
        return new Promise((resolve, reject) => {
            sql.query("Update maintenance_todos set ?, date_completed = ? where id = ?",
                [updated_maintenance_todo, date_completed, maintenanceId],
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model update maintenance todo result: ", res);
                        return resolve(res.affectedRows);
                    }
                });
        });
    }

    static async update_maintenance_request(maintenance_status, date_completed, maintenance_request_id) {
        return new Promise((resolve, reject) => {
            sql.query("Update maintenance_requests set maintenance_status = ?, date_completed = ?, last_updated = ? where id = ?",
                [maintenance_status, date_completed, new Date(), maintenance_request_id],
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model update maintenance request result: ", res);
                        return resolve(res.affectedRows);
                    }
                });
        });
    }


    static async get_maintenance_request(maintenance_request_id) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT maintenance_requests.maintenance_request_category AS category, maintenance_requests.maintenance_request_description AS description, maintenance_requests.date_created as date_created, maintenance_requests.maintenance_status as maintenance_status, maintenance_requests.tenant_id as tenant_id, tenants.firstname as tenant_firstname, tenants.lastname as tenant_lastname, tenants.email as tenant_email, tenants.phone as tenant_phone FROM maintenance_requests LEFT JOIN tenants on maintenance_requests.tenant_id = tenants.id WHERE maintenance_requests.id = ? ",
                maintenance_request_id,
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model get maintenance request result: ", res);
                        return resolve(res);
                    }
                });
        });
    }
}


module.exports = PropertyOwnerModel;

