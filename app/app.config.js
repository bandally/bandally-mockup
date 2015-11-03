(function () {
  'use strict';

  angular.module('app').value('config', config);

  config.$inject = [];

  function config() {
    return {
      'serverUrl': 'https://omotenashi.firebaseio.com/'
    };
  }
})();
