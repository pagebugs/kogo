/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./touch/**/*.html",
    "./admin/**/*.html",
    "./assets/js/**/*.js",
    "./js/**/*.js",
    "./inc/**/*.php"
  ],
  corePlugins: {
    // Avoid global reset conflicts with the existing CSS system.
    preflight: false
  },
  theme: {
    extend: {}
  }
};

