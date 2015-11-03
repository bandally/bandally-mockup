(function () {
  'use strict';

  angular.module('app').config(route);

  route.$inject = ['$stateProvider', '$urlRouterProvider'];

  function route($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('/', {
        url: '/',
        controller: 'LoginController',
        controllerAs: 'login',
        templateUrl: 'app/partials/login.html'
      })
      .state('tickets', {
        url: '/tickets',
        controller: 'TicketsController',
        controllerAs: 'tickets',
        templateUrl: 'app/partials/tickets.html'
      });
  }
})();
