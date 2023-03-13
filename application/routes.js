"use strict";
const { ErrorReporting } = require("@google-cloud/error-reporting");
const errors = new ErrorReporting({
    reportMode: "always",
});
//create an instance of jwt
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");

//import models
const PropertyOwnerModel = require("./models/propertyOwnerModel");

//rent cron job
const rentCronJob = require("./cronjobs/cron-rent");
// rentCronJob.cronRent.start();
const customBillCron = require("./cronjobs/cron_custom_recurrent_bill");
// customBillCron.cronCustomRecurringBill.start();



//create an instance of redis to access its methods
// eslint-disable-next-line no-unused-vars
const redis = require("redis");

//connect to redis
// eslint-disable-next-line no-unused-vars
let redisClient;

//define anonymous self-invoked async function to initialize/connect to redis
// (async () => {
//     redisClient = redis.createClient();
//     redisClient.on("error", (error) => console.error(`Error : ${error}`));
//     await redisClient.connect();
// })();


module.exports = function (app) {
    const PropertyController = require("./controllers/propertyOwnerController");
    const OverwatchController = require("./controllers/overwatchController");
    const TenantController = require("./controllers/tenantController");

    //middlewares
    //authentication middleware
    const authenticateUser = (req, res, next) => {
        //log request path
        console.log(req.path);
        
        if (req.path == "/cron/rent_cron" || req.path == "/cron/custombill_cron") {
            console.log(req.headers);
            if (!req.header("x-cloudscheduler") || req.header("x-cloudscheduler") !== "true" ) {
                res.status(403).json({
                    status:403,
                    message:"Unauthorized: only cloud schedular can access this url"
                });
            }else{
                next();
            }
        }
        else if (
            req.path == "/propertyowners/registration" ||
            req.path == "/propertyowners/login" ||
            req.path == "/tenants/registration" ||
            req.path == "/tenants/login"
        ) {
            next();
        } else if (
            !req.headers.authorization ||
            !req.headers.authorization.startsWith("Bearer ")
        ) {
            res.json({
                status: 403,
                message: "Unauthorized",
            });
        } else {
            const token = req.headers.authorization.split("Bearer ")[1];
            console.log(token);

            jwt.verify(token, JWT_SECRET, (err, user) => {
                if (err) {
                    errors.report(err);
                    res.json({
                        status: 403,
                        message: "Error: expired or incorrect token",
                    });
                } else {
                    //add the user object to the request. user info can be fetched from req.user on endpoints
                    req.user = user;
                    next();
                }
            });
        }
    };

    //check if user has subscribed
    const isPropertyOwnerSubscribed = async (req, res, next) => {
        if (
            req.path == "/propertyowners/registration" ||
            req.path == "/propertyowners/login" ||
            req.path == "/propertyowners/subscribe" ||
            req.path == "/tenants/registration" ||
            req.path == "/tenants/login" ||
            req.path == "/cron/rent_cron" ||
            req.path == "/cron/custombill_cron" ||
            req.path == "/tenants/maintenance_request" ||
            req.path == "/tenants/apply" ||
            req.path == "/overwatch/*"
        ) {
            next();
        } else {
            let propertyOwnerId = req.user.id;

            try {
                let hasValidSubscription = await PropertyOwnerModel.isSubscribed(
                    propertyOwnerId
                );
                if (hasValidSubscription.length == 0) {
                    res.json({
                        status: 403,
                        error: true,
                        message: "User has no active subscription",
                    });
                } else {
                    console.log("user has an active subscription");
                    next();
                }
            } catch (error) {
                errors.report(error);
                res.send({
                    status: 404,
                    error: true,
                    message: "IsSubscribed error",
                });
            }
        }
    };

    //data caching middleware
    // async function cacheData(req, res, next) {
    //     if (
    //         req.path == "/propertyowners/registration" ||
    //         req.path == "/propertyowners/login" ||
    //         req.path == "/tenants/registration" ||
    //         req.path == "/tenants/login"
    //     ) {
    //         next();
    //     } else {
    //         console.log("checking cashed data");
    //         let userId = req.user.id;
    //         let cacheparams = req.query.cachekey;
    //         let cachekey = `${userId}_${cacheparams}`;
    //         console.log(cachekey);

    //         // const allProredpertyOwners = "allPropertyOwners";

    //         let cachedData;
    //         try {
    //             const cacheResults = await redisClient.get(cachekey);
    //             if (cacheResults) {
    //                 cachedData = JSON.parse(cacheResults);
    //                 res.send({
    //                     status: 200,
    //                     fromCache: true,
    //                     data: cachedData,
    //                 });
    //             } else {
    //                 next();
    //             }
    //         } catch (error) {
    //             errors.report(error);
    //             res.send({
    //                 status: 404,
    //                 error: true,
    //                 message: "Redis error",
    //             });
    //         }
    //     }
    // }

    app.use(authenticateUser);
    app.use(isPropertyOwnerSubscribed);
    // app.use(cacheData);



    //User routes
    app.route("/propertyowners/registration")
        .post(PropertyController.create_a_propertyOwner);

    app.route("/propertyowners/login")
        .post(PropertyController.login);

    app.route("/propertyowners/subscribe")
        .post(PropertyController.subscribe);

    app.route("/propertyowners/property")
        .post(PropertyController.createProperty);

    app.route("/propertyowners/space")
        .post(PropertyController.createSpace);

    app.route("/propertyowners/tenant")
        .post(PropertyController.createTenant);

    app.route("/propertyowners/rent")
        .post(PropertyController.rent);

    app.route("/propertyowners/custom_recurring_bill")
        .post(PropertyController.createCustomRecurringBill);

    app.route("/propertyowners/maintenance_todo")
        .post(PropertyController.create_maintenance_todos)
        .get(PropertyController.get_maintenance_todos)
        .put(PropertyController.update_maintenance_todo);

    app.route("/propertyowners/maintenance_requests")
        .get(PropertyController.get_maintenance_requests);

    app.route("/propertyowners/accept_maintenance_request")
        .post(PropertyController.accept_maintenance_request);

    app.route("/propertyowners/decline_maintenance_request")
        .post(PropertyController.decline_maintenance_request);

    //tenants routes
    app.route("/tenants/registration")
        .post(TenantController.registration);
    app.route("/tenants/login")
        .post(TenantController.login);
    app.route("/tenants/apply")
        .post(TenantController.application);
    app.route("/tenants/maintenance_request")
        .post(TenantController.create_maintenance_request);
    app.route("/tenants/rent")
        .post(TenantController.rent);


    //cron routes
    app.route("/cron/rent_cron")
        .post(rentCronJob.gae_rent_cronjob);
    app.route("/cron/custombill_cron")
        .post(customBillCron.gae_custombill_cronjob);  

    //overwatch routes
    app.route("/overwatch/listpropertyowners")
        .get(OverwatchController.list_all_propertyOwners);
};
