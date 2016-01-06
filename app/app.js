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
    'toastr',
    'ui.calendar',
    'firebase',
    'pascalprecht.translate',
    'ngFileUpload',
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

  angular.module('app.core', []).config(config);

  config.$inject = ['$translateProvider'];

  function config($translateProvider) {
    $translateProvider.useStaticFilesLoader({
      prefix: 'app/i18n/',
      suffix: '.json'
    });
    $translateProvider.uniformLanguageTag('bcp47').determinePreferredLanguage();
  	// $translateProvider.preferredLanguage('ja');
  	// $translateProvider.fallbackLanguage('en');
  	$translateProvider.useMissingTranslationHandlerLog();
  	$translateProvider.useLocalStorage();
  	$translateProvider.useSanitizeValueStrategy('escaped');
  }
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

  AccountController.$inject = ['currentAuth', 'toastr', 'user'];

  function AccountController(currentAuth, toastr, user) {

    var vm = this;
    vm.me = currentAuth;
    vm.update = update;

    activate();

    function activate() {
      getUserData();
    }

    function getUserData() {
      user.get(currentAuth.uid).$loaded().then(function (userData) {
        var birthDay;
        if (!_.isNull(userData.birth)) {
          birthDay = moment(userData.birth)._d;
        }
        vm.name = userData.name || '';
        vm.fullName = userData.fullName || '';
        vm.email = userData.email || '';
        vm.gender = userData.gender || '';
        vm.languages = userData.languages || '';
        vm.birth = birthDay || '';
        vm.job = userData.job || '';
        vm.residence = userData.residence || '';
        vm.languageCollection = _.keys(vm.languages);
        vm.messages = userData.messages || '';
      });
    }

    function update() {
      var birthTime = new Date(vm.birth).getTime();
      var birthDay = moment(birthTime).format('YYYY-MM-DD');
      var key = currentAuth.uid;
      var updateData = {
        name: vm.name,
        fullName: vm.fullName,
        email: vm.email,
        gender: vm.gender,
        languages: vm.languages,
        birth: birthDay,
        job: vm.job,
        residence: vm.residence,
        messages: vm.messages,
        imageUrl: currentAuth.facebook.profileImageURL
      };
      user.save(key, updateData).then(function (ref) {
        toastr.success('Update Success!');
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
          currentAuth: getCurrentAuth
        }
      });
  }

  getCurrentAuth.$inject = ['auth'];

  function getCurrentAuth(auth) {
    return auth.check(true);
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

  auth.$inject = ['$cookies', '$firebaseAuth', '$q', '$rootScope', 'account', 'cache', 'config', 'data', 'User', 'user', 'userId'];

  function auth($cookies, $firebaseAuth, $q, $rootScope, account, cache, config, data, User, user, userId) {

    var _isInitialized = false;
    var _newAuth = {};
    var _newUser = {};
    var _defferd;

    var firebaseRef = new Firebase(config.serverUrl);
    var firebase = $firebaseAuth(firebaseRef);
    return new Auth();

    function Auth() {
      return {
        firebase: firebase,
        check: check,
        login: login,
        logout: logout
      };
    }

    function check(required) {
      if (_isInitialized) {
        return required ? firebase.$requireAuth() : firebase.$waitForAuth();
      }
      _isInitialized = true;
      return required ? firebase.$requireAuth().then(checkSuccess) : firebase.$waitForAuth().then(checkSuccess);
    }

    function checkSuccess(authData) {
      _defferd = $q.defer();
      if (_.isNull(authData)) {
        _isInitialized = false;
        _defferd.resolve();
        return _defferd.promise;
      }
      data.me = new User(authData.uid);
      user.get(authData.uid).$loaded().then(function (me) {
        $rootScope.me = me;
        angular.merge($rootScope, {
          statuses: {
            userId: authData.uid,
            userName: user.name
          }
        });
        return _defferd.resolve(authData);
      });
      return _defferd.promise;
    }

    function login() {
      _defferd = $q.defer();
      if (cache.has()) {
        fbLoginWithToken();
      } else {
        fbLogin();
      }
      return _defferd.promise;
    }

    function fbLogin() {
      var scope = ['public_profile', 'email'];
      return firebase.$authWithOAuthPopup('facebook', {
        scope: scope.join()
      }).then(fbLoginSuccess).catch(authenticationFailed);
    }

    function fbLoginWithToken() {
      return firebase
        .$authWithOAuthToken('facebook', cache.get())
        .then(fbLoginSuccess)
        .catch(authenticationFailed);
    }

    function fbLoginSuccess(authData) {
      _newAuth = authData;
      cache.put(_newAuth.facebook.accessToken);
      return account.save(_newAuth.uid, _newAuth).then(accountSaveSuccess, authenticationFailed);
    }

    function accountSaveSuccess(ref) {
      return user.exists(_newAuth.uid).then(userExistsSuccess, userExistsFailed);
    }

    function userExistsSuccess(userData) {
      angular.merge($rootScope, {
        statuses: {
          userId: _newAuth.uid,
          userName: userData.name
        }
      });
      return _defferd.resolve(userData);
    }

    function userExistsFailed() {
      _newUser.name = _newAuth.facebook.email ? _newAuth.facebook.email.split('@')[0] : null;
      _newUser.fullName = _newAuth.facebook.displayName || null;
      _newUser.email = _newAuth.facebook.email || null;
      _newUser.gender = _newAuth.facebook.cachedUserProfile.gender || null;
      _newUser.imageUrl = _newAuth.facebook.profileImageURL || null;
      return user.save(_newAuth.uid, _newUser).then(userSaveSuccess, authenticationFailed);
    }

    function userSaveSuccess(ref) {
      return userId.save(_newUser.name, _newAuth.uid).then(userIdSaveSuccess, authenticationFailed);
    }

    function userIdSaveSuccess(ref) {
      return _defferd.resolve();
    }

    function authenticationFailed() {
      return _defferd.reject();
    }

    function logout() {
      firebase.$unauth();
      return $cookies.remove('bandally');
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').directive('background', background);

  background.$inject = [];

  function background() {
    return {
      templateUrl: 'app/core/background.html',
      scope: {
        backgroundImages: '='
      },
      controller: BackgroundController,
      controllerAs: 'background',
      bindToController: true
    };
  }

  BackgroundController.$inject = ['$interval', '$scope'];

  function BackgroundController($interval, $scope) {

    var vm = this;
    vm.activeBg = 0;

    activate();

    function activate() {
      $scope.$watch('background.backgroundImages', function (value) {
        if (_.isUndefined(value)) return;
        startBgCarousel();
      });
    }

    function startBgCarousel() {
      $interval(function () {
        if (vm.activeBg === vm.backgroundImages.length - 1) {
          vm.activeBg = 0;
          return;
        }
        return vm.activeBg++;
      }, 6000);
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('cache', cache);

  cache.$inject = ['$cookies'];

  function cache($cookies) {

    var _name = 'bandally';
    var _expires = new Date(1000 * 60 * 60 * 24 * 365 * 10 + (new Date()).getTime());

    return new Cache();

    function Cache() {
      return {
        has: has,
        get: get,
        put: put
      };
    }

    function has() {
      var data = $cookies.get(_name);
      return !_.isUndefined(data);
    }

    function get() {
      var data = $cookies.get(_name);
      return data || false;
    }

    function put(data) {
      if (!data) {
        return false;
      }
      $cookies.put(_name, data, {
        expires: _expires
      });
      return data;
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

  angular.module('app.core').factory('contact', contact);

  contact.$inject = ['$firebaseArray', '$firebaseObject', 'config'];

  function contact($firebaseArray, $firebaseObject, config) {

    return new Contact();

    function Contact() {
      var ref = new Firebase(config.serverUrl + 'contacts');
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
          var newContactRef = ref.child(key);
          var newContact = $firebaseObject(newContactRef);
          newContact = angular.merge(newContact, data);
          return newContact.$save();
        },
        remove: function (key) {
          var contactRef = ref.child(key);
          return $firebaseObject(contactRef).$remove();
        }
      };
    }
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

  run.$inject = ['$cookies', '$rootScope', '$state', 'auth', 'cache', 'toastr', 'User'];

  function run($cookies, $rootScope, $state, auth, cache, toastr, User) {

    $rootScope.me = {};

    // 該当ページのスラッグをbodyのclassに入れるため
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams, error) {
      angular.merge($rootScope, {
        statuses: {
          pageName: toState.controllerAs
        }
      });
    });

    // 未ログインのままログインが必要なページに遷移した場合の処理
    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
      console.log(error);
      if (error === 'AUTH_REQUIRED') {
        toastr.warning('You require sign in!', 'Warning');
        return $state.go('spots');
      }
    });
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('data', data);

  data.$inject = [];

  function data() {
    return {
      me: {}
    };
  }
})();

(function () {
  'use strict';

  angular.module('app').directive('fileUpload', fileUpload);

  fileUpload.$inject = [];

  function fileUpload() {
    return {
      templateUrl: 'app/core/file-upload.html',
      scope: {},
      controller: FileUploadController,
      controllerAs: 'fileUpload',
      bindToController: true
    };
  }

  FileUploadController.$inject = ['$rootScope', 'data', 'Photo', 'toastr', 'Upload', 'user'];

  function FileUploadController($rootScope, data, Photo, toastr, Upload, user) {

    var _photoData = {};

    var vm = this;
    vm.picFile = null;
    vm.uploadPic = uploadPic;

    function uploadPic(file) {
      if (_.isNull(file)) {
        return toastr.warning('Image is not selected.');
      }
      return encode(file);
    }

    function encode(file) {
      return Upload.base64DataUrl(file).then(uplodeEncodedImage);
    }

    function uplodeEncodedImage(base64Image) {
      _photoData = {
        data: base64Image,
      };
      return new Photo(data.me.$id).$add(_photoData).then(function (ref) {
        vm.picFile = null;
        return toastr.success('Upload Success!');
      });
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

  LoginButtonsController.$inject = ['$cookies', '$rootScope', '$state', 'account', 'auth', 'toastr', 'user'];

  function LoginButtonsController($cookies, $rootScope, $state, account, auth, toastr, user) {

    var vm = this;
    vm.fbLogin = fbLogin;

    activate();

    function activate() {}

    function fbLogin() {
      return auth.login().then(fbLoginSuccess, fbLoginFailed);
    }

    function fbLoginSuccess() {
      return $state.go('home');
    }

    function fbLoginFailed() {
      toastr.error('Authentication failed.', 'Error');
      return $state.go('spots');
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('notification', notification);

  notification.$inject = ['$firebaseArray', '$firebaseObject', 'config'];

  function notification($firebaseArray, $firebaseObject, config) {

    return new Notification();

    function Notification() {
      var ref = new Firebase(config.serverUrl + 'notifications');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var userRef = ref.child(id);
          return $firebaseObject(userRef);
        },
        add: function (userName, data) {
          var userRef = ref.child(userName);
          return $firebaseArray(userRef).$add(data);
        },
        save: function (key, data) {
          var newNotificationRef = ref.child(key);
          var newNotification = $firebaseObject(newNotificationRef);
          newNotification = angular.merge(newNotification, data);
          return newNotification.$save();
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core')
    .factory('PhotoFactory', PhotoFactory)
    .factory('Photo', Photo);

  PhotoFactory.$inject = ['$firebaseArray', '$q', 'config', 'Transaction'];

  function PhotoFactory($firebaseArray, $q, config, Transaction) {

    return $firebaseArray;
  }

  Photo.$inject = ['config', 'PhotoFactory'];

  function Photo(config, PhotoFactory) {
    var ref = new Firebase(config.serverUrl + 'photos');
    return function (userId) {
      return new PhotoFactory(ref.child(userId));
    };
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('photo', photo);

  photo.$inject = ['$firebaseArray', '$firebaseObject', 'config', 'user'];

  function photo($firebaseArray, $firebaseObject, config, user) {

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
        },
        remove: function (id) {
          var photoRef = ref.child(id);
          var photo = $firebaseObject(photoRef);
          return photo.$remove();
        },
        upload: function (data) {
          ref.transaction(function (currentData) {
            return $firebaseArray(ref).$add(data).then(function (photoRef) {
              return user.addPhoto(photoRef.key()).then(function (userRef) {
                return userRef;
              });
            });
          }, function (error, committed, snapshot) {
            if (error) {
              return console.log('Transaction failed abnormally!', error);
            }
            if (!committed) {
              return console.log('We aborted the transaction.');
            }
            console.log(snapshot);
            return snapshot;
          });
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core')
    .factory('RoomFactory', RoomFactory)
    .factory('Room', Room);

  RoomFactory.$inject = ['$firebaseArray', '$firebaseObject', '$q', 'config', 'Transaction'];

  function RoomFactory($firebaseArray, $firebaseObject, $q, config, Transaction) {

    var _room;

    return $firebaseObject.$extend({
      $$updated: function (snapshot) {
        var changed = $firebaseObject.prototype.$$updated.apply(this, arguments);
        _room = this;
        return changed;
      }
    });

    function removePhoto(photoId) {
      var deferred = $q.defer();
      var updateData = {};
      var updateKey1 = 'users/' + _user.$id + '/photos/' + photoId;
      var updateKey2 = 'photos/' + photoId;
      var updateKey3 = 'spots/' + photoId;
      updateData[updateKey1] = null;
      updateData[updateKey2] = null;
      updateData[updateKey3] = null;
      Transaction.save(updateData).then(
        function (ref) {
          return deferred.resolve(ref);
        },
        function (error) {
          return deferred.reject(error);
        }
      );
      return deferred.promise;
    }
  }

  Room.$inject = ['config', 'RoomFactory'];

  function Room(config, RoomFactory) {
    var ref = new Firebase(config.serverUrl + 'rooms');
    return function (roomId) {
      return new RoomFactory(ref.child(roomId));
    };
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
        getNewRef: function () {
          return ref.push();
        },
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
        getMessages: function (roomId) {
          var messagesRef = ref.child(roomId).child('messages');
          return $firebaseArray(messagesRef);
        },
        postMessage: function (roomId, data) {
          var messagesRef = ref.child(roomId).child('messages');
          return $firebaseArray(messagesRef).$add(data);
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('spot', spot);

  spot.$inject = ['$firebaseArray', '$firebaseObject', '$q', 'config'];

  function spot($firebaseArray, $firebaseObject, $q, config) {

    return new Spot();

    function Spot() {
      var ref = new Firebase(config.serverUrl + 'spots');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var spotRef = ref.child(id);
          return $firebaseObject(spotRef);
        },
        save: function (data) {
          var newSpotRef = ref.child(data.uid);
          var newSpot = $firebaseObject(newSpotRef);
          newSpot = angular.merge(newSpot, data);
          return newSpot.$save();
        },
        add: function (photoId, latlng) {
          var geofire = new GeoFire(ref);
          return geofire.set(photoId, latlng);
        },
        query: function (center, radius) {
          var deferred = $q.defer();
          var spots = [];
          var geoFire = new GeoFire(ref);
          var geoQuery = geoFire.query({
            center: center,
            radius: radius
          });
          geoQuery.on('key_entered', function (id, location, distance) {
            spots.push({
              id: id,
              location: location,
              distance: distance
            });
          });
          geoQuery.on('ready', function () {
            return deferred.resolve(spots);
          });
          return deferred.promise;
        },
        distance: function (locations) {
          return GeoFire.distance(locations[0], locations[1]);
        },
        exists: function (photoId) {
          var deferred = $q.defer();
          ref.once('value', function (snapshot) {
            if (snapshot.exists()) {
              return deferred.resolve();
            } else {
              return deferred.reject();
            }
          });
          return deferred.promise;
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

  angular.module('app.core').factory('Transaction', Transaction);

  Transaction.$inject = ['$firebaseArray', '$firebaseObject', '$q', 'config'];

  function Transaction($firebaseArray, $firebaseObject, $q, config) {

    var ref = new Firebase(config.serverUrl);

    return new TransactionFactory();

    function TransactionFactory() {
      return {
        save: save
      };
    }

    function save(data) {
      var deferred = $q.defer();
      ref.update(data, function (error) {
        if (error) {
          return deferred.reject(error);
        } else {
          return deferred.resolve(ref);
        }
      });
      return deferred.promise;
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('userId', userId);

  userId.$inject = ['$firebaseArray', '$firebaseObject', '$rootScope', 'config'];

  function userId($firebaseArray, $firebaseObject, $rootScope, config) {

    return new UserId();

    function UserId() {
      var ref = new Firebase(config.serverUrl + 'userIds');
      return {
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var userIdRef = ref.child(id);
          return $firebaseObject(userIdRef);
        },
        add: function (data) {
          return $firebaseArray(ref).$add(data);
        },
        save: function (key, value) {
          var newUserIdRef = ref.child(key);
          var newUserId = $firebaseObject(newUserIdRef);
          newUserId.$value = value;
          return newUserId.$save();
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core')
    .factory('UserFactory', UserFactory)
    .factory('User', User);

  UserFactory.$inject = ['$firebaseArray', '$firebaseObject', '$q', 'config', 'Transaction'];

  function UserFactory($firebaseArray, $firebaseObject, $q, config, Transaction) {

    return $firebaseObject.$extend({
      $$updated: function (snapshot) {
        var changed = $firebaseObject.prototype.$$updated.apply(this, arguments);
        getPhotos(this);
        adjustMessages(this);
        return changed;
      },
      getRooms: function () {
        var user = this;
        if (!_.has(user, 'rooms')) return;
        var roomsRef = new Firebase(config.serverUrl + 'rooms');
        var rooms = [];
        angular.forEach(user.rooms, function (bool, roomId) {
          rooms.push($firebaseObject(roomsRef.child(roomId)));
        });
        user.roomsData = rooms;
      },
      getFavorites: function () {
        var user = this;
        if (!_.has(user, 'favorites')) return;
        var favoritesRef = new Firebase(config.serverUrl + 'users');
        var favorites = [];
        angular.forEach(user.favorites, function (bool, favoriteUserId) {
          favorites.push($firebaseObject(favoritesRef.child(favoriteUserId)));
        });
        user.favoritesData = favorites;
      },
      getLanguages: function () {
        var user = this;
        var languagesRef = new Firebase(config.serverUrl + 'languages');
        $firebaseArray(languagesRef).$loaded(function (languages) {
          user.languagesData = _.filter(languages, function (language) {
            return _.has(user.languages, language.$id);
          });
        });
      },
      removePhoto: function (photoId) {
        var user = this;
        var deferred = $q.defer();
        var updateData = {};
        var updateKey1 = 'photos/' + user.$id + '/' + photoId;
        var updateKey2 = 'spots/' + user.$id + '::' + photoId;
        updateData[updateKey1] = null;
        updateData[updateKey2] = null;
        Transaction.save(updateData).then(
          function (ref) {
            return deferred.resolve(ref);
          },
          function (error) {
            return deferred.reject(error);
          }
        );
        return deferred.promise;
      },
      releaseSpot: function (photoId) {
        var user = this;
        var deferred = $q.defer();
        var updateData = {};
        var updateKey1 = 'spots/' + user.$id + '::' + photoId;
        updateData[updateKey1] = null;
        Transaction.save(updateData).then(
          function (ref) {
            return deferred.resolve(ref);
          },
          function (error) {
            return deferred.reject(error);
          }
        );
        return deferred.promise;
      }
    });

    function getPhotos(user) {
      var photosRef = new Firebase(config.serverUrl + 'photos');
      user.photos = $firebaseArray(photosRef.child(user.$id));
    }

    function adjustMessages(user) {
      var userMessagesRef = new Firebase(config.serverUrl + 'users/' + user.$id + '/messages');
      user.messages = $firebaseArray(userMessagesRef);
    }
  }

  User.$inject = ['config', 'UserFactory'];

  function User(config, UserFactory) {
    var ref = new Firebase(config.serverUrl + 'users');
    return function (userId) {
      return new UserFactory(ref.child(userId));
    };
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('user', user);

  user.$inject = ['$firebaseArray', '$firebaseObject', '$q', '$rootScope', 'config', 'userId'];

  function user($firebaseArray, $firebaseObject, $q, $rootScope, config, userId) {

    return new User();

    function User() {
      var ref = new Firebase(config.serverUrl + 'users');
      return {
        setMe: function (id) {
          var userRef = ref.child(id);
          return $firebaseObject(userRef).$loaded().then(function (me) {
            _me = me;
          });
        },
        getAll: function () {
          return $firebaseArray(ref);
        },
        get: function (id) {
          var userRef = ref.child(id);
          return $firebaseObject(userRef);
        },
        getByName: function (name) {
          var deferred = $q.defer();
          userId.get(name).$loaded().then(function (userId) {
            var userRef = ref.child(userId.$value);
            return deferred.resolve($firebaseObject(userRef).$loaded());
          });
          return deferred.promise;
        },
        add: function (data) {
          return $firebaseArray(ref).$add(data);
        },
        save: function (key, data) {
          var deferred = $q.defer();
          var saveUserRef = ref.child(key);
          $firebaseObject(saveUserRef).$loaded().then(
            function (saveUser) {
              return angular.merge(saveUser, data).$save().then(
                function (ref) {
                  return deferred.resolve(ref);
                },
                function (error) {
                  return deferred.reject(error);
                }
              );
            },
            function (error) {
              return deferred.reject(error);
            }
          );
          return deferred.promise;
        },
        exists: function (id) {
          var deferred = $q.defer();
          var userRef = ref.child(id);
          $firebaseObject(userRef).$loaded().then(function (user) {
            if (_.isNull(user.$value)) {
              return deferred.reject();
            }
            return deferred.resolve(user);
          });
          return deferred.promise;
        },
        addPhoto: function (photoId) {
          var photoRef = ref.child($rootScope.statuses.userId).child('photos').child(photoId);
          var newPhoto = $firebaseObject(photoRef);
          newPhoto.$value = true;
          return newPhoto.$save();
        },
        removePhoto: function (photoId) {
          var photoRef = ref.child($rootScope.statuses.userId).child('photos').child(photoId);
          var photo = $firebaseObject(photoRef);
          return photo.$remove();
        },
        addNotification: function (userName, data) {
          var deferred = $q.defer();
          userId.get(userName).$loaded().then(function (userId) {
            var notificationRef = ref.child(userId.$value).child('notifications');
            return $firebaseArray(notificationRef).$add(data).then(function (ref) {
              return deferred.resolve(ref);
            });
          });
          return deferred.promise;
        },
        addFavorite: function (favoriteUserId) {
          var favoritesRef = ref.child($rootScope.statuses.userId).child('favorites').child(favoriteUserId);
          var newFavorite = $firebaseObject(favoritesRef);
          newFavorite.$value = true;
          return newFavorite.$save();
        },
        addFavoritedCount: function (favoriteUserId) {
          var deferred = $q.defer();
          var favoritedCountRef = ref.child(favoriteUserId).child('favoritedCount');
          var favoritedCount = $firebaseObject(favoritedCountRef);
          favoritedCount.$loaded().then(function (favoritedCount) {
            favoritedCount.$value = _.isUndefined(favoritedCount.$value) ? 1 : favoritedCount.$value + 1;
            return deferred.resolve(favoritedCount.$save());
          });
          return deferred.promise;
        },
        removeFavorite: function (favoriteUserId) {
          var favoriteRef = ref.child($rootScope.statuses.userId).child('favorites').child(favoriteUserId);
          var favorite = $firebaseObject(favoriteRef);
          return favorite.$remove();
        },
        removeFavoritedCount: function (favoriteUserId) {
          var deferred = $q.defer();
          var favoritedCountRef = ref.child(favoriteUserId).child('favoritedCount');
          var favoritedCount = $firebaseObject(favoritedCountRef);
          favoritedCount.$loaded().then(function (favoritedCount) {
            favoritedCount.$value--;
            return deferred.resolve(favoritedCount.$save());
          });
          return deferred.promise;
        }
      };
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.core').factory('utility', utility);

  utility.$inject = ['$firebaseObject', 'config', 'User'];

  function utility($firebaseObject, config, User) {

    var ref = new Firebase(config.serverUrl);

    return {
      getUserByName: getUserByName
    };

    function getUserByName(userName) {
      var userIdRef = ref.child('userIds/' + userName);
      return $firebaseObject(userIdRef).$loaded(function (userId) {
        return new User(userId.$value);
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('HomeController', HomeController);

  HomeController.$inject = ['$rootScope', '$state', '$uibModal', 'data', 'Photo', 'room', 'spot', 'toastr', 'User'];

  function HomeController($rootScope, $state, $uibModal, data, Photo, room, spot, toastr, User) {

    var userId = data.me.$id;

    var vm = this;
    vm.me = data.me;
    vm.rooms = [];
    vm.removePhoto = removePhoto;
    vm.showModal = showModal;
    vm.releaseSpot = releaseSpot;

    activate();

    function activate() {
      checkUserData();
      getRoom();
      checkPhotos();
      vm.me.getFavorites();
    }

    function checkUserData() {
      if (_.isUndefined(vm.me.name) || _.isUndefined(vm.me.email)) {
        toastr.warning('Please input your Username and Email.', 'Sorry, we can\'t get Email.');
        return $state.go('account');
      }
    }

    function getRoom() {
      vm.me.getRooms();
      angular.forEach(vm.me.roomsData, function (room) {
        room.$loaded(function (room) {
          angular.forEach(room, function (value, key) {
            if (key !== 'guest' && key !== 'host') return;
            if (value === userId) return;
            room.you = new User(value);
          });
        });
      });
    }

    function checkPhotos() {
      vm.me.photos.$loaded(function (photos) {
        angular.forEach(vm.me.photos, function (photo) {
          var spotKey = [userId, photo.$id].join('::');
          spot.get(spotKey).$loaded(function (spot) {
            photo.isSpot = !spot.hasOwnProperty('$value');
          });
        });
      });
    }

    function removePhoto(photoId) {
      data.me.removePhoto(photoId).then(
        function (ref) {
          return toastr.success('Photo removed!');
        },
        function (error) {
          return toastr.error('Photo remove failed!');
        }
      );
    }

    function showModal(photoId) {
      var modalInstance = $uibModal.open({
        templateUrl: 'app/home/register-spot.html',
        controller: 'RegisterSpotController',
        controllerAs: 'registerSpot',
        resolve: {
          photoId: function () {
            return photoId;
          }
        }
      });
      modalInstance.result.then(
        function () {
          return toastr.success('Spot registeration completed!');
        },
        function (reason) {
          if (reason === 'cancel' || reason === 'backdrop click') return;
          return toastr.error('Spot registeration failed!', 'Error');
        }
      );
    }

    function releaseSpot(photoId) {
      data.me.releaseSpot(photoId).then(
        function (ref) {
          return toastr.success('Spot released!');
        },
        function (error) {
          return toastr.error('Spot release failed!');
        }
      );
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
          currentAuth: getCurrentAuth
        }
      });
  }

  getCurrentAuth.$inject = ['auth'];

  function getCurrentAuth(auth) {
    return auth.check(true);
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('RegisterSpotController', RegisterSpotController);

  RegisterSpotController.$inject = ['$scope', '$uibModalInstance', 'data', 'photoId', 'spot'];

  function RegisterSpotController($scope, $uibModalInstance, data, photoId, spot) {

    var _spot = {};

    var vm = this;
    vm.map = {};
    vm.addSpot = addSpot;
    vm.cancel = cancel;

    activate();

    function activate() {
      initialize();
      setMap();
      setMarker();
    }

    function initialize() {
      _spot = {
        latitude: 0,
        longitude: 0
      };
    }

    function setMap() {
      vm.map = {
        center: _spot,
        zoom: 1,
        events: {
          click: setMarkerByMapClicked
        }
      };
    }

    function setMarker() {
      vm.map.marker = {
        key: 'marker',
        coords: _spot,
        options: {
          draggable: true
        },
        events: {
          dragend: setMarkerByMarkerDraged
        }
      };
    }

    function setMarkerByMapClicked(maps, eventName, args) {
      _spot = {
        latitude: args[0].latLng.lat(),
        longitude: args[0].latLng.lng()
      };
      vm.map.marker.coords = _spot;
      $scope.$apply();
    }

    function setMarkerByMarkerDraged(marker, eventName, model, args) {
      _spot = {
        latitude: marker.position.lat(),
        longitude: marker.position.lng()
      };
    }

    function addSpot() {
      var spotKey = [data.me.$id, photoId].join('::');
      spot.add(spotKey, _.values(_spot)).then(
        function () {
          $uibModalInstance.close();
        },
        function (error) {
          $uibModalInstance.dismiss(error);
        }
      );
    }

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('AcceptController', AcceptController);

  AcceptController.$inject = ['$state', '$stateParams', 'contact', 'data', 'room', 'toastr', 'Transaction', 'User'];

  function AcceptController($state, $stateParams, contact, data, room, toastr, Transaction, User) {

    var id = $stateParams.contactId;
    var notificationId = $stateParams.notificationId;

    var vm = this;
    vm.contact = {};
    vm.accept = accept;
    vm.dontAccept = dontAccept;

    activate();

    function activate() {
      contact.get(id).$loaded().then(function (contact) {
        vm.contact = contact;
        vm.contact.guestData = new User(contact.guest);
      });
    }

    function accept() {
      var newRoomId = room.getNewRef().key();
      var saveData = {};
      var saveKey1 = 'rooms/' + newRoomId + '/guest';
      var saveKey2 = 'rooms/' + newRoomId + '/host';
      var saveKey3 = 'users/' + vm.contact.guest + '/rooms/' + newRoomId;
      var saveKey4 = 'users/' + vm.contact.host + '/rooms/' + newRoomId;
      var saveKey5 = 'users/' + vm.contact.host + '/notifications/' + notificationId;
      var saveKey6 = 'contacts/' + id;
      saveData[saveKey1] = vm.contact.guest;
      saveData[saveKey2] = vm.contact.host;
      saveData[saveKey3] = true;
      saveData[saveKey4] = true;
      saveData[saveKey5] = null;
      saveData[saveKey6] = null;
      Transaction.save(saveData).then(
        function (ref) {
          toastr.success('承認しました');
          return $state.go('room', {
            roomId: newRoomId
          });
        },
        function (error) {
          return toastr.error('承認できませんでした');
        }
      );
    }

    function dontAccept() {
      var saveData = {};
      var saveKey1 = 'users/' + vm.contact.host + '/notifications/' + notificationId;
      var saveKey2 = 'contacts/' + id;
      saveData[saveKey1] = null;
      saveData[saveKey2] = null;
      Transaction.save(saveData).then(
        function (ref) {
          toastr.success('拒否しました');
          return $state.go('home');
        },
        function (error) {
          return toastr.error('拒否できませんでした');
        }
      );
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('ContactController', ContactController);

  ContactController.$inject = ['$rootScope', '$stateParams', '$uibModalInstance', 'contact', 'user', 'userId'];

  function ContactController($rootScope, $stateParams, $uibModalInstance, contact, user, userId) {

    var hostName = $stateParams.userId;

    var vm = this;
    vm.status = {};
    vm.place = '';
    vm.date = new Date();
    vm.openCalendar = openCalendar;
    vm.cancel = cancel;
    vm.ok = ok;

    activate();

    function activate() {
      vm.status.opened = false;
    }

    function openCalendar($event) {
      vm.status.opened = true;
    }

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    function ok() {
      userId.get(hostName).$loaded().then(function (userId) {
        var hostId = userId.$value;
        var guestId = $rootScope.statuses.userId;
        var contactData = {
          place: vm.place,
          date: vm.date.toString(),
          host: hostId,
          guest: guestId
        };
        contact.add(contactData).then(function (ref) {
          var notificationData = {
            from: guestId,
            contactId: ref.key(),
            created: new Date().toString()
          };
          user.addNotification(hostName, notificationData).then(function (ref) {
            $uibModalInstance.close();
          }, function (error) {
            $uibModalInstance.dismiss(error);
          });
        }, function (error) {
          $uibModalInstance.dismiss(error);
        });
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').controller('HostsController', HostsController);

  HostsController.$inject = ['$interval', '$q', '$rootScope', '$stateParams', '$uibModal', 'currentAuth', 'data', 'language', 'photo', 'Photo', 'toastr', 'user', 'utility'];

  function HostsController($interval, $q, $rootScope, $stateParams, $uibModal, currentAuth, data, language, photo, Photo, toastr, user, utility) {

    var _userName = $stateParams.userId;

    var vm = this;
    vm.isMe = data.me.name === _userName;
    vm.isFavorited = false;
    vm.user = {};
    vm.userLanguages = [];
    vm.userPhotos = [];
    vm.userMessages = [];
    vm.addFavorite = addFavorite;
    vm.removeFavorite = removeFavorite;
    vm.showModal = showModal;

    activate();

    function activate() {
      getUserData().then(function () {
        checkFavorited();
        vm.user.getLanguages();
        // vm.user.age = _.isUndefined(user.birth) ? null : Math.floor(moment(new Date()).diff(moment(user.birth), 'years', true));
      });
    }

    function getUserData() {
      var deferred = $q.defer();
      utility.getUserByName(_userName).then(function (user) {
        vm.user = user;
        return deferred.resolve();
      });
      return deferred.promise;
    }

    function getUserLanguages() {
      var deferred = $q.defer();
      var promises = [];
      angular.forEach(vm.user.languages, function (value, key) {
        promises.push((function () {
          var deferred = $q.defer();
          language.get(key).$loaded().then(function (language) {
            vm.userLanguages.push(language.$value);
            return deferred.resolve();
          });
          return deferred.promise;
        })());
      });
      $q.all(promises).then(function () {
        return deferred.resolve();
      });
      return deferred.promise;
    }

    function getUserPhotos() {
      var deferred = $q.defer();
      var promises = [];
      angular.forEach(vm.user.photos, function (value, key) {
        promises.push((function () {
          var deferred = $q.defer();
          photo.get(key).$loaded().then(function (photo) {
            vm.userPhotos.push(photo);
            return deferred.resolve();
          });
          return deferred.promise;
        })());
      });
      $q.all(promises).then(function () {
        return deferred.resolve();
      });
      return deferred.promise;
    }

    function checkFavorited() {
      user.get($rootScope.statuses.userId).$loaded().then(function (user) {
        if (_.isUndefined(user.favorites)) {
          vm.isFavorited = false;
          return;
        }
        vm.isFavorited = !_.isUndefined(user.favorites[vm.user.$id]);
      });
    }

    function addFavorite() {
      user.addFavorite(vm.user.$id).then(function (ref) {
        user.addFavoritedCount(vm.user.$id).then(function (ref) {
          vm.isFavorited = true;
          return toastr.success('お気に入りに追加しました');
        });
      });
    }

    function removeFavorite() {
      user.removeFavorite(vm.user.$id).then(function (ref) {
        user.removeFavoritedCount(vm.user.$id).then(function (ref) {
          vm.isFavorited = false;
          return toastr.success('お気に入りを解除しました');
        });
      });
    }

    function showModal() {
      var modalInstance = $uibModal.open({
        templateUrl: 'app/hosts/contact.html',
        controller: 'ContactController',
        controllerAs: 'contact'
      });
      modalInstance.result.then(
        function () {
          return toastr.success('送信しました');
        },
        function (reason) {
          if (reason === 'cancel') return;
          return toastr.error('送信できませんでした', 'Error');
        }
      );
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
          currentAuth: getCurrentAuth
        }
      })
      .state('accept', {
        url: '/accept/:contactId::notificationId',
        controller: 'AcceptController',
        controllerAs: 'accept',
        templateUrl: 'app/hosts/accept.html',
        resolve: {
          currentAuth: getCurrentAuth
        }
      });
  }

  getCurrentAuth.$inject = ['auth'];

  function getCurrentAuth(auth) {
    return auth.check(true);
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

  HeaderController.$inject = ['$rootScope', '$scope', '$state', '$translate', 'auth', 'data', 'User'];

  function HeaderController($rootScope, $scope, $state, $translate, auth, data, User) {

    var vm = this;
    vm.rootScope = $rootScope;
    vm.data = data;
    vm.notifications = [];
    vm.changeLocale = changeLocale;
    vm.onNotificationClick = onNotificationClick;
    vm.logout = logout;
    vm.isLoggedIn = isLoggedIn;

    activate();

    function activate() {
      $scope.$watch('header.data.me', function (me) {
        angular.forEach(me.notifications, function (notification, notificationId) {
          notification.id = notificationId;
          vm.notifications.push(notification);
          notification.sender = new User(notification.from);
        });
      });
    }

    function changeLocale(langKey) {
      $translate.use(langKey);
    }

    function onNotificationClick(notification) {
      $state.go('accept', {
        contactId: notification.contactId,
        notificationId: notification.id
      });
    }

    function isLoggedIn() {
      return _.size(data.me);
    }

    function logout() {
      auth.logout();
      $state.go('spots');
    }
  }
})();

(function () {
  'use strict';

  angular.module('app').directive('chat', chat);

  chat.$inject = [];

  function chat() {
    return {
      templateUrl: 'app/room/chat.html',
      scope: {
        roomId: '='
      },
      controller: ChatController,
      controllerAs: 'chat',
      bindToController: true
    };
  }

  ChatController.$inject = ['$rootScope', 'room', 'user'];

  function ChatController($rootScope, room, user) {

    var vm = this;
    vm.isMessagesLoaded = false;
    vm.postMessage = postMessage;

    activate();

    function activate() {
      getRoom();
      room.getMessages(vm.roomId).$watch(getRoom);
    }

    function getRoom() {
      room.get(vm.roomId).$loaded().then(function (room) {
        vm.messages = room.messages;
        getYourData(room);
        angular.forEach(room.messages, function (message) {
          message.isMe = message.userId === $rootScope.statuses.userId;
        });
        vm.isMessagesLoaded = true;
      });
    }

    function getYourData(room) {
      angular.forEach(room, function (value, key) {
        if (key !== 'guest' && key !== 'host') return;
        if (value === $rootScope.statuses.userId) return;
        user.get(value).$loaded().then(function (user) {
          vm.you = user;
        });
      });
    }

    function postMessage() {
      var postData = {
        message: vm.newMessage,
        userId: $rootScope.statuses.userId
      };
      room.postMessage(vm.roomId, postData).then(function (ref) {
        vm.newMessage = '';
      });
    }
  }
})();

(function () {
  'use strict';

  angular.module('app.room').controller('RoomController', RoomController);

  RoomController.$inject = ['$rootScope', '$stateParams', 'data', 'photo', 'room', 'Room', 'user', 'User'];

  function RoomController($rootScope, $stateParams, data, photo, room, Room, user, User) {

    var id = $stateParams.roomId;

    var vm = this;
    vm.room = new Room(id);

    activate();

    function activate() {
      vm.room.$loaded(function (room) {
        angular.forEach(['guest', 'host'], function (type) {
          if (room[type] === data.me.$id) {
            room[type] = data.me;
            room.me = type;
          } else {
            room[type] = new User(room[type]);
          }
        });
      });
      vm.schedule = [];
      setCalendarConfig();
      vm.schedule.push([{
        title: 'Open Sesame',
        start: new Date(2015, 11, 28),
        // end: new Date(2015, 11, 29),
        allDay: true,
        className: ['openSesame']
      }]);
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
          currentAuth: getCurrentAuth
        }
      });
  }

  getCurrentAuth.$inject = ['auth'];

  function getCurrentAuth(auth) {
    return auth.check(true);
  }
})();

(function () {
  'use strict';

  angular.module('app.spots').controller('SpotsController', SpotsController);

  SpotsController.$inject = ['$q', '$rootScope', '$scope', 'currentAuth', 'language', 'photo', 'spot', 'uiGmapGoogleMapApi', 'user'];

  function SpotsController($q, $rootScope, $scope, currentAuth, language, photo, spot, uiGmapGoogleMapApi, user) {

    var _bounds = {};
    var _isDragging = false;

    var vm = this;
    vm.me = currentAuth;
    vm.isLoading = false;
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
      vm.map.center = {
        latitude: 0,
        longitude: 0
      };
      vm.map.zoom = 3;
      vm.map.events = {
        bounds_changed: boundsChanged,
        drag: drag,
        dragend: dragend
      };
      vm.map.bounds = {
        northeast: {
          latitude: 180,
          longitude: 180
        },
        southwest: {
          latitude: -180,
          longitude: -180
        }
      };
    }

    function setMapHeight() {
      var contentHeight = window.innerHeight - 58 - 25;
      angular.element(document).find('.angular-google-map-container').css({ height: contentHeight + 'px' });
    }

    function boundsChanged(map) {
      if (_isDragging) return;
      if (vm.isLoading) return;
      getBounds(map);
      getSpots();
    }

    function drag() {
      _isDragging = true;
    }

    function dragend(map) {
      _isDragging = false;
      if (vm.isLoading) return;
      getBounds(map);
      getSpots();
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

    function setSearchbox() {
      vm.searchbox = {
        template: 'app/spots/searchbox.html',
        events: {
          places_changed: placesChanged
        },
        position: 'top-right'
      };
    }

    function placesChanged(searchBox) {
      var place = searchBox.getPlaces();
      if (!place || place === 'undefined' || place.length === 0) return;
      if (_.has(place[0].geometry, 'viewport')) {
        vm.map.bounds = {
          northeast: {
            latitude: place[0].geometry.viewport.getNorthEast().lat(),
            longitude: place[0].geometry.viewport.getNorthEast().lng()
          },
          southwest: {
            latitude: place[0].geometry.viewport.getSouthWest().lat(),
            longitude: place[0].geometry.viewport.getSouthWest().lng()
          }
        };
        return;
      }
      vm.map.center = {
        latitude: place[0].geometry.location.lat(),
        longitude: place[0].geometry.location.lng()
      };
      vm.map.zoom = 17;
    }

    function getSpots() {
      vm.isLoading = true;
      vm.markers = [];
      var locations = [];
      angular.forEach(_bounds, function (points) {
        var location = [];
        angular.forEach(points, function (point) {
          location.push(point);
        });
        locations.push(location);
      });
      var distance = spot.distance(locations);
      var radius = distance / 3;
      spot.query(_.values(vm.map.center), radius).then(getSpotsSuccess, getSpotFailed);
    }

    function getSpotsSuccess(spots) {
      var promises = [];
      angular.forEach(spots, function (spot, index) {
        promises.push((function (spot, index) {
          setSpotData(spot, index);
        })(spot, index));
      });
      $q.all(promises).then(function () {
        vm.isLoading = false;
      });
    }

    function getSpotFailed(error) {
      vm.isLoading = false;
    }

    function setSpotData(spot, index) {
      var deferred = $q.defer();
      var newSpot = {};
      var ids = spot.id.split('::');
      var userId = ids[0];
      newSpot.id = ids[1];
      newSpot.latitude = spot.location[0];
      newSpot.longitude = spot.location[1];
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
      var photoKey = userId + '/' + newSpot.id;
      photo.get(photoKey).$loaded().then(function (photo) {
        newSpot.photos.push(photo);
        photo.user = {};
        return user.get(userId).$loaded().then(function (user) {
          photo.user = user;
          newSpot.userId = user.name;
          var keepGoing = true;
          angular.forEach(vm.languages, function (language) {
            if (!keepGoing) return;
            if (!language.checked) return;
            if (!_.has(newSpot.photos[0].user.languages, language.$id)) return;
            vm.markers.push(newSpot);
            keepGoing = false;
          });
          return deferred.resolve();
        });
      });
      return deferred.promise;
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
          currentAuth: getCurrentAuth
        }
      });
  }

  getCurrentAuth.$inject = ['auth'];

  function getCurrentAuth(auth) {
    return auth.check(false);
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
          currentAuth: getCurrentAuth
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
          currentAuth: getCurrentAuth
        }
      });
  }

  getCurrentAuth.$inject = ['auth'];

  function getCurrentAuth(auth) {
    return auth.check(true);
  }
})();

//# sourceMappingURL=app.js.map
