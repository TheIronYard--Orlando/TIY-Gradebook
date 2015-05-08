;(function(){
  'use strict';

  angular.module('tiy-gradebook', [ 'ui.router', 'restangular' ])
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
      //base: 'apis/github', suffix: '.json',
      base: 'https://api.github.com/',
      org: 'TheIronYard--Orlando',
    })
    .factory('hello', function(){
      return hello.init({
        github: '57e761493a1d9a2f767a',
      })('github');
    })
    .factory('Auth', function($q, hello, Github){
      var user = { };

      return {
        isGuest: function(){
          return !Boolean(user.id);
        },
        login: function(){
          var deferred = $q.defer();

          hello.login().then(function(response){
            Github.setDefaultRequestParams({
              'access_token': response.authResponse.access_token
            });

            hello.api('me').then(function(json){
              deferred.resolve(angular.extend(user, json));
            });
          });

          return deferred.promise;
        },
        logout: function(){
          return $q(hello.logout().then);
        },
        me: function(){
          return user;
        }
      }; // END return
    })
    .factory('Github', function(Restangular, API){
      return Restangular.withConfig(function(RestangularConfigurer){
        RestangularConfigurer
          .setBaseUrl(API.base)
          .setRequestSuffix(API.suffix)
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
        .allUrl('classes', API.base + 'orgs/' + API.org + '/repos')
      .getList().$object;
    }) // END controller(ClassList)

    .controller('ClassDetail', function(Github, API, $stateParams){
      var repo = Github
        .one('repos', API.org)
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
