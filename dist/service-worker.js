importScripts('/js/idb.js');
'use strict';


var CACHE_NAME = 'mws-restaurant-stage-1-cache';
var urlsToCache = ['/', './index.html', './restaurant.html', './css/styles.css', './js/dbhelper.js', './js/main.js', './app.js', './js/restaurant_info.js', './img/1.jpg', './img/2.jpg', './img/3.jpg', './img/4.jpg', './img/5.jpg', './img/6.jpg', './img/7.jpg', './img/8.jpg', './img/9.jpg', './img/10.jpg','./app.js'];

self.addEventListener('install', function (event) {
  // Perform install steps
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    console.log('Opened cache');
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', function (event) {
  let cacheRequest = event.request;
  let cacheUrlObj = new URL(event.request.url);
  if (event.request.url.indexOf("restaurant.html") > -1) {
    const cacheURL = "restaurant.html";
    cacheRequest = new Request(cacheURL);
    console.log(cacheRequest);
  }

  // Requests going to the API get handled separately from those going to other
  // destinations
  const checkURL = new URL(event.request.url);
  if (checkURL.port === "1337") {
    const parts = checkURL
      .pathname
      .split("/");
    let id = checkURL
      .searchParams
      .get("restaurant_id") - 0;
    if (!id) {
      if (checkURL.pathname.indexOf("restaurants")) {
        id = parts[parts.length - 1] === "restaurants"
          ? "-1"
          : parts[parts.length - 1];
      } else {
        id = checkURL
          .searchParams
          .get("restaurant_id");
      }
    }
    //handleAJAXEvent(event, id);
  } else {
    //handleNonAJAXEvent(event, cacheRequest);
  }

  event.respondWith(caches.match(event.request).then(function (response) {
    console.log(response);
    if (response) return response;
    return fetch(event.request);
  }).catch(function (data) {
    console.log(data);
  }));
});

// self.addEventListener("fetch", event => {
//   let cacheRequest = event.request;
//   let cacheUrlObj = new URL(event.request.url);
//   if (event.request.url.indexOf("restaurant.html") > -1) {
//     const cacheURL = "restaurant.html";
//     cacheRequest = new Request(cacheURL);
//   }

//   // Requests going to the API get handled separately from those going to other
//   // destinations
//   const checkURL = new URL(event.request.url);
//   if (checkURL.port === "1337") {
//     const parts = checkURL
//       .pathname
//       .split("/");
//     let id = checkURL
//       .searchParams
//       .get("restaurant_id") - 0;
//     if (!id) {
//       if (checkURL.pathname.indexOf("restaurants")) {
//         id = parts[parts.length - 1] === "restaurants"
//           ? "-1"
//           : parts[parts.length - 1];
//       } else {
//         id = checkURL
//           .searchParams
//           .get("restaurant_id");
//       }
//     }
//     handleAJAXEvent(event, id);
//   } else {
//     handleNonAJAXEvent(event, cacheRequest);
//   }

// });

var handleAJAXEvent = function handleAJAXEvent(event, id) {
  // Only use caching for GET events
  if (event.request.method !== "GET") {
    return fetch(event.request).then(function (fetchResponse) {
      return fetchResponse.json();
    }).then(function (json) {
      return json;
    });
  }

  // Split these request for handling restaurants vs reviews
  if (event.request.url.indexOf("reviews") > -1) {
    // handleReviewsEvent(event, id);
  } else {
      // handleRestaurantEvent(event, id);
    }
};

var handleReviewsEvent = function handleReviewsEvent(event, id) {
  event.respondWith(dbPromise.then(function (db) {
    return db.transaction("reviews").objectStore("reviews").index("restaurant_id").getAll(id);
  }).then(function (data) {
    return data.length && data || fetch(event.request).then(function (fetchResponse) {
      return fetchResponse.json();
    }).then(function (data) {
      return dbPromise.then(function (idb) {
        var itx = idb.transaction("reviews", "readwrite");
        var store = itx.objectStore("reviews");
        data.forEach(function (review) {
          store.put({ id: review.id, "restaurant_id": review["restaurant_id"], data: review });
        });
        return data;
      });
    });
  }).then(function (finalResponse) {
    if (finalResponse[0].data) {
      // Need to transform the data to the proper format
      var mapResponse = finalResponse.map(function (review) {
        return review.data;
      });
      return new Response(JSON.stringify(mapResponse));
    }
    return new Response(JSON.stringify(finalResponse));
  }).catch(function (error) {
    return new Response("Error fetching data", { status: 500 });
  }));
};

var handleRestaurantEvent = function handleRestaurantEvent(event, id) {
  // Check the IndexedDB to see if the JSON for the API has already been stored
  // there. If so, return that. If not, request it from the API, store it, and
  // then return it back.
  event.respondWith(dbPromise.then(function (db) {
    return db.transaction("restaurants").objectStore("restaurants").get(id);
  }).then(function (data) {
    return data && data.data || fetch(event.request).then(function (fetchResponse) {
      return fetchResponse.json();
    }).then(function (json) {
      return dbPromise.then(function (db) {
        var tx = db.transaction("restaurants", "readwrite");
        var store = tx.objectStore("restaurants");
        store.put({ id: id, data: json });
        return json;
      });
    });
  }).then(function (finalResponse) {
    return new Response(JSON.stringify(finalResponse));
  }).catch(function (error) {
    return new Response("Error fetching data", { status: 500 });
  }));
};

var handleNonAJAXEvent = function handleNonAJAXEvent(event, cacheRequest) {
  // Check if the HTML request has previously been cached. If so, return the
  // response from the cache. If not, fetch the request, cache it, and then return
  // it.
  event.respondWith(caches.match(cacheRequest).then(function (response) {
    return response || fetch(event.request).then(function (fetchResponse) {
      return caches.open(cacheID).then(function (cache) {
        if (fetchResponse.url.indexOf("browser-sync") === -1) {
          cache.put(event.request, fetchResponse.clone());
        }
        return fetchResponse;
      });
    }).catch(function (error) {
      if (event.request.url.indexOf(".jpg") > -1) {
        return caches.match("/img/na.png");
      }
      return new Response("Application is not connected to the internet", {
        status: 404,
        statusText: "Application is not connected to the internet"
      });
    });
  }));
};