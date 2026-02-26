(function () {
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    var stack = (reason && reason.stack) || '';
    var msg = (reason && reason.message) || String(reason);
    var isViteHmr = stack.indexOf('@vite/client') !== -1 ||
                    msg.indexOf('string did not match') !== -1 ||
                    msg.indexOf('WebSocket') !== -1 ||
                    msg.indexOf('vite') !== -1;
    if (isViteHmr) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('error', function (e) {
    var stack = (e.error && e.error.stack) || '';
    if (stack.indexOf('@vite/client') !== -1) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
}());
