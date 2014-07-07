/* global module, require, console */

module.exports = function(grunt) {
    var changeVersion = function(fname, version) {
        var contents = grunt.file.readJSON(fname),
            current = contents.version;

        contents.version = version;
        grunt.file.write(fname, JSON.stringify(contents, null, 2));
        grunt.log.ok(fname + ': ' + current + ' => ' + version);
    };

    var replaceVersion = function(fname, current, version) {
        var options = {encoding: 'utf8'},
            content = grunt.file.read(fname, options),
            regexp = new RegExp("version: '" + current + "'");

        if (!regexp.test(content)) {
            grunt.fatal('File contents does not match version');
        }

        content = content.replace(regexp, "version: '" + version + "'");
        grunt.file.write(fname, content, options);
        grunt.log.ok('' + fname + ': ' + current + ' => ' + version);
    };

    var run = function(cmd) {
        grunt.log.ok(cmd);
        shell.exec(cmd);
    };

	var shell = require('shelljs');

	var pkg = grunt.file.readJSON('package.json');

    var vendorModules = [
        'jquery',
        'backbone',
        'underscore',
        'marionette',
        'bootstrap',
        'loglevel'
    ];

    grunt.initConfig({
        pkg: pkg,

        srcDir: 'src',
        specDir: 'spec',
        localDir: 'local',
        buildDir: 'build',
        distDir: 'dist',
        cdnDir: 'cdn',

        serve: {
            local: {
                options: {
                    base: 'local/',
                    keepalive: true,
                    port: 8125
                }
            },
            dist: {
                options: {
                    base: 'dist/',
                    keepalive: true,
                    port: 8125
                }
            },
            jasmine: {
                options: {
                    port: 8126
                }
            }
        },

        watch: {
            grunt: {
                tasks: ['local'],
                files: ['Gruntfile.js']
            },
            copy: {
                tasks: ['copy:local'],
                files: [
                    '<%= srcDir %>/index.html',
                    '<%= srcDir %>/js/**/**/**/*',
                    '<%= srcDir %>/css/**/**/**/*',
                    '<%= srcDir %>/fonts/**/**/**/*',
                    '<%= srcDir %>/img/**/**/**/*',
                    '<%= srcDir %>/templates/**/**/**/*',
                ]
            },
            tests: {
                tasks: ['jasmine:local:build'],
                files: ['<%= specDir %>/**/**/**/*']
            },
            sass: {
                tasks: ['sass:local'],
                files: ['<%= srcDir %>/scss/**/**/**/*']
            }
        },
        sass: {
            options: {
                sourcemap: true
            },
            local: {
                options: {
                    trace: true,
                    style: 'expanded'
                },
                files: {
                    '<%= localDir %>/css/almanac.css': '<%= srcDir %>/scss/almanac.scss'
                }
            },
            dist: {
                options: {
                    quiet: true,
                    style: 'compressed'
                },
                files: {
                    '<%= distDir %>/css/almanac.css': '<%= srcDir %>/scss/almanac.scss'
                }
            },
            cdn: {
                options: {
                    quiet: true,
                    sourcemap: false,
                    style: 'compressed'
                },
                files: {
                    '<%= cdnDir %>/css/almanac.css': '<%= srcDir %>/scss/almanac.scss'
                }
            }
        },
        copy: {
            local: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= srcDir %>',
                        src: ['index.html'],
                        dest: '<%= localDir %>'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/js',
                        src: ['**/*'],
                        dest: '<%= localDir %>/js'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/css',
                        src: ['**/*'],
                        dest: '<%= localDir %>/css'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/fonts',
                        src: ['**/*'],
                        dest: '<%= localDir %>/fonts'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/img',
                        src: ['**/*'],
                        dest: '<%= localDir %>/img'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/templates',
                        src: ['**/*'],
                        dest: '<%= localDir %>/js/templates'
                    }, {
                        expand: true,
                        src: ['bower.json', 'package.json'],
                        dest: '<%= localDir %>'
                    }
                ]
            },

            build: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= srcDir %>/templates',
                        src: ['**/*'],
                        dest: '<%= buildDir %>/js/templates'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/js',
                        src: ['**/*'],
                        dest: '<%= buildDir %>/js'
                    }
                ]
            },

            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= srcDir %>',
                        src: ['index.html'],
                        dest: '<%= distDir %>'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/css',
                        src: ['**/*'],
                        dest: '<%= distDir %>/css'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/fonts',
                        src: ['**/*'],
                        dest: '<%= distDir %>/fonts'
                    }, {
                        expand: true,
                        cwd: '<%= srcDir %>/img',
                        src: ['**/*'],
                        dest: '<%= distDir %>/img'
                    }, {
                        expand: true,
                        src: ['bower.json', 'package.json'],
                        dest: '<%= distDir %>'
                    }
                ]
            },

            cdn: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= srcDir %>',
                        src: ['index.html'],
                        dest: '<%= cdnDir %>'
                    }
                ]
            }
        },

        requirejs: {
            options: {
                mainConfigFile: '<%= srcDir %>/js/almanac/main.js',
                baseUrl: '.',
                inlineText: true,
                preserveLicenseComments: false,
                wrap: false,
                logLevel: 1,
                throwWhen: {
                    optimize: true
                },
                modules: [
                    {
                        name: pkg.name,
                        exclude: vendorModules
                    }
                ]
            },

            dist: {
                options: {
                    appDir: '<%= buildDir %>/js',
                    dir: '<%= distDir %>/js',
                    optimize: 'uglify2',
                    generateSourceMaps: true,
                    removeCombined: false
                }
            },

            cdn: {
                options: {
                    appDir: '<%= buildDir %>/js',
                    dir: '<%= cdnDir %>/js',
                    optimize: 'uglify2',
                    generateSourceMaps: false,
                    removeCombined: true
                }
            }
        },

        clean: {
            local: ['<%= localDir %>'],
            build: ['<%= buildDir %>'],
            dist: ['<%= distDir %>'],
            cdn: ['<%= cdnDir %>'],
            postdist: ['<%= distDir %>/js/templates'],
            postcdn: [
                '<%= cdnDir %>/js/templates',
                '<%= cdnDir %>/js/require.js'
            ].concat(vendorModules.map(function(mod) {
                return '<%= cdnDir %>/js/' + mod + '.js';
            })),
            release: [
                '<%= localDir %>/js/build.txt',
                '<%= distDir %>/js/build.txt',
                '<%= cdnDir %>/js/build.txt'
            ]
        },

        jasmine: {
            options: {
                specs: '<%= specDir %>/**/**/**/*.js',
                host: 'http://127.0.0.1:8126',
                helpers: './specConfig.js',
                keepRunner: true,
                template: require('grunt-template-jasmine-requirejs'),
                templateOptions: {
                    version: '<%= srcDir %>/js/require.js'
                }
            },

            local: {
                options: {
                    templateOptions: {
                        requireConfigFile: '<%= localDir %>/js/almanac/main.js',
                        requireConfig: {
                            baseUrl: '<%= localDir %>/js'
                        }
                    }
                }
            },

            dist: {
                options: {
                    templateOptions: {
                        requireConfigFile: '<%= distDir %>/js/almanac/main.js',
                        requireConfig: {
                            baseUrl: '<%= distDir %>/js'
                        }
                    }
                }
            }
        },

        amdcheck: {
            local: {
                options: {
                    removeUnusedDependencies: false
                },
                files: [
                    {
                        expand: true,
                        src: ['<%= localDir %>/js/**/**/**/**/*.js']
                    }
                ]
            }
        },

        jshint: {
            options: {
                camelcase: true,
                immed: true,
                indent: 4,
                latedef: true,
                noarg: true,
                noempty: true,
                undef: true,
                unused: true,
                trailing: true,
                maxdepth: 3,
                browser: true,
                eqeqeq: true,
                globals: {
                    define: true,
                    require: true
                },
                reporter: require('jshint-stylish'),
                ignores: [
                    '<%= srcDir %>/js/backbone.js',
                    '<%= srcDir %>/js/bootstrap.js',
                    '<%= srcDir %>/js/jquery.js',
                    '<%= srcDir %>/js/loglevel.js',
                    '<%= srcDir %>/js/marionette.js',
                    '<%= srcDir %>/js/require.js',
                    '<%= srcDir %>/js/text.js',
                    '<%= srcDir %>/js/tpl.js',
                    '<%= srcDir %>/js/underscore.js'
                ]
            },
            src: ['<%= srcDir %>/js/**/**/**/**/*.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-amdcheck');

    grunt.registerMultiTask('serve', 'Run a Node server for testing', function() {
        var http = require('http'),
            path = require('path'),
            url = require('url'),
            fs = require('fs');

        var contentTypes = {
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.html': 'text/html'
        };

        var options = this.options({
            hostname: 'localhost',
            base: '.',
            port: 8125,
            keepalive: false
        });

        var serveResponse = function(filename, response) {
            var extname = path.extname(filename),
                contentType = contentTypes[extname] || 'text/plain',
                stream = fs.createReadStream(filename);

            response.writeHead(200, {
                'Content-Type': contentType
            });

            stream.pipe(response);
        };

        var serve404 = function(filename, response) {
            response.writeHead(404);
            response.end();
        };

        var serve500 = function(filename, response) {
            response.writeHead(500);
            response.end();
        };

        var server = http.createServer(function(request, response) {
            var pathname = url.parse(request.url).pathname, filename;

            if (path.extname(pathname) === '') {
                filename = path.join(options.base, 'index.html');
            } else {
                filename = path.join(options.base, pathname);
            }

            fs.exists(filename, function(exists) {
                if (exists) {
                    fs.readFile(filename, function(error) {
                        if (error) {
                            if (error.code === 'EISDIR') {
                                filename += 'index.html';
                                fs.exists(filename, function(exists) {
                                    if (exists) {
                                        fs.readFile(filename, function(error) {
                                            if (error) {
                                                serve500(filename, response);
                                            } else {
                                                serveResponse(filename, response);
                                            }
                                        });
                                    } else {
                                        serve404(filename, response);
                                    }
                                });
                            } else {
                                serve500(filename, response);
                            }
                        } else {
                            serveResponse(filename, response);
                        }
                    });
                } else {
                    serve404(filename, response);
                }
            });
        });

        if (options.hostname === '*') options.hostname = null;
        if (options.port === '?') options.port = 0;

        var done = this.async();

        server.listen(options.port, options.hostname).on('listening', function() {
            var address, hostname;
            address = server.address();
            hostname = server.hostname || 'localhost';
            if (!options.keepalive) {
                done();
            } else {
                grunt.log.writeln('Listening on ' + hostname + ':' +
                                  address.port + '...');
            }
        }).on('error', function(error) {
            if (error.code === 'EADDRINUSE') {
                grunt.fatal('Port ' + options.port +
                                   ' is already in use by another process.');
            } else {
                grunt.fatal(error);
            }
        });
    });

    grunt.registerTask('local', 'Creates a build for local development and testing', [
        'sass:local',
        'copy:local',
        'jasmine:local:build'
    ]);

    grunt.registerTask('dist', 'Creates a build for distribution', [
        'clean:build',
        'copy:build',
        'clean:dist',
        'requirejs:dist',
        'sass:dist',
        'copy:dist',
        'clean:postdist'
    ]);

    grunt.registerTask('cdn', 'Creates a build for CDN distribution', [
        'clean:build',
        'copy:build',
        'clean:cdn',
        'requirejs:cdn',
        'sass:cdn',
        'copy:cdn',
        'clean:postcdn'
    ]);

    grunt.registerTask('work', 'Local build and starts a watch process', [
        'local',
        'watch'
    ]);

    grunt.registerTask('test', 'Runs the headless test suite', [
        'copy:local',
        'serve:jasmine',
        'jasmine:local'
    ]);

    grunt.registerTask('bump-final', 'Updates the version to final', function() {
        var svutil = require('semver-utils');

        var current = pkg.version,
            version = svutil.parse(pkg.version);

        if (version.release !== 'beta') {
            grunt.fatal('Version ' + current + ' not beta. Is this ready for release?');
        }

        version.release = '';
        version.build = '';

        pkg.version = svutil.stringify(version);

        replaceVersion('src/js/almanac/core.js', current, pkg.version);

        ['package.json', 'bower.json'].map(function(mod) {
            return changeVersion(mod, pkg.version);
        });
    });

    grunt.registerTask('bump-patch', 'Bumps version to next patch-release', function() {
        var svutil = require('semver-utils');

        var current = pkg.version,
            version = svutil.parse(pkg.version);

        console.log(version.release);

        if (version.release) {
            grunt.fatal('Version ' + current + ' not final. ' +
                        'Should this be bumped to a pre-release?');
        }

        version.patch = '' + (parseInt(version.patch, 10) + 1);
        version.release = 'beta';
        version.build = '';

        pkg.version = svutil.stringify(version);

        replaceVersion('src/js/almanac/core.js', current, pkg.version);

        ['package.json', 'bower.json'].map(function(mod) {
            changeVersion(mod, pkg.version);
        });

        run('git add bower.json package.json src/js/almanac/core.js');

        var versionString = [version.major, version.minor, version.patch].join('.');

        run('git commit -s -m "' + versionString + ' Beta"');
    });

    grunt.registerTask('tag-release', 'Create a release on master', function() {
        run('git add bower.json package.json src/js/almanac/core.js');
        run('git commit -s -m "' + pkg.version + ' Release"');
        run('git tag ' + pkg.version);
    });

    grunt.registerTask('release-binaries', 'Create a release binary', function() {
        var releaseDirName = pkg.name + '-' + pkg.version;

        run('rm -rf ' + pkg.name);
        run('mkdir -p ' + pkg.name);
        run('cp -r dist/* ' + pkg.name);
        run('zip -r ' + releaseDirName + '.zip ' + pkg.name);
        run('tar -Hzcf ' + releaseDirName + '.tar.gz ' + pkg.name);
        run('rm -rf ' + pkg.name);
        run('mkdir -p ' + pkg.name);
        run('cp -r local/* ' + pkg.name);
        run('zip -r ' + releaseDirName + '-src.zip ' + pkg.name);
        run('tar -Hzcf ' + releaseDirName + '-src.tar.gz ' + pkg.name);
        run('rm -rf ' + pkg.name);
    });

    grunt.registerTask('release-help', 'Prints the post-release steps', function() {
        grunt.log.ok('Push the code and tags: git push && git push --tags');
        grunt.log.ok('Go to ' + pkg.homepage + '/releases to update the release ' +
                     'descriptions and upload the binaries');
        grunt.log.ok('The CDN-ready files have been updated');
    });

    grunt.registerTask('release', 'Builds the distribution files, creates the ' +
                                  'release binaries, and creates a Git tag', [
        'bump-final',
        'local',
        'dist',
        'cdn',
        'clean:release',
        'release-binaries',
        'tag-release',
        'release-help',
        'bump-patch'
    ]);
};
