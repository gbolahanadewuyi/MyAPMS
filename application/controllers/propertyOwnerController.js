"use strict";
const { ErrorReporting } = require("@google-cloud/error-reporting");
const errors = new ErrorReporting();
const jwt = require("jsonwebtoken");
// eslint-disable-next-line no-unused-vars
const redis = require("redis");
// const { JWT_SECRET } = require("../../env-var");


// import models
const PropertyOwnerModel = require("../models/propertyOwnerModel");

// import functions
const APMSFunctions = require("../functions/apmsFunctions");

// connect to redis
// eslint-disable-next-line no-unused-vars
let redisClient;

// define anonymous self-invoked async function to initialize/connect to redis
// (async () => {
//     redisClient = redis.createClient();
//     redisClient.on("error", (error) => console.error(`Error : ${error}`));
//     await redisClient.connect();
// })();

exports.create_a_propertyOwner = async function (req, res) {
    const new_propertyOwner = new PropertyOwnerModel(req.body);

    // validate data
    if (!new_propertyOwner.phone || !new_propertyOwner.email) {
        res.json({
            status: 400,
            error: true,
            message: "Please provide your email and phonenumber",
        });
    } else {
        try {
            // hashpassword and set the new_propertyOwner.password key to the hashed value
            const hashedPassword = await APMSFunctions.hashPassword(new_propertyOwner.password);
            // set new_propertyOwner.password key to the created hashedPassword
            new_propertyOwner["password"] = hashedPassword;
            console.log("hashedPassword:  ", hashedPassword);

            // returns the insertID which is the id of the user
            const propertyOwner = await PropertyOwnerModel.createPropertyOwner(new_propertyOwner);

            // get free tier subscription module
            const new_subscription = await APMSFunctions.subscribeNewPropertyOwner(propertyOwner);

            await APMSFunctions.sendWelcomeEmail(new_propertyOwner.email, new_propertyOwner.firstname);
            res.json({
                message: "Property owner registration successful",
                propertyOwner_id: propertyOwner,
                subscriptionId: new_subscription,
            });
        } catch (error) {
            errors.report(error);
            res.send({
                status: 400,
                error: true,
                message: error,
            });
        }
    }
};


exports.login = async function (req, res) {
    const { email, password } = req.body;
    // validate data
    if (!email || !password) {
        res.json({
            status: 400,
            error: true,
            message: "Enter your correct email & password",
        });
    } else {
        try {
            const propertyOwner = await PropertyOwnerModel.loginPropertyOwner(email);
            if (propertyOwner.length == 0) {
                throw "No user found: wrong email or password";
            }
            // check if account is validated


            // check if account is active


            const validatedHashedPassword = await APMSFunctions.validateHashedPassword(password, propertyOwner[0].password);
            if (!validatedHashedPassword) {
                throw "Wrong password, please enter your correct password";
            }
            // TODO:create token that contains some information
            const accessToken = jwt.sign({
                id: propertyOwner[0].id,
                email: propertyOwner[0].email,
                phone: propertyOwner[0].phone,
                subscriptionStatus: propertyOwner[0].subscriptionStatus,
            }, process.env.JWT_SECRET, {
                expiresIn: "24h",
            });

            res.json({
                status: 200,
                data: propertyOwner[0],
                token: accessToken,
            });
        } catch (error) {
            errors.report(error);
            res.send({
                status: 400,
                error: true,
                message: error,
            });
        }
    }
};

