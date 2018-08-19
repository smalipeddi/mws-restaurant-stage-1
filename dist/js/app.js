"use strict";

/**
 * Register Service Worker 
 */
if (navigator.serviceWorker) {
  navigator.serviceWorker.register("../service-worker.js", { scope: "/" }).then(function () {
    console.log("Service  Worker registered succesfully");
  }).catch(function (error) {
    console.log("Service Worker registration is unsuccessful");
  });
}