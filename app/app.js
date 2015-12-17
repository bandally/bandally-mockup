(function () {
  'use strict';

  angular.module('app', [
    'ngAnimate',
    'ngTouch',
    'ngCookies',
    'angular-carousel',
    'ui.router',
    'ui.bootstrap',
    'uiGmapgoogle-maps',
    'ui.calendar',
    'firebase',
    'app.layout',
    'app.home',
    'app.spots',
    'app.room',
    'app.tickets',
    'app.account',
    'app.hosts',
    'app.core'
  ]);
})();

(function () {
  'use strict';

  angular.module('app.core', []);
})();

(function () {
  'use strict';

  angular.module('app.account', []);
})();

(function () {
  'use strict';

  angular.module('app.home', []);
})();

(function () {
  'use strict';

  angular.module('app.hosts', []);
})();

(function() {
  'use strict';

  angular.module('app.layout', []);
})();

(function () {
  'use strict';

  angular.module('app.room', []);
})();

(function () {
  'use strict';

  angular.module('app.spots', []).config(config);

  config.$inject = ['uiGmapGoogleMapApiProvider'];

  function config(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      key: 'AIzaSyDLH67jWiu3QywVikRZuznyHPTM-d8dWsc',
      v: '3.20',
      libraries: 'places'
    });
  }
})();

(function () {
  'use strict';

  angular.module('app.tickets', []);
})();