exports.subscribe = async function (req, res) {
    const propertyOwnerId = req.user.id;
    const { subscription_module_id } = req.body;

    // formulate date
    const today = new Date();
    const expired = new Date(today);
    let purchase_date;
    let expired_date;

    let new_subscription;

    try {
        // check if user has already subscribed
        const hasValidSubscription = await PropertyOwnerModel.isSubscribed(propertyOwnerId);
        console.log(hasValidSubscription);


        if (hasValidSubscription.length == 0) {
            const subscription_module = await PropertyOwnerModel.checkSubscriptionModule(subscription_module_id);
            const subscription_type = subscription_module.subscription_type;
            const subscription_price = subscription_module.subscription_price;
            // let subscription_duration = subscription[0].subscription_duration;

            switch (subscription_type) {
            case "free":
                purchase_date = today;
                expired.setDate(expired.getDate() + 14);
                expired_date = expired;

                break;

            case "Silver":
                purchase_date = today;
                expired.setDate(expired.getDate() + 30);
                expired_date = expired;
                break;

            case "Gold":
                purchase_date = today;
                expired.setDate(expired.getDate() + 120);
                expired_date = expired;
                break;

            default:
                throw ("Error errolling user to a subscription because subscription package selected cannot be found");
            }
            // prepare data to store in subscription table
            const new_subscription_object = {
                "subscription_module_id": subscription_module_id,
                "propertyOwner_id": propertyOwnerId,
                "subscription_type": subscription_type,
                "subscription_price": subscription_price,
                "purchase_date": purchase_date,
                "expired_date": expired_date,

            };

            new_subscription = await PropertyOwnerModel.subscribe(new_subscription_object);
        } else {
            throw ("Subscription process failed becuase user already has a valid subscription");
        }
        res.json({
            status: 200,
            message: "Subscription successful",
            insertId: new_subscription,
        });
    } catch (error) {
        errors.report(error);
        res.json({
            status: 404,
            error: true,
            message: error,
        });
    }
};


// create properties
exports.createProperty = async function (req, res) {
    const propertyOwnerId = req.user.id;

    // TODO:validate request object

    const { address, city, state, property_category, property_type, description, photo_urls, total_number_of_spaces } = req.body;

    // prepare new_property object to store in the database
    const new_property_object = {
        address: address,
        city: city,
        state: state,
        property_category: property_category,
        property_type: property_type,
        description: description,
        photo_urls: photo_urls,
        total_number_of_spaces: total_number_of_spaces,
        verification_status: 2,
        propertyowner_id: propertyOwnerId,
    };

    try {
        const new_property = await PropertyOwnerModel.createProperty(new_property_object);
        res.json({
            status: 200,
            insertId: new_property,
            message: "New property registered successfully",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            error: true,
            status: 400,
            message: error,

        });
    }
};


exports.createSpace = async function (req, res) {
    const propertyOwnerId = req.user.id;
    // validate request object
    const { description, rent_fee, caution_fee, space_type, space_commercial_category, maintenance_fee, perks, property_id, unique_space_name, bedroom, bathroom, toilet } = req.body;

    // prepare new space onject
    const new_space_object = {
        space_type: space_type,
        space_commercial_category: space_commercial_category,
        description: description,
        rent_fee: rent_fee,
        caution_fee: caution_fee, // todo:expect percentage
        maintenance_fee: maintenance_fee, // todo: expect percentage
        perks: perks,
        bedroom: bedroom,
        bathroom: bathroom,
        toilet: toilet,
        unique_space_name: unique_space_name,
        property_id: property_id,
        propertyowner_id: propertyOwnerId,
        date_created: new Date()
    };

    try {
        const new_space = await PropertyOwnerModel.createSpace(new_space_object);
        res.json({
            status: 200,
            insertId: new_space,
            message: "New space registered successfully",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            error: true,
            status: 400,
            message: "error registering new space",
        });
    }
};

