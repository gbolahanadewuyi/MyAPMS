"use strict";

const sql = require("../databaseConnection");


class OverwatchModel {
    constructor(overwatchAdmin) {
        this.firstname = overwatchAdmin.firstname;
        this.lastname = overwatchAdmin.lastname;
        this.phone = overwatchAdmin.phone;
        this.email = overwatchAdmin.email;
        this.password = overwatchAdmin.password;
        this.userType = overwatchAdmin.userType;
    }


    static getAllPropertyOwners() {
        return new Promise((resolve, reject) => {
            sql.query("SELECT * FROM propertyowners", function (err, res) {
                if (err) {
                    console.log("error: ", err);
                    return reject(err);
                } else {
                    console.log("model propertyOwners result: ", res);
                    return resolve(res);
                }
            });
        });

    }

    
}

module.exports = OverwatchModel;