'use strict';

const OverwatchModel = require("../models/overwatchModel");

exports.list_all_propertyOwners = async function (req, res) {
    const allPropertyOwners = "allPropertyOwners" //key for storing propertyowners data in redis
    let propertyOwners;
    try {
        propertyOwners = await OverwatchModel.getAllPropertyOwners()

        if (propertyOwners.length == 0) {
            throw "There is no data";
        }
        console.log("writing into redis")
        await redisClient.set(allPropertyOwners, JSON.stringify(propertyOwners), {
            EX: 120,
            NX: true
        });

        res.send({
            status: 200,
            fromCache: false,
            data: propertyOwners
        });
    } catch (e) {
        console.log(e)
        res.send({
            status: 400,
            message: `error: ${e} `
        })
    }

}

