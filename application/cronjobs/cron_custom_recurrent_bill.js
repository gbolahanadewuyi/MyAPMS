/* eslint-disable max-len */
// eslint-disable-next-line no-unused-vars
const {
    ErrorReporting
} = require("@google-cloud/error-reporting");
const errors = new ErrorReporting();
//import models
const PropertyOwnerModel = require("../models/propertyOwnerModel");
//import functions
const APMSFunctions = require("../functions/apmsFunctions");



exports.gae_custombill_cronjob = async function (req, res) {
    const today = new Date();
    let expired_date;
    let custom_expired_date;

    try {
        let custom_bills = await PropertyOwnerModel.get_custom_bills();
        console.log(custom_bills);

        for (let i = 0; i < custom_bills.length; i++) {
            console.log(custom_bills.length);
            console.log(custom_bills[i].bill_payment_interval);

            switch (custom_bills[i].bill_payment_interval) {
            case "1 month":
                expired_date = new Date(custom_bills[i].last_bill_payment_date);
                // console.log(expired_date);
                //add a month to the last payment date
                expired_date.setMonth(expired_date.getMonth() + 1);
                console.log(expired_date);

                //deduct a week from the expiring date
                custom_expired_date = new Date(expired_date);
                custom_expired_date.setDate(custom_expired_date.getDate() - 7);
                console.log(custom_expired_date);


                break;

            default:
                break;
            }

            if (today < expired_date & today >= custom_expired_date) {

                //calculate date differenece between the expired_date and today's date
                var date1 = new Date();
                var date2 = new Date(expired_date);

                // To calculate the time difference of two dates
                var difference_in_time = date2.getTime() - date1.getTime();
                // To calculate the no. of days between two dates
                var difference_in_days = difference_in_time / (1000 * 3600 * 24);

                var number_of_days_text = await getNumberOfDays(difference_in_days);

                //prepare reminder statement
                let reminder_statement = `Hi ${custom_bills[i].firstname}, this is a quick reminder that the ${custom_bills[i].bill_category} of ${custom_bills[i].bill_description} bill with the amount of N${custom_bills[i].bill_amount} is ${number_of_days_text}, do well to quickly make payments.`;

                console.log(reminder_statement);
                //send notification
                await APMSFunctions.sendPropertyOwnerCustomBillReminder(custom_bills[i].name, custom_bills[i].email, reminder_statement );

            } else if (today >= expired_date) {
                //prepare reminder statement
                let reminder_statement = `Hi ${custom_bills[i].firstname}, this is a quick reminder that the ${custom_bills[i].bill_category} of ${custom_bills[i].bill_description} bill with the amount of N${custom_bills[i].bill_amount} is still yet to be sorted out, please do well to quickly make payments and if you have already made payments, kindly update the bill information by entering the last payment date`;
                console.log(reminder_statement);
                await APMSFunctions.sendPropertyOwnerCustomBillReminder(custom_bills[i].name, custom_bills[i].email, reminder_statement );
            }

        }

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
        return "due today";
    } else if (number_of_days == 1) {
        return "due in one day";
    } else if (number_of_days > 1) {
        return `due in ${number_of_days} days`;
    }

}
