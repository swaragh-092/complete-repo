// Author: Gururaj
// Created: 21th May 2025
// Description: This is the code to initialize the Alert messages.
// Version: 1.0.0
// util/ToastService.js
// Modified: 

let showToastHandler = null;

//Toast handler function from Toast component stores here
export const setToastHandler = (handler) => {
  showToastHandler = handler;
};

// function to call when we want to show the alert message 
// has 4 types info, success, error and warning
export const showToast = ({ message, type = "info", duration = 4000,  }) => {
  if (showToastHandler) {
    showToastHandler({ message, type, duration });
  } else {
    console.error("Toast handler not set");
  }
};