// create tenants
exports.createTenant = async function (req, res) {
    const propertyOwnerId = req.user.id;

    // validate request object
    const { firstname, lastname, email, phone, birthday, occupation, marital_status, no_of_dependents, property_id, space_id } = req.body;

    // prepare new tenant object
    const new_tenant_object = {
        firstname: firstname,
        lastname: lastname,
        email: email,
        phone: phone,
        birthday: birthday,
        occupation: occupation,
        marital_status: marital_status,
        no_of_dependents: no_of_dependents,
        space_id: space_id,
        property_id: property_id,
        propertyowner_id: propertyOwnerId,
    };

    try {
        const new_tenant = await PropertyOwnerModel.createTenant(new_tenant_object);
        res.json({
            status: 200,
            insertId: new_tenant,
            message: "New tenant registered successfully",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            error: true,
            status: 400,
            message: "error registering new tenant",
        });
    }
};


exports.rent = async function (req, res) {
    const propertyOwnerId = req.user.id;

    // validate request body
    const { amount_paid, tenant_id, space_id, duration } = req.body;

    // formulate date
    const today = new Date();
    const expired = new Date(today);
    let payment_date;
    let expired_date;

    try {
        switch (duration) {
        case "2 days":
            payment_date = today;
            expired.setDate(expired.getDate() + 2); // rent duration is two days
            expired_date = expired;

            break;

        case "1 year":
            payment_date = today;
            expired.setMonth(expired.getMonth() + 12); // rent duration is 1 year
            expired_date = expired;

            break;

        case "2 years":
            payment_date = today;
            expired.setMonth(expired.getMonth() + 24); // rent duration is 2 years
            expired_date = expired;
            break;

        default:
            throw ("rent duration is not recognized");
        }

        // prepare new_rent object
        const new_rent_object = {
            amount_paid: amount_paid,
            duration: duration,
            payment_date: payment_date,
            expired_date: expired_date,
            tenant_id: tenant_id,
            space_id: space_id,
            propertyowner_id: propertyOwnerId,
        };

        const new_rent = await PropertyOwnerModel.rent(new_rent_object);
        res.json({
            status: 200,
            insertId: new_rent,
            message: "new rent successful",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            error: true,
            status: 400,
            message: "error occured while creating new rent",
        });
    }
};


// do better evaluation on the process flow of this
exports.createCustomRecurringBill = async function (req, res) {
    const propertyOwnerid = req.user.id;


    // validate request object
    // date should be in the right format, preferably "yyyy-mm-dd" format for acurate processing.
    const { bill_category, bill_description, bill_amount, last_bill_payment_date, bill_payment_interval, property_id, space_id } = req.body;

    // how do we update the last_payment_date ?


    // prepare new_recurring_payment object
    const new_recurring_bill_object = {
        bill_category: bill_category,
        bill_description: bill_description,
        bill_amount: bill_amount,
        last_bill_payment_date: last_bill_payment_date,
        bill_payment_interval: bill_payment_interval,
        property_id: property_id,
        space_id: space_id,
        propertyowner_id: propertyOwnerid,
    };

    try {
        const new_recurring_bill = await PropertyOwnerModel.createCustomRecurringBill(new_recurring_bill_object);
        res.json({
            status: 200,
            insertId: new_recurring_bill,
            message: "New recurring bill registered successfully, we will send you reminders when your next payment is almost due",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            error: true,
            status: 400,
            message: "Error registering custom recurring bill",
        });
    }
};


// create maintenance todos
exports.create_maintenance_todos = async function (req, res) {
    const propertyOwnerId = req.user.id;

    // validate data
    // no need for the property_id. consider removing it
    const { maintenance_category, maintenance_description, space_id, property_id } = req.body;

    // prepare new maintenance_todo object
    const new_maintenance_todo_object = {
        maintenance_category: maintenance_category,
        maintenance_description: maintenance_description,
        date_created: new Date(),
        space_id: space_id,
        property_id: property_id,
        maintenance_status: "Pending",
        propertyowner_id: propertyOwnerId,
    };

    try {
        const new_maintenance_todo = await PropertyOwnerModel.create_maintenance_todo(new_maintenance_todo_object);
        res.json({
            status: 200,
            insertId: new_maintenance_todo,
            message: "New maintenance todo task created sucessfully",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: "Error adding a new maintenance todo task",
        });
    }
};

