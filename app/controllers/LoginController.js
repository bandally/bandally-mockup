(function () {
  'use strict';

  angular.module('app').controller('LoginController', LoginController);

  LoginController.$inject = ['$firebaseArray', '$firebaseAuth', '$rootScope', '$state', 'config'];

  function LoginController($firebaseArray, $firebaseAuth, $rootScope, $state, config) {
    var vm = this;
    vm.fbLogin = fbLogin;

    activate();

    function activate() {}

    function fbLogin() {
      var ref = new Firebase(config().serverUrl);
      var auth = $firebaseAuth(ref);
      auth.$authWithOAuthPopup('facebook')
        .then(function (authData) {
          console.log('Logged in as:', authData.uid);
          $rootScope.isLogin = true;
          $rootScope.userName = authData.facebook.displayName;
          $rootScope.userImageUrl = authData.facebook.profileImageURL;
          var ref = new Firebase(config().serverUrl + 'users');
          var users = $firebaseArray(ref);
          users.$add(authData);
          $state.go('tickets');
        })
        .catch(function (error) {
          console.log('Authentication failed:', error);
          $rootScope.isLogin = false;
        });
    }
  }
})();
