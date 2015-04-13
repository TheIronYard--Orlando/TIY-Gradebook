;(function(){
  'use strict';

  angular.module('tiy-gradebook', [ 'ui.router', 'restangular' ])
    .config(function($stateProvider, $urlRouterProvider){
        $stateProvider
          .state('classes', {
            url: '/',
            templateUrl: 'views/classes.html',
            controller: 'ClassList as org'
          })
          .state('class', {
            url: '/class/:repo',
            templateUrl: 'views/class.html',
            controller: 'ClassDetail as class'
          })
        ; // END $stateProvider

        //$urlRouterProvider.otherwise('/');
    })
    .constant('API', {
      base: 'apis/github',
      //base: 'https://api.github.com/',
      org: 'TheIronYard--Orlando',
    })
    .factory('Github', function(Restangular, API){
      return Restangular.withConfig(function(RestangularConfigurer){
        RestangularConfigurer
          .setBaseUrl(API.base)
          .setRequestSuffix('.json')
          .extendCollection('repos', function(repos){
            return _.filter(repos, function(repo){
              return repo.name.match(/^(FEE|ROR|iOS)--/);
            });
          })
          .extendCollection('issues', function(issues){
            return angular.extend(issues, _.groupBy(issues, function(issue){
              return _.pluck(issue.labels, 'name').toString() || 'none';
            }), { total: issues.length });
          })
        ; // END RestangularConfigurer
      });
    }) // END factory(Github)
    .controller('ClassList', function(Github, API){
      this.repos = Github.one('orgs', API.org)
        .getList('repos').$object;
    })
    .controller('ClassDetail', function(Github, API, $stateParams){
      var repo = Github
        .one('repos', API.org)
        .one($stateParams.repo)

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

      var self = this;

      this.types = {
        danger: 'Incomplete',
        warning: 'Not Yet',
        success: 'Accepted',
      };

      this.percentOfType = function(issues, type){
        if ( !issues || !issues[type] ) return 0;

        return issues[type].length / issues.length * 100;
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
