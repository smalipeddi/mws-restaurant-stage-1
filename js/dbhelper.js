/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* eslint event: "off"*/
/**
 * Common database helper functions.
 */

//import idb from 'idb';

class DBHelper {

  /**
  * Database URL.
  */
  static get DATABASE_URL() {
    const port = 1337; // Changed this to your server port
    return `http://localhost:${port}/`;
  }

  /**
  * Open Databases.
  */
 static openDatabase(){
   var reviewsList;
   var dbPromise = idb.open("restaurants", 2, function(upgradeDb) {
     switch(upgradeDb.oldVersion){
       case 0 :
         if (!upgradeDb.objectStoreNames.contains("restaurantsList")) {
           upgradeDb.createObjectStore("restaurantsList" , {keyPath: "id"});
         }
       case 1 :
         if (!upgradeDb.objectStoreNames.contains("reviewsList")) {
           const reviewsStore = upgradeDb.createObjectStore("reviewsList" , {keyPath: "id"});
           reviewsStore.createIndex('restaurant_id' ,'restaurant_id');
         }

     }

   });
   return dbPromise;
 }
  /**
  * Fetch all restaurants
  */
  static fetchRestaurants(callback) {
    if(navigator.onLine){
    //Fetch from Server and save to database
      var url = DBHelper.DATABASE_URL + 'restaurants';
      fetch(url, {method: "GET"}).then(resp => {  return resp.json();}).then(restaurants => {
        var dbPromise = DBHelper.openDatabase();

        /* Store data in database */
        dbPromise.then(db => {
          if(!db) return ;
          const tx = db.transaction("restaurantsList", "readwrite");
          let store = tx.objectStore("restaurantsList");
              
          /* iterate through data and store in db */
          restaurants.forEach(res => {
            store.put(res);
          });
          return tx.complete;
        });

          callback(null, restaurants);
        }).catch(error => {
          callback(error, null);
        });

    }else{
      var dbPromise = DBHelper.openDatabase();
      var restaurants = dbPromise.then(function (db) {
        var tx = db.transaction("restaurantsList", "readonly");
        var store = tx.objectStore("restaurantsList");
        return store.getAll();
      });
      callback(null, restaurants);
     
    }
    
  }

  /**
  * Fetch all reviews by restaurant id
  */
  static fetchReviewsByRestaurantId(id ,callback) {
    //Initially Fetch from DataBase if data is present 
    if(navigator.onLine){
       //Fetch from Server and save to database
        var url = DBHelper.DATABASE_URL + "reviews/?restaurant_id=" + id;
    
        fetch(url, {method: "GET"}).then(resp => {  return resp.json();}).then(reviews => {
          callback(null, reviews);
        }).catch(error => {
          callback(error, null);
        });

    }else{
      var dbPromise = DBHelper.openDatabase();
      var reviews = dbPromise.then(function (db) {
        var tx = db.transaction("reviewsList", "readonly");
        var store = tx.objectStore("reviewsList");
        return store.getAll(id);
        if(reviews.length){
          callback(null, reviews);
        }
      });

    }
   
  }

  /**
   * Save Restaurants to Database
   */
  static saveRestaurantsToDatabase(restaurants){
    var dbPromise = DBHelper.openDatabase();

    /* Store data in database */
    dbPromise.then(db => {
      if(!db) return ;
      const tx = db.transaction("restaurantsList", "readwrite");
      let store = tx.objectStore("restaurantsList");
          
      /* iterate through data and store in db */
      restaurants.forEach(res => {
        store.put(res);
      });
      return tx.complete;
    });
  }
  
   /**
   * Save Restaurants to Database
   */
  static saveReviewsToDatabase(reviews){
    var dbPromise = DBHelper.openDatabase();

    /* Store data in database */
    dbPromise.then(db => {
      if(!db) return ;
      const tx = db.transaction("reviewsList", "readwrite");
      let store = tx.objectStore("reviewsList");
          
      /* check if we are storing an object or an Array of objects */
      if(reviews && typeof reviews === 'object' && reviews.constructor === Array){
        reviews.forEach(res => {
          store.put(res);
        });
      }
      else
      {
        store.put(reviews);
      }

      return tx.complete;
    
    });
  }

   /**
   * Toggle restaurant favourite
   */
  static saveRestaurantFavoriteToDatabase(isFavorite , restaurantId){
   
    fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isFavorite}`, {
        method: 'PUT'
    })
    .then(function(){
      var dbPromise = DBHelper.openDatabase();
      /* Store data in database */
      dbPromise.then(db => {
        if(!db) return ;
        const tx = db.transaction("restaurantsList", "readwrite");
        let store = tx.objectStore("restaurantsList");
        store.get(restaurantId).then(function(restaurantById){
          restaurantById.is_favorite = isFavorite;
          store.put(restaurantById);
        });   
     
      });

    })
  }
 
  /**
   * Send reviews to the Server and save to Database.
   */

  static sendReviewToServer(reviewData) {
   
    console.log('Sending Reviews : ', reviewData);
    var fetch_options = {
      method: 'POST',
      body: JSON.stringify(reviewData),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    };
    fetch(`http://localhost:1337/reviews`, fetch_options).then((response) => {
        return response.json();
    })
    .then((data) => {console.log(`Fetched reviews successfully`);
      DBHelper.saveReviewsToDatabase(data);

    })
    .catch(error => console.log('error:', error));
  }

  static saveReviewsTolocalStorage(offlineReviewsList){
    window.localStorage.setItem("reviews" , JSON.stringify(offlineReviewsList));

  }

  static getReviewsFromlocalStorage(){
    var offlineReviewsList = [];
    if(window.localStorage.getItem("reviews") !== null){
      offlineReviewsList = window.localStorage.getItem("reviews");
    }
    return offlineReviewsList;

  }

   /**
   * Fetch a restaurant by its ID.
   */
   static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
       if (error) {
         callback(error, null);
        }else {
          const restaurant = restaurants.find(r => r.id == id);
        
          if (restaurant) { // Got the restaurant
            callback(null, restaurant);
          } else { // Restaurant does not exist in the database
            callback("Restaurant does not exist", null);
          }
        }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    console.log(restaurant);
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      });
    marker.addTo(newMap);
    return marker;
  } 

}

