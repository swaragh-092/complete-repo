// Author: Gururaj
// Created: 21th May 2025
// Description: This is the code to initialize the Alert pop up.
// Version: 1.0.0
// util/AlertService.js
// Modified: 

let showAlertHandler = null;

//Alert handler function from Toast component stores here
export const setAlertHandler = (handler) => {
  showAlertHandler = handler;
};


// function to call when show the alert pop up 
export const showAlert = (config) => {
  if (showAlertHandler) {
    showAlertHandler(config);
  } else {
    console.error("Alert handler not set.");
  }
};
