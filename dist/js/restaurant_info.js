"use strict";

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*global newMap ,initMap ,DBHelper, getParameterByName,fillBreadcrumb ,createReviewHTML,fillRestaurantHoursHTML,fillRestaurantHTML,fillReviewsHTML,fetchRestaurantFromURL,fetchRestaurantById,error */

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/

var restaurant = void 0,
    initMap = void 0,
    fetchRestaurantFromURL = void 0,
    fillRestaurantHTML = void 0,
    getParameterByName = void 0,
    fillRestaurantHoursHTML = void 0,
    fillReviewsHTML = void 0,
    createReviewHTML = void 0,
    fillBreadcrumb = void 0,
    event = void 0;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", function (event) {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = function initMap() {
  fetchRestaurantFromURL(function (error, restaurant) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ", {
        mapboxToken: "pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ",
        maxZoom: 18,
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, " + "<a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, " + "Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        id: "mapbox.streets"
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  var id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, function (error, restaurant) {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = function fillRestaurantHTML() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  var address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  var image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  /* Add alt to images */
  image.alt = restaurant.name;
  var restaurant_photograph = restaurant.photograph;

  /**
  * Add srcset and sizes attributes for images
  */
  var small_images = restaurant_photograph.split(".")[0].concat("_300.jpg");
  var large_images = restaurant_photograph.split(".")[0].concat("_600.jpg");
  image.srcset = "banners/" + large_images + " 600w" + "," + "banners/" + small_images + " 300w";

  image.src = "banners/" + large_images;
  image.sizes = "(max-width: 325px) 100vw 50vw";

  var cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = function fillRestaurantHoursHTML() {
  var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;

  var hours = document.getElementById("restaurant-hours");
  for (var key in operatingHours) {
    var row = document.createElement("tr");

    var day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    var time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = function fillReviewsHTML() {
  var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.reviews;

  var container = document.getElementById("reviews-container");
  var title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    var noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  var ul = document.getElementById("reviews-list");
  reviews.forEach(function (review) {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = function createReviewHTML(review) {
  var li = document.createElement("li");
  li.tabIndex = 0;
  var name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  var date = document.createElement("p");
  date.innerHTML = review.date;
  li.appendChild(date);

  var rating = document.createElement("p");
  rating.innerHTML = "Rating: " + review.rating;
  li.appendChild(rating);

  var comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = function fillBreadcrumb() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

  var breadcrumb = document.getElementById("breadcrumb");
  var li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};