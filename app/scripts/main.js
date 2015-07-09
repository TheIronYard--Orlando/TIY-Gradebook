;(function(){
  'use strict';

  angular.module('tiy-gradebook', [ 'ui.router', 'restangular', 'firebase' ])
    .run(function($rootScope){
      $rootScope.$on('$stateChangeError', function(){
        console.log('$stateChangeError', arguments);
      });
    })
    .config(function($stateProvider, $urlRouterProvider){
      $stateProvider
        .state('classes', {
          abstract: true,
          resolve: {
            authd: function(Auth){
              return Auth.isGuest() && Auth.login();
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
        base: 'apis/github/', suffix: '.json',
        //base: 'https://api.github.com/',
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
    .factory('Auth', function($firebaseAuth, Github){
      $firebaseAuth.$onAuth(function(auth){
        console.log('onAuth', auth);
        if ( !auth ) return;

        Github.setDefaultHeaders({
          Authorization: 'token ' + auth.github.accessToken
        });
      });

      return {
        login: function(){
          var self = this;

          return $firebaseAuth.$authWithOAuthPopup('github')
            .then(function(){
              return self.me();
            });
        },
        logout: function(){
          return $firebaseAuth.$unauth()
            .then(function(){
              return self.me();
            });
        },
        required: function(){
          return $firebaseAuth.$requireAuth();
        },
        me: function(){
          return Github.one('user').get();
        }
      }; // END return
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
