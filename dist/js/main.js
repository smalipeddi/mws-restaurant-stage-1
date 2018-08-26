"use strict";

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/

var Restaurants = void 0,
    addMarkersToMap = void 0,
    createRestaurantHTML = void 0,
    neighborhoods = void 0,
    updateRestaurants = void 0,
    updateRestaurant = void 0,
    event = void 0,
    initMap = void 0,
    fetchNeighborhoods = void 0,
    fillNeighborhoodsHTML = void 0,
    fetchCuisines = void 0,
    fillCuisinesHTML = void 0,
    fillRestaurantsHTML = void 0,
    cuisines = void 0,
    newMap = void 0,
    markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", function (event) {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = function fetchNeighborhoods() {
  DBHelper.fetchNeighborhoods(function (error, neighborhoods) {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = function fillNeighborhoodsHTML() {
  var neighborhoods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.neighborhoods;

  var select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(function (neighborhood) {
    var option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = function fetchCuisines() {
  DBHelper.fetchCuisines(function (error, cuisines) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = function fillCuisinesHTML() {
  var cuisines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.cuisines;

  var select = document.getElementById("cuisines-select");

  cuisines.forEach(function (cuisine) {
    var option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = function initMap() {
  newMap = L.map("map", {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ", {
    mapboxToken: "pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ",
    maxZoom: 18,
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, " + "<a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, " + "Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    id: "mapbox.streets"
  }).addTo(newMap);

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = function updateRestaurants() {
  var cSelect = document.getElementById("cuisines-select");
  var nSelect = document.getElementById("neighborhoods-select");

  var cIndex = cSelect.selectedIndex;
  var nIndex = nSelect.selectedIndex;

  var cuisine = cSelect[cIndex].value;
  var neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, function (error, restaurants) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = function resetRestaurants(restaurants) {
  // Remove all restaurants
  self.restaurants = [];
  var ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(function (marker) {
      return marker.remove();
    });
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = function fillRestaurantsHTML() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  var ul = document.getElementById("restaurants-list");
  restaurants.forEach(function (restaurant) {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = function createRestaurantHTML(restaurant) {
  var li = document.createElement("li");

  li.role = "listitem";
  li.tabIndex = 0;
  var image = document.createElement("img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  /* Add alt to images */
  image.alt = restaurant.name;
  var restaurant_photograph = restaurant.id;

  /**
  * Add srcset for images based on Device Pixel Ratio
  */
  var small_images = restaurant_photograph + "-1x.jpg";
  var large_images = restaurant_photograph + "-2x.jpg";
  image.srcset = "images/" + small_images + " 1x" + "," + "images/" + large_images + " 2x";

  image.src = "img/" + restaurant_photograph;
  image.sizes = "(max-width: 325px) 100vw 50vw";
  li.append(image);

  var div = document.createElement("div");
  li.append(div);

  var name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  div.append(name);

  var fav = document.createElement("img");
  if (restaurant.is_favorite === "true") {
    fav.src = "icons/like.svg";
    fav.alt = "add to favorite";
  } else {
    fav.src = "icons/unlike.svg";
    fav.alt = "remove from favorite";
  }

  var anchor = document.createElement("a");
  anchor.onclick = function () {
    if (restaurant.is_favorite === "true") {
      fav.src = "icons/unlike.svg";
      fav.alt = "remove from favorite";
      if (restaurant.hasOwnProperty('is_favorite')) {
        restaurant.is_favorite = "false";
      }

      DBHelper.saveRestaurantFavoriteToDatabase(restaurant.is_favorite, restaurant.id);
    } else {
      fav.src = "icons/like.svg";
      fav.alt = "add to favorite";
      if (restaurant.hasOwnProperty('is_favorite')) {
        restaurant.is_favorite = "true";
      }
      // restaurant.is_favourite = "true";
      DBHelper.saveRestaurantFavoriteToDatabase(restaurant.is_favorite, restaurant.id);
    }

    this.append(fav);
  };
  anchor.append(fav);

  div.append(anchor);

  var neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  div.append(neighborhood);

  var address = document.createElement("p");
  address.innerHTML = restaurant.address;
  div.append(address);

  //Change link to a button 
  var more = document.createElement("button");
  more.innerHTML = "View Details";
  more.onclick = function () {
    var url = DBHelper.urlForRestaurant(restaurant);
    window.location = url;
  };
  div.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = function addMarkersToMap() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  restaurants.forEach(function (restaurant) {
    // Add marker to the map
    var marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};