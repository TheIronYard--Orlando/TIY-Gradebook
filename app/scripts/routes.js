;(function(){
  'use strict';

  angular.module('tiy-gradebook')
    .run(function($rootScope, $state){
      $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error){
        if ( error === 'AUTH_REQUIRED' ){
          return $state.go('login');
        }
      });
    }) // END run(redirect to login)
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
        }) // END state(classes)
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
    }) // END config($stateProvider)
  ; // END module(tiy-gradebook)
})();
