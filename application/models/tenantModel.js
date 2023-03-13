"use strict";
const sql = require("../databaseConnection");

class TenantModel {

    constructor(tenant){
        this.firstname = tenant.firstname;
        this.lastname = tenant.lastname;
        this.tenancy_type = tenant.tenancy_type;
        this.tenancy_status = tenant.tenancy_status;
        this.email = tenant.email;
        this.phone = tenant.phone;
        this.password = tenant.password;
        this.birthday = tenant.birthday;
        this.occupation = tenant.occupation;
        this.marital_status = tenant.marital_status;
        this.no_of_dependants = tenant.no_of_dependants;
    }

    static async create_tenant(new_tenant){
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO tenants set ?", new_tenant, function (err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("model function create new tenant request result insertId: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }

    static async get_property_spaces() {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line max-len
            sql.query("SELECT spaces.id as space_id, spaces.unique_space_name, spaces.photos as spaces_photos, properties.id as property_id, properties.address as property_address, properties.photo_urls as property_photo,propertyowners.firstname as propertyowner_firstname, propertyowners.lastname as propertyonwer_lastname, propertyowners.email as propertyowners_email FROM spaces LEFT JOIN properties on spaces.property_id = properties.id LEFT JOIN propertyowners on spaces.propertyowner_id = propertyowners.id", function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("property spaces result: ", res);
                    return resolve(res);
                }
            });
        });
    }

    static async getPropertyOwnerInfo(propertyOwner_id) {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line max-len
            sql.query("SELECT firstname, email from propertyowners where id = ?", [propertyOwner_id], function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("property owner info result: ", res);
                    return resolve(res);
                }
            });
        });
    }

    
    static async loginTenant(email) {
        return new Promise((resolve, reject) => {
            sql.query("SELECT id,firstname,lastname,email,phone,password,tenancy_type FROM tenants where email = ?", [email], function(err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("login tenant result: ", res);
                    return resolve(res);
                }
            });
        });
    }

    static async application(new_application){
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO applications set ?", new_application, function (err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("model function new application result insertId: ", res.insertId);
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

    static async rents() {
        // let now = new Date()
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line max-len
            sql.query("Select rents.tenant_id, rents.space_id, rents.propertyowner_id, rents.expired_date, tenants.firstname, tenants.lastname, tenants.email, spaces.unique_space_name,spaces.property_id, properties.address, propertyowners.email as propertyowner_email FROM rents LEFT JOIN tenants on rents.tenant_id = tenants.id LEFT JOIN spaces on rents.space_id = spaces.id LEFT JOIN properties on spaces.property_id = properties.id LEFT JOIN propertyowners on rents.propertyowner_id = propertyowners.id WHERE rents.rent_status='Approved';",
                function(err, res) {
                    if (err) {
                        console.log("error: ", err);
                        return reject(err);
                    } else {
                        console.log("model function get rents result: ", res);
                        return resolve(res);
                    }
                });
        });
    }
    

    static async create_maintenance_request(new_mentainance_request){
        return new Promise((resolve, reject) => {
            sql.query("INSERT INTO maintenance_requests set ?", new_mentainance_request, function (err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("model function new maintenance request result insertId: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }

    static async file_complaint(new_complaint){
        return new Promise((resolve, reject)=>{
            sql.query("INSERT INTO maintenance_requests set ?", new_complaint, function (err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("model function new complain request result insertId: ", res.insertId);
                    return resolve(res.insertId);
                }
            });
        });
    }
}



module.exports = TenantModel;