/* jshint devel:true */
(function(){
  var view = new Vue({
    el: '.application',
    data: {
      page: 'classes',
      repos: [ ],
      repo: null,
    },
    methods: {
      isPage: function(name){
        return this.page === name;
      },
      repoByName: function(name){
        return _.first(this.repos, { name: name });
      },
    }
  });

  var repos = $.getJSON('apis/github/orgs/TheIronYard--Orlando/repos.json')
    .done(function(data){
      view.repos = data.filter(function(repo){
        return repo.name.match(/^(FEE|ROR|iOS)--/);
      }).reverse();
    });

  page('/', function(context){
    view.page = 'classes';
  });

  page('/class/:repo', function(context){
    view.page = 'class';

    view.repo = context.params.repo;
  });

  page({ hashbang: true });

})();
