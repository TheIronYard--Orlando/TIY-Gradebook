;(function(){
  'use strict';

  angular.module('tiy-gradebook', [ 'ui.router', 'restangular', 'firebase' ])
    .run(function($rootScope, $state){
      $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error){
         if ( error === 'AUTH_REQUIRED' ){
           event.preventDefault();
           return $state.go('login');
         }
      });
    })
    .config(function($stateProvider, $urlRouterProvider){
      $stateProvider
        .state('login', {
          templateUrl: 'views/login.html',
          controller: 'Login',
          controllerAs: 'app'
        })
        .state('classes', {
          abstract: true,
          controller: 'Classes',
          controllerAs: 'app',
          resolve: {
            User: function(Auth){
              return Auth.required().then(function(){
                return Auth.me();
              });
            }
          }
        })
        .state('classes.list', {
          url: '/',
          templateUrl: 'views/classes.html',
          controller: 'ClassList as org'
        })
        .state('classes.detail', {
          url: '/:repo',
          templateUrl: 'views/class.html',
          controller: 'ClassDetail as class'
        })
      ; // END $stateProvider

      $urlRouterProvider.otherwise('/');
    })
    .constant('API', {
      github: {
        // TODO: Refactor to `gulp-ng-config` https://www.npmjs.com/package/gulp-ng-config
        //base: 'apis/github/', suffix: '.json',
        base: 'https://api.github.com/',
        org: 'TheIronYard--Orlando',
      },
      firebase: {
        base: 'https://tiy-gradebook.firebaseio.com'
      }
    })
    .factory('Firebase', function(API){
      return new Firebase(API.firebase.base);
    })
    .decorator('$firebaseAuth', function($delegate, Firebase){
      return $delegate(Firebase);
    })
    .factory('Auth', function($q, $firebaseAuth, Github){
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
      } // END return

      /**
       * @param {String} token from Github OAuth dance
       * @return undefined
       */
      function addAuthHeader(token){
        Github.setDefaultHeaders(token && {
          Authorization: 'token ' + token
        } || { });
      }

      function extractAccessToken(auth){
        return auth && auth.github && auth.github.accessToken;
      }

      function addAccessTokenFromAuth(auth){
        addAuthHeader(extractAccessToken(auth));
      }

    })
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

    .controller('Login', function(Auth, $state){
      this.login = function(){
        Auth.login().then(function(){
          $state.go('classes.list');
        });
      };
    })
    .controller('Classes', function(Auth, $state){
      this.logout = function(){
        Auth.logout().then(function(){
          $state.go('login');
        });
      };
    }) // END controller(Main)

    .controller('ClassList', function(Github, API){
      this.repos = Github
        // FIXME: Gotta be a way to configure this, right?
        .allUrl('classes', API.github.base + 'orgs/' + API.github.org + '/repos')
      .getList().$object;
    }) // END controller(ClassList)

    .controller('ClassDetail', function(Github, API, $stateParams){
      var repo = Github
        .one('repos', API.github.org)
        .one($stateParams.repo);

      this.repo = repo.get().$object;

      Github.extendModel('milestones', function(milestone){
        milestone.issues = repo.getList('issues', {
          state: 'all', milestone: milestone.number
        }).$object;

        return milestone;
      });

      this.milestones = repo.getList('milestones', {
        state: 'all'
      }).$object;

      this.labels = repo.getList('labels').$object;

      this.percentOfType = function(issues, type){
        if ( !issues || !issues[type] ){
          return 0;
        }

        return (issues[type].length / issues.length * 100);
      };

    })
    .controller('AssignmentList', function(){
    })
    .controller('AssignmentDetail', function(){
    })
    .controller('StudentList', function(){
    })
  ; // END module(tiy-gradebook)
})();