(function () {
  'use strict';

  angular.module('app').controller('AccountController', AccountController);

  AccountController.$inject = ['currentAuth', 'user'];

  function AccountController(currentAuth, user) {

    var vm = this;
    vm.me = currentAuth;
    vm.update = update;

    activate();

    function activate() {
      user.get(currentAuth.uid).$loaded().then(function (userData) {
        vm.name = userData.name || '';
        vm.fullName = userData.fullName || '';
        vm.email = userData.email || '';
        vm.gender = userData.gender || '';
      });
    }

    function update() {
      var key = currentAuth.uid;
      var updateData = {
        name: vm.name,
        fullName: vm.fullName,
        email: vm.email,
        gender: vm.gender,
        imageUrl: currentAuth.facebook.profileImageURL
      };
      user.save(key, updateData).then(function (ref) {
        console.log('Update Success!');
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.account').config(route);

  route.$inject = ['$stateProvider'];

  function route($stateProvider) {
    $stateProvider
      .state('account', {
        url: '/account',
        controller: 'AccountController',
        controllerAs: 'account',
        templateUrl: 'app/account/account.html',
        resolve: {
          currentAuth: ['auth', function (auth) {
            return auth.firebase.$requireAuth();
          }]
        }
      });
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('HomeController', HomeController);

  HomeController.$inject = ['$rootScope', '$state', 'currentAuth', 'user'];

  function HomeController($rootScope, $state, currentAuth, user) {

    var vm = this;
    vm.me = currentAuth;

    activate();

    function activate() {
      $rootScope.$on('$stateChangeSuccess', checkUserData);
      getFavorites();
    }

    function checkUserData() {
      var userData = user.get(currentAuth.uid);
      if (_.isUndefined(userData.name) || _.isUndefined(userData.email)) {
        $state.go('account');
      }
    }

    function getFavorites() {
      // console.log(user.get(currentAuth.uid));
      // user.get(currentAuth)
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.home').config(route);

  route.$inject = ['$stateProvider'];

  function route($stateProvider) {
    $stateProvider
      .state('home', {
        url: '/home',
        controller: 'HomeController',
        controllerAs: 'home',
        templateUrl: 'app/home/home.html',
        resolve: {
          currentAuth: ['auth', function (auth) {
            return auth.firebase.$requireAuth();
          }]
        }
      });
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('account', account);

  account.$inject = ['$firebaseArray', '$firebaseObject', 'config'];

  function account($firebaseArray, $firebaseObject, config) {

    return new Account();

    function Account() {
      var ref = new Firebase(config.serverUrl + 'accounts');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var accountRef = ref.child(id);
          return $firebaseObject(accountRef);
        },
        add: function (data) {
          return $firebaseArray(ref).$add(data);
        },
        save: function (key, data) {
          var newAccountRef = ref.child(key);
          var newAccount = $firebaseObject(newAccountRef);
          newAccount = angular.merge(newAccount, data);
          return newAccount.$save();
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('auth', auth);

  auth.$inject = ['$firebaseAuth', '$http', '$q', 'config'];

  function auth($firebaseAuth, $http, $q, config) {

    return new Auth();

    function Auth() {
      var firebaseRef = new Firebase(config.serverUrl);
      return {
        firebase: $firebaseAuth(firebaseRef),
        tokenGenerator: function (uid) {
          var deferred = $q.defer();
          var params = {
            uid: uid
          };
          $http.get(config.authApiUrl, { params: params }).then(function (response) {
            return deferred.resolve(response);
          }, function (response) {
            return deferred.reject(response);
          });
          return deferred.promise;
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('config', config);

  config.$inject = [];

  function config() {
    var Config = function () {
      return {
        'serverUrl': 'https://bandally.firebaseio.com/',
        'authApiUrl': 'http://localhost:4000'
      };
    };
    return new Config();
  }
})();

(function () {
  'use strict';

  angular.module('app.core').config(route);

  route.$inject = ['$urlRouterProvider'];

  function route($urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
  }
})();

(function () {
  'use strict';

  angular.module('app.core').run(run);

  run.$inject = ['$cookies', '$rootScope', '$state', 'auth'];

  function run($cookies, $rootScope, $state, auth) {

    // 該当ページのスラッグをbodyのclassに入れるため
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams, error) {
      $rootScope.pageName = toState.controllerAs;
    });

    // 未ログインのままログインが必要なページに遷移した場合の処理
    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
      if (error === 'AUTH_REQUIRED') {
        return $state.go('spots');
      }
    });

    // 初期化時にログイン済みかチェック
    auth.firebase.$waitForAuth().then(function (authData) {

      // ログイン済みの場合はトークンを更新してリターン
      if (!_.isNull(authData)) {
        putToken(authData.facebook.accessToken);
        return $state.go('home');
      }

      var token = getToken();

      // トークンを持っていない場合は未ログインユーザーとしてリターン
      if (_.isUndefined(token)) {
        return $state.go('spots');
      }

      // トークンでログイン可能かチェック
      auth.firebase.$authWithOAuthToken('facebook', token).then(function (authData) {
        console.log(authData);
        putToken(authData.facebook.accessToken);
        return $state.go('home');
      }).catch(function (error) {
        return $state.go('spots');
      });
    });

    function putToken(token) {
      $cookies.put('bandally', token, {
        expires: new Date(1000 * 60 * 60 * 24 * 365 * 10 + (new Date()).getTime())
      });
    }

    function getToken() {
      return $cookies.get('bandally');
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('language', language);

  language.$inject = ['$firebaseArray', '$firebaseObject', 'config'];

  function language($firebaseArray, $firebaseObject, config) {

    return new Language();

    function Language() {
      var ref = new Firebase(config.serverUrl + 'languages');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var userRef = ref.child(id);
          return $firebaseObject(userRef);
        },
        add: function (data) {
          return $firebaseArray(ref).$add(data);
        },
        save: function (data) {
          var newLanguageRef = ref.child(data.name);
          var newLanguage = $firebaseObject(newLanguageRef);
          newLanguage = angular.merge(newLanguage, data);
          return newLanguage.$save();
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').directive('loginButtons', loginButtons);

  loginButtons.$inject = [];

  function loginButtons() {
    return {
      templateUrl: 'app/core/login-buttons.html',
      scope: {},
      controller: LoginButtonsController,
      controllerAs: 'loginButtons',
      bindToController: true
    };
  }

  LoginButtonsController.$inject = ['$cookies', '$rootScope', '$state', 'account', 'auth', 'user'];

  function LoginButtonsController($cookies, $rootScope, $state, account, auth, user) {

    var vm = this;
    vm.fbLogin = fbLogin;

    activate();

    function activate() {}

    function fbLogin() {
      var scope = ['public_profile', 'email'];
      auth.firebase.$authWithOAuthPopup('facebook', {
        scope: scope.join()
      }).then(fbLoginSuccess).catch(fbLoginError);
    }

    function fbLoginSuccess(authData) {
      putToken(authData.token);
      account.save(authData.uid, authData).then(function (ref) {
        console.log(user.get('aaa'));
        if (_.isNull(user.get(authData.uid).$value)) {
          $state.go('home');
          return;
        }
        var userData = {};
        userData.name = authData.facebook.email ? authData.facebook.email.split('@')[0] : null;
        userData.fullName = authData.facebook.displayName || null;
        userData.email = authData.facebook.email || null;
        userData.gender = authData.facebook.cachedUserProfile.gender || null;
        userData.imageUrl = authData.facebook.profileImageURL || null;
        user.save(authData.uid, userData).then(userSaveSuccess, userSaveError);
      });
    }

    function fbLoginError(error) {
      console.log('Authentication failed:', error);
    }

    function userSaveSuccess(ref) {
      var userId = ref.key();
      var userName = user.get(userId).name;
      $rootScope.statuses = {
        userId: userId,
        userName: userName
      };
      $state.go('home');
    }

    function userSaveError(error) {
      console.log(error);
    }

    function putToken(token) {
      var now = (new Date()).getTime();
      var expires = new Date(1000 * 60 * 60 * 24 * 365 * 10 + now);
      var options = {
      	expires: expires
      };
      $cookies.put('bandally', token, options);
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('photo', photo);

  photo.$inject = ['$firebaseArray', '$firebaseObject', 'config'];

  function photo($firebaseArray, $firebaseObject, config) {

    return new Photo();

    function Photo() {
      var ref = new Firebase(config.serverUrl + 'photos');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var photoRef = ref.child(id);
          return $firebaseObject(photoRef);
        },
        add: function (data) {
          return $firebaseArray(ref).$add(data);
        },
        save: function (data) {
          var newPhotoRef = ref.child(data.uid);
          var newPhoto = $firebaseObject(newPhotoRef);
          newPhoto = angular.merge(newPhoto, data);
          return newPhoto.$save();
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('room', room);

  room.$inject = ['$firebaseArray', '$firebaseObject', 'config'];

  function room($firebaseArray, $firebaseObject, config) {

    return new Room();

    function Room() {
      var ref = new Firebase(config.serverUrl + 'rooms');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var userRef = ref.child(id);
          return $firebaseObject(userRef);
        },
        add: function (data) {
          return $firebaseArray(ref).$add(data);
        },
        postMessage: function (roomId, data) {
          var roomRef = ref.child(roomId).child('messages');
          return $firebaseArray(roomRef).$add(data);
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('spot', spot);

  spot.$inject = ['$firebaseArray', '$firebaseObject', 'config'];

  function spot($firebaseArray, $firebaseObject, config) {

    return new Spot();

    function Spot() {
      var ref = new Firebase(config.serverUrl + 'spots');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        add: function (data) {
          return $firebaseArray(ref).$add(data);
        },
        save: function (data) {
          var newSpotRef = ref.child(data.uid);
          var newSpot = $firebaseObject(newSpotRef);
          newSpot = angular.merge(newSpot, data);
          return newSpot.$save();
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('ticket', ticket);

  ticket.$inject = ['$firebaseArray', 'config'];

  function ticket($firebaseArray, config) {
    var ref = new Firebase(config.serverUrl + 'tickets');
    return $firebaseArray(ref);
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('user', user);

  user.$inject = ['$firebaseArray', '$firebaseObject', '$rootScope', 'config'];

  function user($firebaseArray, $firebaseObject, $rootScope, config) {

    return new User();

    function User() {
      var ref = new Firebase(config.serverUrl + 'users');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var userRef = ref.child(id);
          return $firebaseObject(userRef);
        },
        add: function (data) {
          return $firebaseArray(ref).$add(data);
        },
        save: function (key, data) {
          var newUserRef = ref.child(key);
          var newUser = $firebaseObject(newUserRef);
          newUser = angular.merge(newUser, data);
          return newUser.$save();
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('HostsController', HostsController);

  HostsController.$inject = ['currentAuth', 'photo'];

  function HostsController(currentAuth, photo) {

    var vm = this;
    vm.me = currentAuth;

    activate();

    function activate() {
      vm.images = photo.getAll();
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.hosts').config(route);

  route.$inject = ['$stateProvider'];

  function route($stateProvider) {
    $stateProvider
      .state('hosts', {
        url: '/:userId',
        controller: 'HostsController',
        controllerAs: 'hosts',
        templateUrl: 'app/hosts/hosts.html',
        resolve: {
          currentAuth: ['auth', function(auth) {
            return auth.$requireAuth();
          }]
        }
      });
  }
})();

(function () {
  'use strict';

  angular.module('app').directive('header', header);

  header.$inject = [];

  function header() {
    return {
      templateUrl: 'app/layout/header.html',
      scope: {},
      controller: HeaderController,
      controllerAs: 'header',
      bindToController: true
    };
  }

  HeaderController.$inject = ['$cookies', '$state', 'auth'];

  function HeaderController($cookies, $state, auth) {

    var vm = this;
    vm.auth = {};
    vm.logout = logout;

    activate();

    function activate() {
      auth.firebase.$onAuth(function (authData) {
        vm.auth = authData;
      });
    }

    function logout() {
      auth.firebase.$unauth();
      $cookies.remove('bandally');
      $state.go('spots');
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.room').controller('RoomController', RoomController);

  RoomController.$inject = ['$rootScope', '$stateParams', 'currentAuth', 'photo', 'room', 'user'];

  function RoomController($rootScope, $stateParams, currentAuth, photo, room, user) {

    var id = $stateParams.roomId;

    var vm = this;
    vm.me = currentAuth;
    vm.room = {};
    vm.users = {};
    vm.isMe = isMe;
    vm.postMessage = postMessage;
    vm.schedule = [];

    activate();

    function activate() {
      room.get(id).$watch(getMessages);
      setCalendarConfig();
      vm.schedule.push([{
        title: 'Open Sesame',
        start: new Date(2015, 11, 28),
        // end: new Date(2015, 11, 29),
        allDay: true,
        className: ['openSesame']
      }]);
    }

    function getMessages() {
      room.get(id).$loaded().then(function (room) {
        vm.room = room;
        user.get(room.guestId).$loaded().then(function (guest) {
          vm.guest = guest;
        });
        user.get(room.hostId).$loaded().then(function (host) {
          vm.host = host;
          vm.host.photos = photo.getAll();
        });
        angular.forEach(room.userIds, function (bool, userId) {
          user.get(userId).$loaded().then(function (user) {
            vm.users[user.name] = user;
            if (_.includes(user.accountIds, currentAuth.uid)) {
              room.me = user.name;
            }
          });
        });
      });
    }

    function setCalendarConfig() {
      vm.uiConfig = {
        calendar: {
          height: 500,
          editable: true,
          header: {
            left: 'title',
            center: '',
            right: 'prev,today,next'
          }
        }
      };
    }

    function isMe(userId) {
      return vm.room.me === userId;
    }

    function postMessage() {
      var postData = {
        message: vm.newMessage,
        userId: vm.room.me
      };
      room.postMessage(vm.room.$id, postData).then(function () {
        vm.newMessage = '';
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.room').config(route);

  route.$inject = ['$stateProvider'];

  function route($stateProvider) {
    $stateProvider
      .state('room', {
        url: '/rooms/:roomId',
        controller: 'RoomController',
        controllerAs: 'room',
        templateUrl: 'app/room/room.html',
        resolve: {
          currentAuth: ['auth', function(auth) {
            return auth.$requireAuth();
          }]
        }
      });
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('SpotsController', SpotsController);

  SpotsController.$inject = ['$rootScope', 'currentAuth', 'language', 'photo', 'spot', 'uiGmapGoogleMapApi', 'user'];

  function SpotsController($rootScope, currentAuth, language, photo, spot, uiGmapGoogleMapApi, user) {

    var _bounds = {};
    var _dragging = false;

    var vm = this;
    vm.me = currentAuth;
    vm.map = {};
    vm.control = {};
    vm.events = {};
    vm.markers = [];
    vm.searchbox = {};
    vm.languages = {};
    vm.getSpots = getSpots;

    activate();

    function activate() {
      setGoogleMap();
      setSearchbox();
      getLanguages();
    }

    function setGoogleMap() {
      setMapHeight();
      uiGmapGoogleMapApi.then(function (maps) {
        vm.map.center = {
          latitude: 0,
          longitude: 0
        };
        vm.map.zoom = 2;
        vm.map.events = {
          bounds_changed: boundsChanged,
          drag: drag,
          dragend: dragend
        };
      });
    }

    function setMapHeight() {
      var contentHeight = window.innerHeight - 58 - 25;
      angular.element(document).find('.angular-google-map-container').css({ height: contentHeight + 'px' });
    }

    function getBounds(map) {
      _bounds = {
        ne: {
          lat: map.getBounds().getNorthEast().lat(),
          lng: map.getBounds().getNorthEast().lng()
        },
        sw: {
          lat: map.getBounds().getSouthWest().lat(),
          lng: map.getBounds().getSouthWest().lng()
        }
      };
    }

    function boundsChanged(map) {
      if (_dragging) return;
      getBounds(map);
      vm.markers = [];
      getSpots();
    }

    function drag() {
      _dragging = true;
    }

    function dragend(map) {
      _dragging = false;
      if (_dragging) return;
      getBounds(map);
      vm.markers = [];
      getSpots();
    }

    function setSearchbox() {
      vm.searchbox = {
        template: 'app/spots/searchbox.html',
        events: {
          places_changed: function (searchBox) {
            var place = searchBox.getPlaces();
            if (!place || place === 'undefined' || place.length === 0) {
              console.log('no place data :(');
              return;
            }
            vm.map.center = {
              latitude: place[0].geometry.location.lat(),
              longitude: place[0].geometry.location.lng()
            };
          }
        },
        position: 'top-right',
        options: {
          bounds: {},
          visible: true,
          // autocomplete: true
        },
      };
    }

    function getSpots() {
      vm.markers = [];
      spot.getAll().$loaded().then(getSpotsSuccess);
    }

    function getSpotsSuccess(spots) {
      angular.forEach(spots, setSpotData);
    }

    function setSpotData(spot, index) {
      var isCurrentLatitude = spot.geoCode.latitude < _bounds.ne.lat && spot.geoCode.latitude > _bounds.sw.lat;
      var isCurrentLongitude = spot.geoCode.longitude < _bounds.ne.lng && spot.geoCode.longitude > _bounds.sw.lng;
      if (!isCurrentLatitude || !isCurrentLongitude) {
        return;
      }
      var newSpot = {};
      newSpot.id = spot.$id;
      newSpot.latitude = spot.geoCode.latitude;
      newSpot.longitude = spot.geoCode.longitude;
      newSpot.show = true;
      newSpot.events = {
        mouseover: function (marker) {
          newSpot.show = true;
        },
        mouseout: function (marker) {
          newSpot.show = false;
        }
      };
      newSpot.photos = [];
      photo.get(spot.photoId).$loaded().then(function (photo) {
        newSpot.photos.push(photo);
        photo.user = {};
        user.get(photo.userId).$loaded().then(function (user) {
          photo.user = user;
          var keepGoing = true;
          angular.forEach(vm.languages, function (language) {
            if (!keepGoing) return;
            if (!language.checked) return;
            if (!_.has(newSpot.photos[0].user.languageIds, language.$id)) return;
            vm.markers.push(newSpot);
            keepGoing = false;
          });
        });
      });
    }

    function getLanguages() {
      language.getAll().$loaded().then(function (languages) {
        vm.languages = languages;
        angular.forEach(languages, function (language) {
          language.checked = true;
        });
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.spots').config(route);

  route.$inject = ['$stateProvider'];

  function route($stateProvider) {
    $stateProvider
      .state('spots', {
        url: '/',
        controller: 'SpotsController',
        controllerAs: 'spots',
        templateUrl: 'app/spots/spots.html',
        resolve: {
          currentAuth: ['auth', function (auth) {
            return auth.firebase.$waitForAuth();
          }]
        }
      });
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('TicketsAddController', TicketsAddController);

  TicketsAddController.$inject = ['$state', 'ticket'];

  function TicketsAddController($state, ticket) {
    var vm = this;
    vm.add = add;

    activate();

    function activate() {}

    function add() {
      ticket.$add({
        departureDate: vm.departureDate,
        arrivedDate: vm.arrivedDate,
        destination: vm.destination,
        languages: vm.languages,
        message: vm.message
      }).then(function () {
        $state.go('tickets');
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('TicketsController', TicketsController);

  TicketsController.$inject = ['ticket'];

  function TicketsController(ticket) {
    var vm = this;
    vm.tickets = [];

    activate();

    function activate() {
      vm.tickets = ticket;
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.tickets').config(route);

  route.$inject = ['$stateProvider'];

  function route($stateProvider) {
    $stateProvider
      .state('tickets', {
        url: '/tickets',
        controller: 'TicketsController',
        controllerAs: 'tickets',
        templateUrl: 'app/tickets/tickets.html',
        resolve: {
          currentAuth: ['auth', function(auth) {
            return auth.$requireAuth();
          }]
        }
      })
      .state('tickets.add', {
        url: '/add',
        views: {
          "@": {
            controller: 'TicketsAddController',
            controllerAs: 'ticketsAdd',
            templateUrl: 'app/tickets/tickets-add.html'
          }
        },
        resolve: {
          currentAuth: ['auth', function(auth) {
            return auth.$requireAuth();
          }]
        }
      });
  }
})();

//# sourceMappingURL=app.js.map
