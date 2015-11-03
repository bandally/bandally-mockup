(function () {
  'use strict';

  angular.module('app').provider('parse', parseProvider);

  function parseProvider() {
    var applicationId = '';
    var javascriptKey = '';

    this.setIdAndKey = setIdAndKey;
    this.$get = parse;

    function setIdAndKey(id, key) {
      applicationId = id;
      javascriptKey = key;
    }

    function parse() {
      Parse.initialize(applicationId, javascriptKey);
      return Parse;
    }
  }
})();
