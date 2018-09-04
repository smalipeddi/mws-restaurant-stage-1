/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*global newMap ,initMap ,DBHelper, getParameterByName,fillBreadcrumb ,createReviewHTML,fillRestaurantHoursHTML,fillRestaurantHTML,fillReviewsHTML,fetchRestaurantFromURL,fetchRestaurantById,error */

/*eslint no-unused-vars: ["error", { "vars": "local" }]*/

let restaurant,initMap,fetchRestaurantFromURL,fillRestaurantHTML,getParameterByName,fillRestaurantHoursHTML,fillReviewsHTML,createReviewHTML,fillBreadcrumb,event;
var newMap;
var offlineReviews = [];
var offlineReviewsFromLocalStorage = [];

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
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
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, " +
          "<a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, " +
          "Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        id: "mapbox.streets"
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) { // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
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
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  /* Add alt to images */
  image.alt = restaurant.name;
  var restaurant_photograph = restaurant.id;

  /**
  * Add srcset and sizes attributes for images
  */
  var small_images = (restaurant_photograph) + ("_300.webp");
  var large_images = (restaurant_photograph) + ("_600.webp");
  image.srcset = "banners/" + large_images + " 600w" + "," +  "banners/" + small_images +  " 300w";
  image.src = "banners/"+ large_images;
  image.sizes = "(max-width: 325px) 100vw 50vw";

 //LAZY LOADING OF RESTAURANT IMAGE
 //const image = document.createElement('img');
  const config = {
    rootMargin: "0px",
    threshold: .1
    
  };

  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(onIntersection, config);
    observer.observe(image);

  } else {
    //loa dimages as they are
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = "banners/" + large_images + " 600w" + "," +  "banners/" + small_images +  " 300w";
    //image.src = "banners/"+ large_images;
 
  }
  const loadImage = image => {
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.srcset = "banners/" + large_images + " 600w" + "," +  "banners/" + small_images +  " 300w";
    //image.src = "banners/"+ large_images;
  }

  function onIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0) {
        loadImage(entry.target);
        observer.unobserve(entry.target);
      } else {
        
      }
    });
  }  

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  DBHelper.fetchReviewsByRestaurantId(restaurant.id,  fillReviewsHTML);

};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (error ,reviews) => {
  //self.restaurant.reviews = reviews;
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);
  
  //Get reviews from local storage if they are added  when offline
  var offlineReviewsFromLocalStorage = DBHelper.getReviewsFromlocalStorage();
  
  if(offlineReviewsFromLocalStorage !== undefined && offlineReviewsFromLocalStorage.length !== 0){
    var array1 = JSON.parse(offlineReviewsFromLocalStorage);
    var reviews = reviews.concat(array1);
  }

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));

  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement("li");
  li.tabIndex = 0;
  const name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement("p");
  var convertedDate = (new Date(review.createdAt)).toLocaleString();

  date.innerHTML = convertedDate;
  li.appendChild(date);

  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

addReview = () => {

  console.log("clicked submit");
  
  var url = window.location.href;
  var id = parseInt(getParameterByName('id'));
  
  var name = document.getElementById('reviewer_name').value;
  var rating = document.getElementById('select_rating');
  var rating_value = rating.options[rating.selectedIndex].value;
  var comment = document.getElementById('reviewer_comment').value;
   
  if (name == "") {
      alert("Name must be filled out");
      return false;
  }else if(comment == ""){
      alert("Comment must be filled out");
      return false;
  }
  else {
     var jsonToSend = {
      "restaurant_id": id,
      "name": name,
      "createdAt": new Date(),
      "rating": rating_value,
      "comments":comment
    }
    if(window.navigator.onLine){
      DBHelper.sendReviewToServer(jsonToSend);

    }
    else 
    {
      // Get the existing data
      var existing = localStorage.getItem('reviews');
      existing = existing ? JSON.parse(existing) : [];
      existing.push(jsonToSend);
      localStorage.setItem('reviews', JSON.stringify(existing));
    }

    const container = document.getElementById("reviews-container");
    const ul = document.getElementById("reviews-list");
    ul.insertBefore(createReviewHTML(jsonToSend), ul.childNodes[0]);
    container.appendChild(ul);

     var reviewForm = document.getElementById('reviewForm');
    reviewForm.reset();

  }
  return false;
 
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};
