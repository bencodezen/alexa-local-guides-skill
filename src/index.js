
// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

var languageStrings = {
    'en': {
        'translation': {
            'WELCOME' : "Welcome to Baltimore, Maryland Guide!",
            'HELP'    : "Say about, to hear more about the city, or say coffee, breakfast, lunch, or dinner, to hear local restaurant suggestions, or say recommend an attraction, or say, go outside. ",
            'ABOUT'   : "Baltimore, Maryland is home to amazing crabcakes and seafood! It has a lot of history and has one of the largest aquariums in the world!",
            'STOP'    : "Okay, see you next time!"
        }
    }
    // , 'de-DE': { 'translation' : { 'TITLE'   : "Local Helfer etc." } }
};
var data = {
    "city"        : "Baltimore",
    "state"       : "MD",
    "postcode"    : "21201",
    "restaurants" : [
        {
            "name": "G&M Restaurant",
            "address": "804 N Hammonds Ferry Rd, Linthicum Heights, MD 21090",
            "phone": "410-636-1777",
            "meals": "lunch, dinner",
            "description": "Hands down the best crabcakes in the area! Closest competitor would be Timbuktu near Hanover, Maryland."
        },
        {
            "name": "Woodberry Kitchen",
            "address": "2010 Clipper Park Rd, Baltimore, MD 21211",
            "phone": "410-464-8000",
            "meals": "lunch, dinner",
            "description": "A farm to table restaurant that serves an array of healthy options for various diets. A little pricey, but a great experience for any foodie!"
        },
        {
            "name": "Miss Shirley's Cafe",
            "address": "750 E Pratt St, Baltimore, MD 21202",
            "phone": "410-528-5373",
            "meals": "breakfast, brunch, lunch",
            "description": "A phenomenal place to go to in order to get your day started! For apple cider fans, make sure to order a hot one with a cinnamon stick in it!"
        },
        {
            "name": "Blue Moon Cafe",
            "address": "1621 Aliceanna St, Baltimore, MD 21231",
            "phone": "410-522-3940",
            "meals": "breakfast, brunch, lunch",
            "description": "Love their french toast here! Definitely don't want to miss out on those!"
        },
        {
            "name": "Canéla",
            "address": "1801 E Lombard St, Baltimore, MD 21231",
            "phone": "443-564-4060",
            "meals": "coffee, breakfast, brunch",
            "description": "An adorable coffee shop that has friendly staff and great coffee to match the service!"
        }

    ],
    "attractions":[
        {
            "name": "Inner Harbor",
            "description": "Take a ride on one of the tour guide boats or just stay on the strip mall along the water and each lots of delicious food!",
            "distance": "0"
        },
        {
            "name": "National Aquarium",
            "description": "One of the largest aquariums in the world. It is definitely a can't miss when you're in the area!",
            "distance": "2"
        },
        {
            "name": "Oriole Park",
            "description": "Watch a game of baseball and then go out for a walk to the Inner Harbor nearby!",
            "distance": "4"
        },
        {
            "name": "Fort McHenry",
            "description": "For those history buffs, you don't want to miss out on visiting this famous fort!",
            "distance": "12"
        }
    ]
}

// Weather courtesy of the Yahoo Weather API.
// This free API recommends no more than 2000 calls per day

var myAPI = {
    host: 'query.yahooapis.com',
    port: 443,
    path: `/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22${encodeURIComponent(data.city)}%2C%20${data.state}%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`,
    method: 'GET'
};
// 2. Skill Code =======================================================================================================

