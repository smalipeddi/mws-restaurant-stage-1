"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* eslint event: "off"*/
/**
 * Common database helper functions.
 */

//import idb from 'idb';

var DBHelper = function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: "openDatabase",


    /**
    * Open Databases.
    */
    value: function openDatabase() {
      var reviewsList;
      var dbPromise = idb.open("restaurants", 2, function (upgradeDb) {
        switch (upgradeDb.oldVersion) {
          case 0:
            if (!upgradeDb.objectStoreNames.contains("restaurantsList")) {
              upgradeDb.createObjectStore("restaurantsList", { keyPath: "id" });
            }
          case 1:
            if (!upgradeDb.objectStoreNames.contains("reviewsList")) {
              var reviewsStore = upgradeDb.createObjectStore("reviewsList", { keyPath: "id" });
              reviewsStore.createIndex('restaurant_id', 'restaurant_id');
            }

        }
      });
      return dbPromise;
    }
    /**
    * Fetch all restaurants
    */

  }, {
    key: "fetchRestaurants",
    value: function fetchRestaurants(callback) {
      //Initially Fetch from DataBase if data is present 
      return DBHelper.cacheRestaurantsDataFromDb().then(function (restaurants) {
        if (restaurants.length) {
          callback(null, restaurants);
        } else {
          //Fetch from Server and save to database
          var url = DBHelper.DATABASE_URL + 'restaurants';

          fetch(url, { method: "GET" }).then(function (resp) {
            return resp.json();
          }).then(function (restaurants) {
            DBHelper.saveRestaurantsToDatabase(restaurants); //save to database
            callback(null, restaurants);
          }).catch(function (error) {
            callback(error, null);
          });
        }
      });
    }

    /**
    * Fetch all reviews by restaurant id
    */

  }, {
    key: "fetchReviewsByRestaurantId",
    value: function fetchReviewsByRestaurantId(id, callback) {
      //Initially Fetch from DataBase if data is present 
      return DBHelper.cacheReviewsDataFromDb(id).then(function (reviews) {
        if (reviews.length) {
          callback(null, reviews);
        } else {
          //Fetch from Server and save to database
          var url = DBHelper.DATABASE_URL + "reviews/?restaurant_id=" + id;

          fetch(url, { method: "GET" }).then(function (resp) {
            return resp.json();
          }).then(function (reviews) {
            //  DBHelper.saveReviewsToDatabase(reviews); //save to database
            callback(null, reviews);
          }).catch(function (error) {
            callback(error, null);
          });
        }
      });
    }

    /**
    * Cache Restaurants from Database
    */

  }, {
    key: "cacheRestaurantsDataFromDb",
    value: function cacheRestaurantsDataFromDb() {

      var dbPromise = DBHelper.openDatabase();

      var restaurants = dbPromise.then(function (db) {
        var tx = db.transaction("restaurantsList", "readonly");
        var store = tx.objectStore("restaurantsList");
        return store.getAll();
      });

      return restaurants;
    }

    /**
    * Cache Reviews from Database
    */

  }, {
    key: "cacheReviewsDataFromDb",
    value: function cacheReviewsDataFromDb(id) {

      var dbPromise = DBHelper.openDatabase();

      var reviews = dbPromise.then(function (db) {
        var tx = db.transaction("reviewsList", "readonly");
        var store = tx.objectStore("reviewsList");
        return store.getAll(id);
      });

      return reviews;
    }

    /**
     * Save Restaurants to Database
     */

  }, {
    key: "saveRestaurantsToDatabase",
    value: function saveRestaurantsToDatabase(restaurants) {
      var dbPromise = DBHelper.openDatabase();

      /* Store data in database */
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction("restaurantsList", "readwrite");
        var store = tx.objectStore("restaurantsList");

        /* iterate through data and store in db */
        restaurants.forEach(function (res) {
          store.put(res);
        });
        return tx.complete;
      });
    }

    /**
    * Save Restaurants to Database
    */

  }, {
    key: "saveReviewsToDatabase",
    value: function saveReviewsToDatabase(reviews) {
      var dbPromise = DBHelper.openDatabase();

      /* Store data in database */
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction("reviewsList", "readwrite");
        var store = tx.objectStore("reviewsList");

        /* check if we are storing an object or an Array of objects */
        if (reviews && (typeof reviews === "undefined" ? "undefined" : _typeof(reviews)) === 'object' && reviews.constructor === Array) {
          reviews.forEach(function (res) {
            store.put(res);
          });
        } else {
          store.put(reviews);
        }

        return tx.complete;
      });
    }

    /**
    * Toggle restaurant favourite
    */

  }, {
    key: "saveRestaurantFavoriteToDatabase",
    value: function saveRestaurantFavoriteToDatabase(isFavorite, restaurantId) {

      fetch("http://localhost:1337/restaurants/" + restaurantId + "/?is_favorite=" + isFavorite, {
        method: 'PUT'
      }).then(function () {
        var dbPromise = DBHelper.openDatabase();
        /* Store data in database */
        dbPromise.then(function (db) {
          if (!db) return;
          var tx = db.transaction("restaurantsList", "readwrite");
          var store = tx.objectStore("restaurantsList");
          store.get(restaurantId).then(function (restaurantById) {
            restaurantById.is_favorite = isFavorite;
            store.put(restaurantById);
          });
        });
      });
    }

    /**
     * Send reviews to the Server and save to Database.
     */

  }, {
    key: "sendReviewToServer",
    value: function sendReviewToServer(reviewData) {

      console.log('Sending Reviews : ', reviewData);
      var fetch_options = {
        method: 'POST',
        body: JSON.stringify(reviewData),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      };
      fetch("http://localhost:1337/reviews", fetch_options).then(function (response) {
        return response.json();
      }).then(function (data) {
        console.log("Fetched reviews successfully");
        DBHelper.saveReviewsToDatabase(data);
      }).catch(function (error) {
        return console.log('error:', error);
      });
    }
  }, {
    key: "saveReviewsTolocalStorage",
    value: function saveReviewsTolocalStorage(offlineReviewsList) {
      window.localStorage.setItem("reviews", JSON.stringify(offlineReviewsList));
    }
  }, {
    key: "getReviewsFromlocalStorage",
    value: function getReviewsFromlocalStorage() {
      var offlineReviewsList = [];
      if (window.localStorage.getItem("reviews") !== null) {
        offlineReviewsList = window.localStorage.getItem("reviews");
      }
      return offlineReviewsList;
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: "fetchRestaurantById",
    value: function fetchRestaurantById(id, callback) {
      // fetch all restaurants with proper error handling.
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var restaurant = restaurants.find(function (r) {
            return r.id == id;
          });

          if (restaurant) {
            // Got the restaurant
            callback(null, restaurant);
          } else {
            // Restaurant does not exist in the database
            callback("Restaurant does not exist", null);
          }
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisine",
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants(function (error, restaurants) {

        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByNeighborhood",
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisineAndNeighborhood",
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;
          if (cuisine != "all") {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }
          if (neighborhood != "all") {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }
          callback(null, results);
        }
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: "fetchNeighborhoods",
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          });
          // Remove duplicates from neighborhoods
          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: "fetchCuisines",
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          });
          // Remove duplicates from cuisines
          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: "urlForRestaurant",
    value: function urlForRestaurant(restaurant) {
      return "./restaurant.html?id=" + restaurant.id;
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: "imageUrlForRestaurant",
    value: function imageUrlForRestaurant(restaurant) {
      return "/img/" + restaurant.photograph;
    }

    /**
     * Map marker for a restaurant.
     */

  }, {
    key: "mapMarkerForRestaurant",
    value: function mapMarkerForRestaurant(restaurant) {
      // https://leafletjs.com/reference-1.3.0.html#marker  
      var marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], { title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
      marker.addTo(newMap);
      return marker;
    }
  }, {
    key: "DATABASE_URL",


    /**
    * Database URL.
    */
    get: function get() {
      var port = 1337; // Changed this to your server port
      return "http://localhost:" + port + "/";
    }
  }]);

  return DBHelper;
}();