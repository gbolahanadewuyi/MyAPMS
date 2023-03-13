// eslint-disable-next-line no-unused-vars
const nodeCron = require("node-cron");
const {
    ErrorReporting
} = require("@google-cloud/error-reporting");
const errors = new ErrorReporting();

const TenantModel = require("../models/tenantModel");
const APMSFunctions = require("../functions/apmsFunctions");



exports.gae_rent_cronjob = async function (req,res){
    console.log("running rent task 10am every day");
    const today = new Date();

    try {
        let rents = await TenantModel.rents();
        // console.log(rents);

        for (let i = 0; i < rents.length; i++) {
            const expired_date = new Date(rents[i].expired_date);
            const custom_expired_date = new Date(expired_date);
            custom_expired_date.setDate(custom_expired_date.getDate() - 7); //deduct 7 days(a week) from the expiring date

            //if today's date is greater than or equal to a week from the actual expired_date, send an email reminder
            if (today < expired_date & today >= custom_expired_date) {

                //calculate date differenece between the expired_date and today's date
                var date1 = new Date();
                var date2 = new Date(rents[i].expired_date);

                // To calculate the time difference of two dates
                var difference_in_time = date2.getTime() - date1.getTime();
                // To calculate the no. of days between two dates
                var difference_in_days = difference_in_time / (1000 * 3600 * 24);

                var number_of_days_text = await getNumberOfDays(difference_in_days);


                console.log(`Hi ${rents[i].firstname}, your rent is ${number_of_days_text}, please do well to make payments in order to avoid any form of embarassement thank you`);
                await APMSFunctions.sendRentExpiringNoticeEmail(rents[i].firstname, rents[i].email, number_of_days_text, rents[i].propertyowner_email);
    
            } else if (today >= expired_date) {
                console.log(`Hi ${rents[i].firstname}, your rent has expired, note that you are to pack out of the house in 7 days`);
                await APMSFunctions.sendQuitNoticeMail(rents[i].firstname, rents[i].email, rents[i].propertyowner_email);
            }

            
        }
        console.log("cron task completed");
        res.status(200).end();
    } catch (error) {
        errors.report(error);
        res.status(400).end();
    }
};

async function getNumberOfDays(value) {
    console.log(value);
    var number_of_days = parseInt(value.toString().split(".")[0]);
    if (number_of_days <= 0) {
        return "expiring today";
    } else if (number_of_days == 1) {
        return "expiring in one day";
    } else if (number_of_days > 1) {
        return `expiring in ${number_of_days} days`;
    }

}





//asteriks represents different unit time
// * * * * * *
// | | | | | |
// | | | | | day of week
// | | | | month
// | | | day of month
// | | hour
// | minute
// second ( optional )

//schedule task to check for expiring rents every morning
// exports.cronRent = nodeCron.schedule("* * * * *", async function () {
//     console.log("running a task 10am every day");
//     const today = new Date();

//     try {
//         let rents = await TenantModel.rents();
//         // console.log(rents);

//         for (let i = 0; i < rents.length; i++) {
//             const expired_date = new Date(rents[i].expired_date);
//             const custom_expired_date = new Date(expired_date);
//             custom_expired_date.setDate(custom_expired_date.getDate() - 7); //deduct 7 days(a week) from the expiring date

//             // console.log({
//             //     custom_expired_date: custom_expired_date,
//             //     expired_date: expired_date
//             // })
//             // console.log(custom_expired_date);

//             //if today's date is greater than or equal to a week from the actual expired_date, send an email reminder
//             if (today < expired_date & today >= custom_expired_date) {

//                 //calculate date differenece between the expired_date and today's date
//                 var date1 = new Date();
//                 var date2 = new Date(rents[i].expired_date);

//                 // To calculate the time difference of two dates
//                 var difference_in_time = date2.getTime() - date1.getTime();
//                 // To calculate the no. of days between two dates
//                 var difference_in_days = difference_in_time / (1000 * 3600 * 24);

//                 var number_of_days_text = await getNumberOfDays(difference_in_days);


//                 console.log(`Hi ${rents[i].firstname}, your rent is ${number_of_days_text}, please do well to make payments in order to avoid any form of embarassement thank you`);
//                 // await APMSFunctions.sendRentExpiringNoticeEmail(rents[i].firstname, rents[i].email, number_of_days_text, rents[i].propertyowner_email);

//             } else if (today >= expired_date) {
//                 console.log(`Hi ${rents[i].firstname}, your rent has expired, note that you are to pack out of the house in 7 days`);
//                 // await APMSFunctions.sendQuitNoticeMail(rents[i].firstname, rents[i].email, rents[i].propertyowner_email);
//             }
//         }
//     } catch (error) {
//         errors.report(error);
//     }
// }, {
//     scheduled: false
// });


