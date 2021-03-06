/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! \n' +
        ' * <%= pkg.title || pkg.name %>\n' +
        ' * <%= pkg.description %>\n' +
        ' * @version <%= pkg.version %> \n' +
        ' * \n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= _.pluck(pkg.authors, "name").join(", ") %> \n' +
        ' * @link <%= pkg.homepage %> \n' +
        ' * @license  <%= _.pluck(pkg.licenses, "type").join(", ") %> \n' +
        ' */ \n',
        // Task configuration.
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                src: ['.tmp/**/*.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        clean: {
            dist: '.tmp'
        },
        uglify: {
            options: {
                banner: '<%= banner %>',
                sourceMap: 'dist/<%= pkg.name %>.map'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        ngtemplates: {
            main: {
                options: {
                    module: '<%= pkg.name %>',
                    prefix: '<%= pkg.name %>/',
                    htmlmin: {
                        collapseWhitespace: true,
                        conservativeCollapse: true,
                        collapseBooleanAttributes: true,
                        removeCommentsFromCDATA: true,
                        removeOptionalTags: true,
                    }
                },
                cwd: 'src',
                src: ['**/*.html'],
                dest: '.tmp/templates.js'
            }
        },
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: ['**/*.js', '!**/*-spec.js'],
                    dest: '.tmp'
                }]
            }
        },
        less: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.css': 'src/**/*.less'
                }
            }
        },
        jshint: {
            options:{
                jshintrc: '.jshintrc'
            },
            src: {
                src: 'src/**/*.js'
            }
        },
        connect: {
            options: {
                port: 9900,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35711
            },
            dev: {
                options: {
                    middleware: function (connect) {
                        return [
                            connect.static('.tmp'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect().use(
                                '/dist',
                                connect.static('./dist')
                            ),
                            connect.static('example')
                        ];
                    }
                }
            }
        },
        watch: {
            dev: {
                files: ['src/**/*.html', 'src/**/*.js'],
                tasks: ['default'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            }
        },
        karma: {
            options: {
                frameworks: ['jasmine'],
                files: [
                    'bower_components/angular/angular.js',
                    'bower_components/lodash/lodash.js',
                    'bower_components/angular-mocks/angular-mocks.js',
                    'src/**/*.js',
                    '.tmp/templates.js'
                ],

                logLevel:'ERROR',
                reporters:['mocha'],
                autoWatch: false, //watching is handled by grunt-contrib-watch
                singleRun: true
            },
            all_tests: {
                browsers: ['PhantomJS']//,'Chrome','Firefox']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('serve', ['default', 'connect', 'watch']);

    // Default task.
    grunt.registerTask('default', [ 'clean', 'ngAnnotate', 'ngtemplates', 'concat', 'uglify', 'less']);

};