var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
    ///alexa.dynamoDBTableName = 'YourTableName'; // creates new table for session.attributes
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        var say = this.t('WELCOME') + ' ' + this.t('HELP');
        this.emit(':ask', say, say);
    },

    'AboutIntent': function () {
        this.emit(':tell', this.t('ABOUT'));
    },

    'CoffeeIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('coffee'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'For a great coffee shop, I recommend, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'BreakfastIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('breakfast'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'For breakfast, try this, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'LunchIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('lunch'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'Lunch time! Here is a good spot. ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'DinnerIntent': function () {
        var restaurant = randomArrayElement(getRestaurantsByMeal('dinner'));
        this.attributes['restaurant'] = restaurant.name;

        var say = 'Enjoy dinner at, ' + restaurant.name + '. Would you like to hear more?';
        this.emit(':ask', say);
    },

    'AMAZON.YesIntent': function () {
        var restaurantName = this.attributes['restaurant'];
        var restaurantDetails = getRestaurantByName(restaurantName);

        var say = restaurantDetails.name
            + ' is located at ' + restaurantDetails.address
            + ', the phone number is ' + restaurantDetails.phone
            + ', and the description is, ' + restaurantDetails.description
            + '  I have sent these details to the Alexa App on your phone.  Enjoy your meal! <say-as interpret-as="interjection">bon appetit</say-as>' ;

        var card = restaurantDetails.name + '\n' + restaurantDetails.address + '\n'
            + data.city + ', ' + data.state + ' ' + data.postcode
            + '\nphone: ' + restaurantDetails.phone + '\n';

        this.emit(':tellWithCard', say, restaurantDetails.name, card);

    },

    'AttractionIntent': function () {
        var distance = 200;
        if (this.event.request.intent.slots.distance.value) {
            distance = this.event.request.intent.slots.distance.value;
        }

        var attraction = randomArrayElement(getAttractionsByDistance(distance));

        var say = 'Try '
            + attraction.name + ', which is '
            + (attraction.distance == "0" ? 'right downtown. ' : attraction.distance + ' miles away. Have fun! ')
            + attraction.description;

        this.emit(':tell', say);
    },

    'GoOutIntent': function () {

        getWeather( ( localTime, currentTemp, currentCondition) => {
            // time format 10:34 PM
            // currentTemp 72
            // currentCondition, e.g.  Sunny, Breezy, Thunderstorms, Showers, Rain, Partly Cloudy, Mostly Cloudy, Mostly Sunny

            // sample API URL for Irvine, CA
            // https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22irvine%2C%20ca%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys

            this.emit(':tell', 'It is ' + localTime
                + ' and the weather in ' + data.city
                + ' is '
                + currentTemp + ' and ' + currentCondition);

            // TODO
            // Decide, based on current time and weather conditions,
            // whether to go out to a local beach or park;
            // or recommend a movie theatre; or recommend staying home


        });
    },

    'AMAZON.NoIntent': function () {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', this.t('HELP'));
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP'));
    }

};

//    END of Intent Handlers {} ========================================================================================
// 3. Helper Function  =================================================================================================

function getRestaurantsByMeal(mealtype) {

    var list = [];
    for (var i = 0; i < data.restaurants.length; i++) {

        if(data.restaurants[i].meals.search(mealtype) >  -1) {
            list.push(data.restaurants[i]);
        }
    }
    return list;
}

function getRestaurantByName(restaurantName) {

    var restaurant = {};
    for (var i = 0; i < data.restaurants.length; i++) {

        if(data.restaurants[i].name == restaurantName) {
            restaurant = data.restaurants[i];
        }
    }
    return restaurant;
}

function getAttractionsByDistance(maxDistance) {

    var list = [];

    for (var i = 0; i < data.attractions.length; i++) {

        if(parseInt(data.attractions[i].distance) <= maxDistance) {
            list.push(data.attractions[i]);
        }
    }
    return list;
}

function getWeather(callback) {
    var https = require('https');


    var req = https.request(myAPI, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData = returnData + chunk;
        });
        res.on('end', () => {
            var channelObj = JSON.parse(returnData).query.results.channel;

            var localTime = channelObj.lastBuildDate.toString();
            localTime = localTime.substring(17, 25).trim();

            var currentTemp = channelObj.item.condition.temp;

            var currentCondition = channelObj.item.condition.text;

            callback(localTime, currentTemp, currentCondition);

        });

    });
    req.end();
}
function randomArrayElement(array) {
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]);
}
