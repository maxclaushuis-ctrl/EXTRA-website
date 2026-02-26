(function () {
  window.addEventListener('unhandledrejection', function (e) {
    var msg = e.reason && e.reason.message;
    if (msg && msg.indexOf('string did not match the expected pattern') !== -1) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
}());