// get maintenance todo's
exports.get_maintenance_todos = async function (req, res) {
    const propertyOwnerId = req.user.id;
    const cacheKey = `${propertyOwnerId}_maintenance_todos`;
    console.log(cacheKey);

    try {
        const maintenance_todos = await PropertyOwnerModel.get_maintenance_todos(propertyOwnerId);
        if (maintenance_todos.length == 0) {
            throw "there are no maintenance todos";
        }

        // await redisClient.set(cacheKey, JSON.stringify(maintenance_todos), {
        //     EX: 120,
        //     NX: true,
        // });

        res.json({
            status: 200,
            fromCache: false,
            data: maintenance_todos,
        });
    } catch (error) {
        errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: error
        });
    }
};




exports.get_maintenance_requests = async function (req, res) {
    const propertyownerId = req.user.id;
    // eslint-disable-next-line no-unused-vars
    const cacheKey = `${propertyownerId}_maintenance_requests`;

    try {
        // get requests
        const maintenance_requests = await PropertyOwnerModel.get_maintenance_requests(propertyownerId);
        if (maintenance_requests.length == 0) {
            throw "There are no requests";
        }

        // // store in redis
        // await redisClient.set(cacheKey, JSON.stringify(maintenance_requests), {
        //     EX: 120,
        //     NX: true,
        // });

        res.json({
            status: 200,
            fromCache: false,
            data: maintenance_requests,
        });
    } catch (error) {
        errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: "Error getting maintenance requests",
        });

    }
};

exports.accept_maintenance_request = async function (req, res) {
    const propertyOwnerId = req.user.id;
    // eslint-disable-next-line no-unused-vars
    const { maintenance_request_id, maintenance_category, maintenance_description, space_id, property_id, tenant_email, tenant_firstname, tenant_lastname } = req.body;
    const date_accepted = new Date();
    // //prepare new maintenance_todo object
    const new_maintenance_todo_object = {
        maintenance_category: maintenance_category,
        maintenance_description: maintenance_description,
        date_created: new Date(),
        space_id: space_id,
        property_id: property_id,
        maintenance_status: "Pending",
        propertyowner_id: propertyOwnerId,
        maintenance_request_id: maintenance_request_id,
    };


    try {
        await PropertyOwnerModel.accept_maintenance_request(maintenance_request_id, date_accepted);
        const new_maintenance = await PropertyOwnerModel.create_maintenance_todo(new_maintenance_todo_object);


        // send notification to the tenant that the request as been accepted
        let notification_statement = `Hi ${tenant_firstname}, we are pleased to inform you that your 
        maintenance request under the category of "${maintenance_category}" and description of "${maintenance_description}" has been accepted`;

        await APMSFunctions.tenantMaintenanceRequestStatusNotification("Maintenance Request Accepted 😚", tenant_email,tenant_firstname,notification_statement);

        res.json({
            status: 200,
            insertId: new_maintenance,
            message: "Request accepted and maintenance task added to your maintenance todo list",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: "error accepting maintenance request",
        });
    }
};

exports.decline_maintenance_request = async function (req, res) {
    const date_declined = new Date();

    // eslint-disable-next-line no-unused-vars
    const {maintenance_category, maintenance_description, maintenance_decline_reason, maintenance_request_id, tenant_email, tenant_firstname, tenant_lastname } = req.body;

    try {
        await PropertyOwnerModel.decline_maintenance_request(maintenance_request_id, maintenance_decline_reason, date_declined);

        // send notification to tenant with the reason for decline
        let notification_statement = `Hi ${tenant_firstname}, we are sorrry to inform you that your maintenance request under the category of "${maintenance_category}"
         and description of "${maintenance_description}" has been Declined. <br/> Decline reason:${maintenance_decline_reason}`;

        await APMSFunctions.tenantMaintenanceRequestStatusNotification("Maintenance Request Rejected 🙁", tenant_email,tenant_firstname,notification_statement);
        
        res.json({
            status: 200,
            message: "maintenance request declined successfully",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: "Error declining maintenance request",
        });
    }
};

