;(function(){
  'use strict';

  angular.module('tiy-gradebook')
    .controller('Login', function(Auth, $state){
      this.login = function(){
        Auth.login().then(function(){
          $state.go('classes.list');
        });
      };
    }) // END controller(Login)
    .controller('Classes', function(Auth, $state){
      this.logout = function(){
        Auth.logout().then(function(){
          $state.go('login');
        });
      };
    }) // END controller(Classes)
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

    }) // END controller(ClassDetail)
    .controller('AssignmentList', function(){ })
    .controller('AssignmentDetail', function(){ })
    .controller('StudentList', function(){ })
  ; // END module(tiy-gradebook)

})();
