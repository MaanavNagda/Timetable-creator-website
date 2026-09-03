(function () {
  window.Timetable = window.Timetable || {};

  function startApp() {
    try {
      Timetable.State.init();
      Timetable.UI.init();
    } catch (err) {
      console.error('Failed to start Timetable Maker:', err);
      alert('Something went wrong starting the app. Check the console for details.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
})();
