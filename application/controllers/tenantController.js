"use strict";
const {
    ErrorReporting
} = require("@google-cloud/error-reporting");
const errors = new ErrorReporting();
const jwt = require("jsonwebtoken");
const redis = require("redis");
const {
    JWT_SECRET
} = require("../config"); // import environment variables

// import models
const TenantModel = require("../models/tenantModel");

//import functions
const APMSFunctions = require("../functions/apmsFunctions");

// connect to redis
let redisClient;

// define anonymous self-invoked async function to initialize/connect to redis
(async () => {
    redisClient = redis.createClient();
    redisClient.on("error", (error) => console.error(`Error : ${error}`));
    await redisClient.connect();
})();





exports.registration = async function (req, res) {
    //TODO: validate request body

    const new_tenant = new TenantModel(req.body.bio_data);
    const new_tenant_rents = req.body?.rents;

    if (!new_tenant.email || !new_tenant.phone || !new_tenant.password) {
        res.json({
            status: 401,
            error: true,
            message: "Please provide your email,phonenumber,and password",
        });
    } else {
        try {
            const hashedPassword = await APMSFunctions.hashPassword(new_tenant.password);
            new_tenant["password"] = hashedPassword;
            new_tenant["date_created"] = new Date();
            new_tenant["tenancy_status"] = "Pending";

            //verify id: integrate api to verify id's

            //register new tenant
            let tenant = await TenantModel.create_tenant(new_tenant);
            //send email to new user

            if (new_tenant_rents?.length >= 1) {
                for (let i = 0; i < new_tenant_rents.length; i++) {
                    const payment_date = new Date(new_tenant_rents[i].payment_date);
                    const expired = new Date(payment_date);
                    let expired_date;

                    switch (new_tenant_rents[i].duration) {
                    case "2 days":
                        expired.setDate(expired.getDate() + 2); // rent duration is two days
                        expired_date = expired;

                        break;

                    case "1 year":
                        expired.setMonth(expired.getMonth() + 12); // rent duration is 1 year
                        expired_date = expired;

                        break;

                    case "2 years":
                        expired.setMonth(expired.getMonth() + 24); // rent duration is 2 years
                        expired_date = expired;
                        break;

                    default:
                        throw ("rent duration is not recognized");
                    }

                    // prepare new_rent_object
                    const new_rent_object = {
                        amount_paid: new_tenant_rents[i].amount_paid,
                        duration: new_tenant_rents[i].duration,
                        payment_date: payment_date,
                        expired_date: expired_date,
                        tenant_id: tenant,
                        rent_status: "Pending Approval",
                        space_id: new_tenant_rents[i].space_id,
                        propertyowner_id: new_tenant_rents[i].propertyowner_id,
                    };

                    await TenantModel.rent(new_rent_object);
                    await APMSFunctions
                        .sendPropertyOwnerRentRegEmail(new_tenant_rents[i].propertyowner_firstname, new_tenant_rents[i].propertyowner_email, new_tenant.firstname + " " + new_tenant.lastname);
                }

            }
            await APMSFunctions.sendTenantWelcomeEmail(new_tenant.email, new_tenant.firstname);
            res.json({
                status: 200,
                insertId: tenant,
                message: "New tenant registration is successful",
            });

        } catch (error) {
            errors.report(error);
            res.json({
                status: 400,
                error: true,
                message: error,
            });
        }
    }

};

exports.house_rent_registration = async function (req, res) {
    const tenant_id = req.uer.id;
    const tenant_name = req.user.name;
    const new_tenant_rents = req.body;

    try {
        for (let i = 0; i < new_tenant_rents.length; i++) {
            const payment_date = new Date(new_tenant_rents[i].payment_date);
            const expired = new Date(payment_date);
            let expired_date;
    
            switch (new_tenant_rents[i].duration) {
            case "2 days":
                expired.setDate(expired.getDate() + 2); // rent duration is two days
                expired_date = expired;
    
                break;
    
            case "1 year":
                expired.setMonth(expired.getMonth() + 12); // rent duration is 1 year
                expired_date = expired;
    
                break;
    
            case "2 years":
                expired.setMonth(expired.getMonth() + 24); // rent duration is 2 years
                expired_date = expired;
                break;
    
            default:
                throw ("rent duration is not recognized");
            }
            const new_rent_object = {
                amount_paid: new_tenant_rents[i].amount_paid,
                duration: new_tenant_rents[i].duration,
                payment_date: payment_date,
                expired_date: expired_date,
                tenant_id: tenant_id,
                rent_status: "Pending Approval",
                space_id: new_tenant_rents[i].space_id,
                propertyowner_id: new_tenant_rents[i].propertyowner_id,
            };
    
            await TenantModel.rent(new_rent_object);
            await APMSFunctions.sendPropertyOwnerRentRegEmail(new_tenant_rents[i].propertyownerfirstname, new_tenant_rents[i].propertyowneremail, tenant_name, );
       
        }
        res.json({
            status:200,
            message:"House rent registration successful"
        });
      
    } catch (error) {
        errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: error,
        });
    }
  
};

