'use strict';

angular
    .module('progressClientApp', [
        'ngCookies',
        'ngSanitize',
        'ui.router',
        'restangular',
        'angularMoment',
        'cgBusy',
        'http-auth-interceptor',
        'ui.bootstrap'
    ]).value('cgBusyDefaults', {
        message: 'Loading',
        // backdrop: false,
        // templateUrl: 'my_custom_template.html',
        // delay: 300,
        // minDuration: 700
    }).run(function($rootScope, $modal, User, authService, Restangular) { // instance-injector
        $rootScope.$on('event:auth-loginRequired', function() {
            var modalInstance = $modal.open({
                templateUrl: 'views/login-modal.html',
                controller: ['$scope', '$modalInstance',
                    function($scope, $modalInstance) {
                        console.log('got to here!');
                        $scope.login = function(user) {
                            Restangular.all('users').login(user).then(function(currentUser) {
                                // $rootscope.currentUser = user;
                                // User.login(user).then(function() {
                                $modalInstance.close(currentUser);
                            });
                        };
                    }
                ],
            });

            modalInstance.result.then(function(currentUser) {
                // $scope.selected = selectedItem;
                $rootScope.currentUser = currentUser;
                authService.loginConfirmed();
            }, function() {
                // $log.info('Modal dismissed at: ' + new Date());
            });
        });
    }).config(function($stateProvider, $urlRouterProvider, RestangularProvider) {
        console.log('host name', document.location.hostname);

        if (document.location.hostname === '127.0.0.1' || document.location.hostname === 'localhost') {
            RestangularProvider.setBaseUrl('api/index.php');
        } else {
            RestangularProvider.setBaseUrl('http://ec2-54-206-66-123.ap-southeast-2.compute.amazonaws.com/progress/api/index.php');
        }

        RestangularProvider.addElementTransformer('users', true, function(user) {
            user.addRestangularMethod('login', 'post', 'login');
            return user;
        });

        RestangularProvider.setDefaultHeaders({'Content-Type': undefined});


        // RestangularProvider.setDefaultHttpFields({
        //     withCredentials: true,
        //     useXDomain: true
        // });

        // RestangularProvider.setDefaultHeaders({
        //     'Content-Type': 'application/json',
        //     'X-Requested-With': 'XMLHttpRequest'
        // });

        RestangularProvider.setDefaultHttpFields({
            'withCredentials': true
        });
        /*
            
            splash - info about it
            register - sign up
            user/id - stuff about a user
            user/id/project/id - stuff about a project
            me/feed - view your feed
            me/user/id/edit - edit your profile

         */
        // profile page - user/id
        // /me
        // /feed
        // 

        // $httpProvider.defaults.useXDomain = true;
        // delete $httpProvider.defaults.headers.common['X-Requested-With'];
        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise('/');
        //
        // Now set up the states
        $stateProvider
            .state('me', {
                url: '/me',
                abstract: true,
                template: '<ui-view></ui-view>'
            })
            .state('me.feed', {
                url: '/feed',
                resolve: {
                    user: ['Restangular', '$rootScope',
                        function(Restangular, $rootScope) {
                        return Restangular.one('me').one('user').get().then(function(currentUser) {
                            $rootScope.currentUser = currentUser;
                        });
                    }]
                },
                controller: 'FeedCtrl',
                templateUrl: 'views/feed.html'
            })
            .state('home', {
                url: '/',
                controller: 'FeedCtrl',
                templateUrl: 'views/feed.html'
            })
            .state('user', {
                abstract: true,
                url: '/users/:userId',
                template: '<ui-view></ui-view>'
            })
            .state('user.projects', {
                url: '/projects',
                resolve: {
                    projects: ['Restangular', '$stateParams',
                        function(Restangular, $stateParams) {
                            return Restangular.one('users', $stateParams.userId).all('projects').getList();
                        }
                    ],
                },
                controller: 'ProjectsCtrl',
                templateUrl: 'views/projects.html'
            })
            .state('user.project', {
                url: '/projects/:projectId',
                resolve: {
                    project: ['Restangular', '$stateParams',
                        function(Restangular, $stateParams) {
                            return Restangular.one('users', $stateParams.userId).one('projects', $stateParams.projectId).get();
                        }
                    ],
                    posts: ['Restangular', '$stateParams',
                        function(Restangular, $stateParams) {
                            return Restangular.one('users', $stateParams.userId).one('projects', $stateParams.projectId).all('posts').getList();
                        }
                    ]
                },
                controller: 'ProjectCtrl',
                templateUrl: 'views/project.html'
            });
    });