// update maintenance_todo status and notify tenant of status
exports.update_maintenance_todo = async function (req, res) {
    // eslint-disable-next-line no-unused-vars
    let propertyOwnerId = req.user.id;

    const { maintenanceId, maintenance_category, maintenance_description, maintenance_cost, maintenance_status, maintenance_request_id } = req.body;
    // prepare updated data

    const updated_maintenance_todo_object = {
        maintenance_category: maintenance_category,
        maintenance_description: maintenance_description,
        maintenance_cost: maintenance_cost,
        maintenance_status: maintenance_status,
        last_updated: new Date(),
    };

    try {
        if (maintenance_status == "Completed" & maintenance_request_id != "null") {
            // get todays date
            const date_completed = new Date(); // review this. consider if the propertyowner shoould be the one to manually enter the date

            await PropertyOwnerModel.update_maintenance_todo(updated_maintenance_todo_object, date_completed, maintenanceId);

            // update maintenance_request
            await PropertyOwnerModel.update_maintenance_request(maintenance_status, date_completed, maintenance_request_id);

            // get maintenance_request info to access the tenant details
            const maintenance_request = await PropertyOwnerModel.get_maintenance_request(maintenance_request_id);

            console.log(maintenance_request);

            // send notification to tenant
            // eslint-disable-next-line max-len
            let notification_statement = `Hi ${maintenance_request[0].tenant_firstname}, this is to inform you that your maintenance request under the category of "${maintenance_request[0].category}" with the descripiton of "${maintenance_request[0].description}" has been acted on and the status is:"${maintenance_request[0].maintenance_status}"`;
            // eslint-disable-next-line max-len
            await APMSFunctions.tenantMaintenanceRequestStatusProgressNotification(maintenance_request[0].tenant_email, maintenance_request[0].tenant_firstname, notification_statement);

            res.json({
                status: 200,
                message: `Maintenance todo update is successful: the task is ${maintenance_status}`,
            });
        } else if (maintenance_status == "OnGoing" & maintenance_request_id != "null") {
            // there will be not date of completion since the todo task is still onGoing
            const date_completed = "";

            await PropertyOwnerModel.update_maintenance_todo(updated_maintenance_todo_object, maintenanceId);

            // update maintenance_request
            await PropertyOwnerModel.update_maintenance_request(maintenance_status, date_completed, maintenance_request_id);

            // get maintenance_request info to access the tenant details
            const maintenance_request = await PropertyOwnerModel.get_maintenance_request(maintenance_request_id);

            console.log(maintenance_request);

            // send notification to tenant
            // eslint-disable-next-line max-len
            let notification_statement = `Hi ${maintenance_request.tenant_firstname}, this is to inform you that your maintenance request under the category of "${maintenance_request.category}" with the descripiton of "${maintenance_request.maintenance_description}" is being acted on and the current status is:"${maintenance_request.maintenance_status}"`;
            // eslint-disable-next-line max-len
            await APMSFunctions.tenantMaintenanceRequestStatusProgressNotification(maintenance_request.tenant_email, maintenance_request.tenant_firstname, notification_statement);

            res.json({
                status: 200,
                message: `Maintenance todo update is successful: the task is ${maintenance_status}`,
            });
        } else {
            // if the maintenance todo wasn't requested by a tenant
            await PropertyOwnerModel.update_maintenance_todo(updated_maintenance_todo_object, maintenanceId);
            res.json({
                status: 200,
                message: "Maintenance todo update is successful",
            });
        }
    } catch (error) {
        errors.report(error);
        res.json({
            error: true,
            status: 400,
            message: "Error updating maintenance todo task",
        });
    }
};

// //payment integration/function


