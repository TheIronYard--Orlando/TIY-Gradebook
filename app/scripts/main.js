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
    .config(function(RestangularProvider, API){
      RestangularProvider.setBaseUrl(API.base);
      RestangularProvider.setRequestSuffix('.json');
    })
    .constant('API', {
      base: 'apis/github',
      org: 'TheIronYard--Orlando',
    })
    .controller('ClassList', function(Restangular, API){
      this.repos = Restangular.one('orgs', API.org).all('repos')
        .getList().$object;

      this.classes = function(repo){
        return repo.name.match(/^(FEE|ROR|iOS)--/);
      }
    })
    .controller('ClassDetail', function(Restangular, API, $stateParams){
      var repo = Restangular
        .one('repos', API.org)
        .one($stateParams.repo)

      this.repo = repo.get().$object;

      this.milestones = repo.getList('milestones', {
        state: 'all'
      }).$object;

      var self = this;

      repo.getList('issues', {
        state: 'all',
        milestone: '*',
      }).then(function(issues){
        self.issues = _(issues)
          .filter(function(issue){
            return issue.labels.length;
          })
          .groupBy(function(issue){
            return _.pluck(issue.labels, 'name').toString();
          })
        .value();
      })
    })
    .controller('AssignmentList', function(){
    })
    .controller('AssignmentDetail', function(){
    })
    .controller('StudentList', function(){
    })
  ; // END module(tiy-gradebook)
})();
