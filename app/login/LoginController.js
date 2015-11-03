(function () {
  'use strict';

  angular.module('app').controller('LoginController', LoginController);

  LoginController.$inject = ['$firebaseAuth', '$rootScope'];

  function LoginController($firebaseAuth, $rootScope) {
    var vm = this;
    vm.fbLogin = fbLogin;
    activate();

    function activate() {}

    function fbLogin() {
      var ref = new Firebase('https://omotenashi.firebaseio.com/');
      var auth = $firebaseAuth(ref);
      auth.$authWithOAuthPopup('facebook').then(function (authData) {
        console.log('Logged in as:', authData.uid);
        $rootScope.isLogin = true;
        $rootScope.userName = authData.facebook.displayName;
        $rootScope.userImageUrl = authData.facebook.profileImageURL;
      }).catch(function (error) {
        console.log('Authentication failed:', error);
        $rootScope.isLogin = false;
      });
    }
  }
})();