exports.get_property_spaces = async function (req, res) {
    try {
        let property_spaces = await TenantModel.get_property_spaces();
        res.json({
            status: 200,
            success:true,
            data: property_spaces,
        });
    } catch (error) {
        errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: error,
        });
    }
};

exports.login = async function (req, res) {
    //validate request body
    const {
        email,
        password
    } = req.body;
    if (!email || !password) {
        res.json({
            status: 401,
            error: true,
            message: "Please provide your email and password"
        });
    } else {
        try {
            let tenant = await TenantModel.loginTenant(email);
            if (tenant.length === 0) {
                throw "No user found: wrong email entered";
            }

            const validatedHashedPassword = await APMSFunctions.validateHashedPassword(password, tenant[0].password);
            if (!validatedHashedPassword) {
                throw "Wrong password, please enter your correct password";
            }

            const accessToken = jwt.sign({
                id: tenant[0].id,
                email: tenant[0].email,
                name: tenant[0].firstname + " " + tenant[0].lastname,
                phone: tenant[0].phone,
                tenancy_type: tenant[0].tenancy_type,
            }, JWT_SECRET, {
                expiresIn: "24h",
            });

            res.json({
                status: 200,
                data: tenant[0],
                token: accessToken,
            });

        } catch (error) {
            errors.report(error);
            res.json({
                status: 400,
                error: true,
                message: error
            });
        }
    }

};

exports.application = async function (req, res) {
    const tenant_id = req.user.id;
    //validate request object
    const {
        property_id,
        space_id,
        propertyowner_id,
        application_type
    } = req.body;

    //prepare new_application_object
    let new_application_object = {
        property_id: property_id,
        space_id: space_id,
        propertyowner_id: propertyowner_id,
        tenant_id: tenant_id,
        rent_status: "Approved",
        application_type: application_type,
        date_created: new Date()
    };

    try {
        let new_application = await TenantModel.application(new_application_object);
        res.json({
            status: 200,
            insertId: new_application,
            message: "Application submission successful"
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

exports.rent = async function (req, res) {
    let tenant_id = req.user.id;
    // validate request body
    const {
        amount_paid,
        space_id,
        duration,
        propertyOwnerId
    } = req.body;

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

        const new_rent = await TenantModel.rent(new_rent_object);
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

exports.create_maintenance_request = async function (req, res) {
    const tenant_id = req.user.id;
    const tenant_name = req.user.name;
    const tenant_email = req.user.email;
    // validate data
    const {
        maintenance_request_category,
        maintenance_request_description,
        space_id,
        property_id,
        propertyowner_id
    } = req.body;

    // prepare new_maintenance_request_object
    const new_maintenance_request_object = {
        maintenance_request_category: maintenance_request_category,
        maintenance_request_description: maintenance_request_description,
        tenant_id: tenant_id,
        space_id: space_id,
        property_id: property_id,
        propertyowner_id: propertyowner_id,
        maintenance_request_status: "Pending",
        maintenance_status: "Pending",
        date_created: new Date(),
    };


    try {
        const new_maintenance_request = await TenantModel.create_maintenance_request(new_maintenance_request_object);
        // send notification to propertyowner

        // get propertyowner details
        const propertyOwnerInfo = await TenantModel.getPropertyOwnerInfo(propertyowner_id);
        console.log(propertyOwnerInfo);
        
        //prepare email body
        let notification_statement = `Hi ${propertyOwnerInfo[0].firstname}, your tenant ${tenant_name} just made a maintenance request, quickly go on the website to accept or decline the request`;
        await APMSFunctions.sendPropertyOwnerMaintenanceRequestNotificationEmail(propertyOwnerInfo[0].firstname, propertyOwnerInfo[0].email, notification_statement, tenant_email);

        res.json({
            status: 200,
            insertId: new_maintenance_request,
            message: "New maintenance request created and sent to property owner successfully",
        });
    } catch (error) {
        errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: "Error creating and making maintenance request",
        });
    }
};


exports.file_complaint = async function(req, res){
    const tenant_id = req.user.id;
    const tenant_name = req.user.name;

    //validate data
    const {space_id, complaint_message, propertyowner_name, propertyowner_email} = req.body;

    //prepare new complaint object
    const new_complaint_object = {
        tenant_id:tenant_id,
        space_id:space_id,
        complaint_message:complaint_message,
        date_created: new Date(),
        status: "Pending"
    };
    try {
        let new_complaint = await TenantModel.file_complaint(new_complaint_object);

        //prepare email body to be sent to propertyowner/landlord
        let notification_statement = `Hi ${propertyowner_name}, your tenant ${tenant_name} just filed a new complaint, quickly head to MyAPMS to act on it and respond`;
        await APMSFunctions.sendPropertyOwnerNewComplaintNotificationEmail(propertyowner_name, propertyowner_email,notification_statement);
        res.json({
            status: 200,
            insertId: new_complaint,
            message: "new complaint has been filed",
        });
            
    } catch (error) {
        console.log(error);
        // errors.report(error);
        res.json({
            status: 400,
            error: true,
            message: "Error making a complaint",
        });
        
    }
};