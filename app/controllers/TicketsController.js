(function () {
  'use strict';

  angular.module('app').controller('TicketsController', TicketsController);

  TicketsController.$inject = ['$firebaseArray', '$rootScope', '$state', 'config'];

  function TicketsController($firebaseArray, $rootScope, $state, config) {
    var vm = this;
    vm.tickets = [];
    vm.add = add;

    activate();

    function activate() {
      var ref = new Firebase(config().serverUrl + 'tickets');
      vm.tickets = $firebaseArray(ref);
    }

    function add() {
      vm.tickets.$add({
        'destination': 'Tokyo',
        'departureDate': '2015/11/1',
        'arrivedDate': '2015/11/8'
      });
    }
  }
})();
