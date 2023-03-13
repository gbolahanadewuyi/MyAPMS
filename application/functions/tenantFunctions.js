"use strict";
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// import .env variables
const {gmailEmail, gmailPassword} = require("../config");

// company name to include in the email
// eslint-disable-next-line no-unused-vars
const APP_NAME = "APMS";
// configure email transport
const email = gmailEmail;
const password = gmailPassword;
// eslint-disable-next-line no-unused-vars
const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: email,
        password: password,
    },
});


// import models
// eslint-disable-next-line no-unused-vars
const TenantModel = require("../models/tenantModel");


exports.hashPassword = async function(password) {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

exports.validateHashedPassword = async function(password, hashedPassword) {
    try {
        const hashedPasswordValidation = await bcrypt.compare(password, hashedPassword);
        return hashedPasswordValidation;
    } catch (error) {
        console.log(error);
        throw error;
    }
};