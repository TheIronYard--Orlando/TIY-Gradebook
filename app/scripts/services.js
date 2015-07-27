/*global Firebase*/
;(function(){
  'use strict';

  angular.module('tiy-gradebook')
    /**
     * Constant for defining API routes and parameters...
     *
     * @todo Refactor to `gulp-ng-config` https://www.npmjs.com/package/gulp-ng-config
     * @property {Object} github
     * @property {Object} firebase
     */
    .constant('API', {
      github: {
        //base: 'apis/github/', suffix: '.json',
        base: 'https://api.github.com/',
        org: 'TheIronYard--Orlando',
      },
      firebase: {
        base: 'https://tiy-gradebook.firebaseio.com'
      }
    }) // END constant(API)

    /**
     * Custom (value) service to set the root `Firebase` instance...
     */
    .factory('Firebase', function(API){
      return new Firebase(API.firebase.base);
    })

    /**
     * Custom authentication service that configures the `Github` service...
     *
     * @method {Boolean} isAuthd
     * @method {$q.Promise} login -- via `$firebaseAuth.$authWithOAuthPopup`
     * @method {$q.Promise} logout -- via `$firebaseAuth.$unauth`
     * @method {$q.Promise} required -- via `$firebaseAuth.$authRequired`
     * @method {$q.Promise} me -- via `Restangular`
     */
    .factory('Auth', function($q, $firebaseAuth, Github){
      // Add the `Authorization` header for Github requests...
      $firebaseAuth.$onAuth(function(auth){
        addAccessTokenFromAuth(auth);
      });

      return {
        isAuthd: function(){
          return !!$firebaseAuth.$getAuth();
        },
        login: function(){
          var self = this;

          return $firebaseAuth.$authWithOAuthPopup('github')
            .then(function(){
              return self.me();
            });
        },
        logout: function(){
          // Y U NO GIVE PROMISE $unauth!?
          return $q.when($firebaseAuth.$unauth());
        },
        required: function(){
          return $firebaseAuth.$requireAuth()
            .then(addAccessTokenFromAuth);
        },
        me: function(){
          return this.isAuthd() && Github.one('user').get();
        }
      }; // END return

      /**
       * @param {String} token from Github OAuth dance
       * @return undefined
       */
      function addAuthHeader(token){
        Github.setDefaultHeaders(token && {
          Authorization: 'token ' + token
        } || { });
      }

      /**
       * @param {Object} auth object from Firebase
       * @return undefined|String access token from Github
       */
      function extractAccessToken(auth){
        return auth && auth.github && auth.github.accessToken;
      }

      /**
       * @param {Object} auth object from Firebase
       * @return undefined
       */
      function addAccessTokenFromAuth(auth){
        addAuthHeader(extractAccessToken(auth));
      }
    }) // END factory(Auth)

    /**
     * Configue a `Restangular` instance with a Github-specific API...
     */
    .factory('Github', function(Restangular, API){
      return Restangular.withConfig(function(RestangularConfigurer){
        RestangularConfigurer
          .setBaseUrl(API.github.base)
          .setRequestSuffix(API.github.suffix)
          .extendCollection('classes', function(repos){
            // https://github.com/mgonto/restangular/issues/1011
            if ( !repos.fromServer ) {
              return repos;
            }

            return _(repos)
              .filter(function(repo){
                return repo.name.match(/(FEE|ROR|iOS)/);
              })
              .sortByOrder('updated_at', false)
            .value();
          })
          .extendCollection('issues', function(issues){
            return angular.extend(issues, _.groupBy(issues, function(issue){
              return _.pluck(issue.labels, 'name').toString() || 'none';
            }), { total: issues.length });
          })
          .extendCollection('labels', function(labels){
            return _.filter(labels, function(label){
              return label.name !== 'Attendance';
            });
          })
        ; // END RestangularConfigurer
      });
    }) // END factory(Github)

    /**
     * Configure `$firebaseAuth` to use the `Firebase` reference...
     *
     * Since `$firebaseAuth` can only be used _once_ within an application,
     * there's not much use to the service unless it's initialized. Until
     * `$firebaseAuthProvider` allows for that, this decorator yields an
     * initialized instance instead of the general API.
     */
    .decorator('$firebaseAuth', /*@ngInject*/ function($delegate, Firebase){
      return $delegate(Firebase);
    }) // END decorator($firebaseAuth)
  ; // END module(tiy-gradebook)
})();
