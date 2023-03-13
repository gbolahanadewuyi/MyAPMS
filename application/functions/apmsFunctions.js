"use strict";
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { SENDINGBLUE_API_KEY } = require("../config");
var SibApiV3Sdk = require("sib-api-v3-sdk");
SibApiV3Sdk.ApiClient.instance.authentications["api-key"].apiKey = SENDINGBLUE_API_KEY;
const { ErrorReporting } = require("@google-cloud/error-reporting");
const errors = new ErrorReporting();

// import .env variables



// import models
const PropertyOwnerModel = require("../models/propertyOwnerModel");
// eslint-disable-next-line no-unused-vars
const TenantModel = require("../models/tenantModel");


exports.hashPassword = async function(password) {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        errors.report(error);
        throw error;
    }
};

exports.validateHashedPassword = async function(password, hashedPassword) {
    try {
        const hashedPasswordValidation = await bcrypt.compare(password, hashedPassword);
        return hashedPasswordValidation;
    } catch (error) {
        errors.report(error);
        throw error;
    }
};

exports.subscribeNewPropertyOwner = async function(propertyOwnerId) {
    // define free subscription module id
    const subscription_module_id = 1;

    // formulate date
    const today = new Date();
    const expired = new Date(today);
    let purchase_date;
    let expired_date;

    try {
        const subsciption_module = await PropertyOwnerModel
            .checkSubscriptionModule(subscription_module_id);
        const subscription_type = subsciption_module.subscription_type;
        const subscription_price = subsciption_module.subscription_price;
        purchase_date = today;
        expired.setDate(expired.getDate() + 14); // subscription duration is 2 weeks (14 days)
        expired_date = expired;

        // prepare data for new subscription
        const new_subscription_data = {
            "subscription_module_id": subscription_module_id,
            "propertyOwner_id": propertyOwnerId,
            "subscription_type": subscription_type,
            "subscription_price": subscription_price,
            "purchase_date": purchase_date,
            "expired_date": expired_date,
        };
        // subscribe user
        const new_subscription = await PropertyOwnerModel.subscribe(new_subscription_data);
        return new_subscription;
    } catch (error) {
        errors.report(error);
        throw error;
    }
};


exports.sendPropertyOwnerRentRegEmail= async function (propertyownerfirstname, propertyowneremail, tenantname){
    console.log(propertyowneremail);
    try {
        let email = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"New Tenant Rent Registration",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": "{{params.propertyownerfirstname}}", "email":`${propertyowneremail}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : "<html><body><h1>Hi {{params.propertyownerfirstname}} you have a new tenant called {{params.tenantname}} who just registered, confirm the tenant's rent details so the tenant can have access to apms features</h1></body></html>",
                "params" : {
                    "propertyownerfirstname": propertyownerfirstname,
                    "propertyowneremail": propertyowneremail,
                    "tenantname": tenantname,
                },
                
            }
        );
        console.log(email);
    } catch (error) {
        errors.report(error);
    }
    
};

exports.sendTenantWelcomeEmail = async function (email,name){
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"Welcome to APMS",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": "{{params.tenant_name}}", "email":`${email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : "<html><body><h1>Hi {{params.tenant_name}} your account has been registered successfully, log on to apms to access its features</h1></body></html>",
                "params" : {
                    "tenant_name": name,
                },
                
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    }
};

exports.sendPropertyOwnerWelcomeEmail = async function (email,name){
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"Welcome to APMS",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": "{{params.propertyowner_name}}", "email":`${email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : "<html><body><h1>Hi {{params.propertyowner_name}} your account has been registered successfully, log on to apms to access its features</h1></body></html>",
                "params" : {
                    "propertyowner_name": name,
                },
                
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    }
};

exports.sendRentExpiringNoticeEmail = async function (tenant_name, tenant_email, number_of_days_text, propertyowner_email){
    console.log(tenant_name, tenant_email, number_of_days_text, propertyowner_email);
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"Expiring Rent Reminder 🥸",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": `${tenant_name}`, "email":`${tenant_email}`}],
                "cc": [{"email":`${propertyowner_email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : `<html><body><h1>Dear ${tenant_name}, We hope this email finds your well <br/> <strong>your rent is ${number_of_days_text}, please do well to make payments in order to avoid any form of embarassement thank you</strong></h1></body></html>`,
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    }
};

exports.sendQuitNoticeMail = async function (tenant_name, tenant_email, propertyowner_email){
    console.log(tenant_email);
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"Quit Notice 😔",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": `${tenant_name}`, "email":`${tenant_email}`}],
                "cc": [{"email":`${propertyowner_email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : `<html><body><h1>Dear ${tenant_name}, <br/> We hope this email finds you well. <br/> <strong> This is to inform you that your rent has expired. Please not that you are to pack out of the house in 7 days</strong></h1></body></html>`,
            
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    }
};

exports.sendPropertyOwnerCustomBillReminder = async function (name, email,reminder_statement){
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"Bill Payment Reminder 🙃",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": `${name}`, "email":`${email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : `<html><body><h1>${reminder_statement}</h1></body></html>`,  
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    }
};

exports.sendPropertyOwnerMaintenanceRequestNotificationEmail = async function (propertyowner_name, propertyowner_email, notification_statement, tenant_email){
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"New Maintenance Request!",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": `${propertyowner_name}`, "email":`${propertyowner_email}`}],
                "cc": [{"email":`${tenant_email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : `<html><body><h1>${notification_statement}</h1></body></html>`,  
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    }
};



exports.tenantMaintenanceRequestStatusNotification = async function(subject, email, name, notification_statement){
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":subject,
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": `${name}`, "email":`${email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : `<html><body><h1>${notification_statement}</h1></body></html>`,  
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    }
};

exports.tenantMaintenanceRequestStatusProgressNotification = async function(email, name, notification_statement){
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"Maintenance Request Progress Report",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": `${name}`, "email":`${email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : `<html><body><h1>${notification_statement}</h1></body></html>`,  
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    } 
};

exports.sendPropertyOwnerNewComplaintNotificationEmail = async function (propertyowner_name, propertyowner_email, notification_statement){
    try {
        let mail = await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail(
            {
                "subject":"New Complaint!",
                "sender" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "replyTo" : {"email":"badboygbolahan@gmail.com", "name":"MyAPMS"},
                "to" : [{"name": `${propertyowner_name}`, "email":`${propertyowner_email}`}],
                // eslint-disable-next-line max-len
                "htmlContent" : `<html><body><h1>${notification_statement}</h1></body></html>`,  
            }
        );
        console.log(mail);
    } catch (error) {
        errors.report(error);
    }
};

