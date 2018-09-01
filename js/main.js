/*eslint no-unused-vars: ["error", { "vars": "local" }]*/

let Restaurants,addMarkersToMap,createRestaurantHTML,neighborhoods,updateRestaurants,updateRestaurant,event,initMap,fetchNeighborhoods,fillNeighborhoodsHTML,fetchCuisines,fillCuisinesHTML,fillRestaurantsHTML,cuisines,newMap,markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", (event) => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
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
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
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
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  newMap = L.map("map", {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ", {
    mapboxToken: "pk.eyJ1Ijoic2ZyZW5zIiwiYSI6ImNqaWVzeWJnMjBwb3Yzc3Q0bml3OGo5bnQifQ.XLzOLAtnX3pMu70zmA5YlQ",
    maxZoom: 18,
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, " +
      "<a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, " +
      "Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    id: "mapbox.streets"
  }).addTo(newMap);

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
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
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement("li");

  li.role = "listitem";
  li.tabIndex = 0;
  const image = document.createElement("img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  /* Add alt to images */
  image.alt = restaurant.name;
  var restaurant_photograph = restaurant.id;

  /**
  * Add srcset for images based on Device Pixel Ratio
  */
  var small_images = (restaurant_photograph) + "-1x.webp";
  var large_images = (restaurant_photograph) + "-2x.webp";
  image.srcset = "images/" + small_images + " 1x" + "," +  "images/" + large_images +  " 2x";
  
  image.src = "img/"+ restaurant_photograph;
  image.sizes = "(max-width: 325px) 100vw 50vw";
  li.append(image);

  const div = document.createElement("div");
  li.append(div);

  const name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  div.append(name);

  const fav = document.createElement("img");
  if(restaurant.is_favorite === "true"){
    fav.src ="icons/like.svg";
    fav.alt ="add to favorite";
  }else{
    fav.src ="icons/unlike.svg";
    fav.alt ="remove from favorite";
  }

  const anchor = document.createElement("a");
  anchor.onclick = function(){
    if(restaurant.is_favorite === "true"){
       fav.src = "icons/unlike.svg"
       fav.alt = "remove from favorite";
       if(restaurant.hasOwnProperty('is_favorite')){
          restaurant.is_favorite = "false";
       }
      
     // DBHelper.saveRestaurantFavoriteToDatabase(restaurant.is_favorite , restaurant.id);
    }
    else{
        fav.src = "icons/like.svg";
        fav.alt ="add to favorite";
        if(restaurant.hasOwnProperty('is_favorite')){
          restaurant.is_favorite = "true";
        }
        // restaurant.is_favourite = "true";
     }
     DBHelper.saveRestaurantFavoriteToDatabase(restaurant.is_favorite ,restaurant.id);

    
    this.append(fav);
  }
  anchor.append(fav);

  div.append(anchor);
 
  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  div.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  div.append(address);

  //Change link to a button 
  const more = document.createElement("button");
  more.innerHTML = "View Details";
  more.onclick = function(){
    const url = DBHelper.urlForRestaurant(restaurant);
    window.location = url;

  };
  div.append(more);

  return li;
};


/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

};


